from django.shortcuts import render
from .models import Photo, Post
from django.http import JsonResponse, HttpResponse
from .forms import PostForm
from profiles.models import Profile
from .utils import action_permission
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
# Create your views here.

@login_required
def post_list_and_create(request):
      form = PostForm(request.POST or None)
      # qs = Post.objects.all()

      if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            if form.is_valid():
                  author = Profile.objects.get(user=request.user)
                  instance = form.save(commit=False)
                  instance.author = author
                  instance.save()
                  return JsonResponse({
                        'title': instance.title,
                        'description': instance.description,
                        'author': instance.author.user.username,
                        'id': instance.id,
                  })

      context = {
            'form': form,
      }
                
      return render(request,'posts/main.html', context)

@login_required
def post_detail(request, pk):
      obj = Post.objects.get(pk=pk)
      liked_users = [user.username for user in obj.liked.all()]
      form = PostForm()

      context = {
            'obj': obj,
            'form': form,
            'liked_users': liked_users,
      }

      return render(request, 'posts/detail.html', context)

@login_required
def load_post_data_view(request, num_posts):
      if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            visible = 3
            upper = num_posts
            lower = upper - visible 
            size = Post.objects.all().count() 

            qs = Post.objects.all()
            data = []

            for obj in qs:
                  item = {
                        'id': obj.id,
                        'title': obj.title,
                        'description': obj.description,
                        'liked': True if request.user in obj.liked.all() else False,
                        'count': obj.like_count,
                        'author': obj.author.   user.username,
                        'liked_users': [user.username for user in obj.liked.all()]
                  }
                  data.append(item)
            return JsonResponse({'data':data[lower:upper], 'size': size })

@login_required
def post_detail_data_view(request, pk):
      if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            obj = Post.objects.get(pk=pk)
            data = {
                  'id': obj.id,
                  'title': obj.title,
                  'description': obj.description,
                  'author': obj.author.user.username,
                  'logged_in': request.user.username,
                  'liked_users': [user.username for user in obj.liked.all()],

            }
            return JsonResponse({'data': data})
      return redirect('posts:main-board')


@login_required
def like_unlike_post(request):
      if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            pk = request.POST.get('pk')
            obj = Post.objects.get(pk=pk)
            if request.user in obj.liked.all():
                  liked = False
                  obj.liked.remove(request.user)
            else:
                  liked = True
                  obj.liked.add(request.user)
            return JsonResponse({'liked': liked, 'count': obj.like_count})
      return redirect('posts:main-board')

@login_required
@action_permission
def update_post(request, pk):
      obj = Post.objects.get(pk=pk)
      if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            new_title = request.POST.get('title')
            new_description = request.POST.get('description')
            obj.title = new_title
            obj.description = new_description
            obj.save()
            return JsonResponse({
                  'title': new_title,
                  'description': new_description,
            })
      return redirect('posts:main-board')

@login_required
@action_permission
def delete_post(request, pk):
      if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            obj = Post.objects.get(pk=pk)
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                  obj.delete()
                  return JsonResponse({'msg':'some msg'})
            return JsonResponse({'msg':'accesss denied - ajax only'})
      return redirect('posts:main-board')
      
@login_required
def image_upload_view(request):
      # print(request.FILES)
      if request.method == 'POST':
            img = request.FILES.get('file')
            new_post_id = request.POST.get('new_post_id')
            post = Post.objects.get(id=new_post_id)
            Photo.objects.create(image=img, post=post)
      return HttpResponse()