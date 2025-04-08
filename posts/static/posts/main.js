console.log('hello world')

const postsBox = document.getElementById('posts-box')
const spinnerBox = document.getElementById('spinner-box')
const loadBtn = document.getElementById('load-btn')
const endBox = document.getElementById('end-box')

const postForm = document.getElementById('post-form')
const title = document.getElementById('id_title')
const description = document.getElementById('id_description')
const csrf = document.getElementsByName('csrfmiddlewaretoken')

const url = window.location.href

const alertBox = document.getElementById('alert-box')

const dropozone = document.getElementById('my-dropzone')
const addBtn = document.getElementById('add-btn')
const closeBtns = [...document.getElementsByClassName('add-modal-close')]

const getCookie =(name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

const deleted = localStorage.getItem('title')
if (deleted){
    handleAlerts('danger',`deleted "${deleted}"`)
    localStorage.clear()
}

const likeUnlikePosts = ()=> {
    const likeUnlikeForms = [...document.getElementsByClassName('like-unlike-forms')]
    likeUnlikeForms.forEach(form=> form.addEventListener('submit', e=>{
        e.preventDefault()
        const clickedId = e.target.getAttribute('data-form-id')
        const clickedBtn = document.getElementById(`like-unlike-${clickedId}`)

        $.ajax({
            type: 'POST',
            url: "like-unlike/",
            data: {
                'csrfmiddlewaretoken': csrftoken,
                'pk': clickedId,
            },
            success: function(response){
                console.log(response)
                clickedBtn.textContent = response.liked ? `Unlike (${response.count})`: `Like (${response.count})`
            },
            error: function(error){
                console.log(error)
            }
        })
    }))
}

let visible = 3

const initializePopovers = () => {
    const likeButtons = document.querySelectorAll('.like-btn');
    likeButtons.forEach((button) => {
        const likedUsers = button.getAttribute('data-liked-users');
        const content = likedUsers ? 'Liked by ' + likedUsers : 'No likes yet';
        
        new bootstrap.Popover(button, {
            trigger: 'hover',
            content: content,
            placement: 'top',
        });
    });
};

const getData = () => {
    $.ajax({
        type: 'GET',
        url: `/data/${visible}/`,
        success: function(response){
            console.log(response)
            const data = response.data
                setTimeout(()=>{
                spinnerBox.classList.add('not-visible')
                console.log(data)
                data.forEach(el => {
                const likedUsersText = ''
                postsBox.innerHTML += `
                    <div class="card mb-2">
                        <div class="card-body">
                            <h5 class="card-title">${el.title}</h5>
                            <p class="card-text">${el.description}</p>
                            <p class="text-muted"><small>${likedUsersText}</small></p>
                        </div>
                        <div class="card-footer">
                            <div class="row">
                                <div class="col-1">
                                    <a href="${url}${el.id}" class="btn btn-primary">Details</a>
                                </div>
                                <div class="col-2">
                                <form class="like-unlike-forms" data-form-id="${el.id}">
                                    <button class="btn btn-primary like-btn" id="like-unlike-${el.id}" 
                                        data-liked-users="${el.liked_users.join(', ')}">
                                        ${el.liked ? `Unlike (${el.count})` : `Like (${el.count})`}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                `
            });
            likeUnlikePosts()
            initializePopovers()
            }, 100)
            console.log(response.size)
            if (response.size == 0) {
                endBox.textContent = 'No posts added yet...'
            }
            else if (response.size <= visible){
                loadBtn.classList.add('not-visible')
                endBox.textContent = 'No more posts to load...'
            }
        },
        error: function(error){
            console.log(error)
        }
    })
}

loadBtn.addEventListener('click', ()=>{
    spinnerBox.classList.remove('not-visible')
    visible += 3
    getData()
})

let newPostId = null
postForm.addEventListener('submit', e=>{
    e.preventDefault()

    $.ajax({
        type: 'POST',
        url: '',
        data: {
            'csrfmiddlewaretoken': csrf[0].value,
            'title': title.value,
            'description': description.value
        },
        success: function(response){
            console.log(response)
            newPostId = response.id
            postsBox.insertAdjacentHTML('afterbegin',`
                <div class="card mb-2">
                        <div class="card-body">
                            <h5 class="card-title">${response.title}</h5>
                            <p class="card-text">${response.description}</p>
                        </div>
                        <div class="card-footer">
                            <div class="row">
                                <div class="col-1">
                                    <a href="${url}${response.id}"  class="btn btn-primary">Details</a>
                                </div>
                                <div class="col-2">
                                <form class="like-unlike-forms" data-form-id="${response.id}">
                                    <button class="btn btn-primary" id="like-unlike-${response.id}">Like (0)</button>
                                </form>
                                    </div>
                            </div>
                        </div>
                    </div>
                `)
                likeUnlikePosts()
                // $('#addPostModal').modal('hide')
                handleAlerts('success', 'New post added!')
                // postForm.reset()
        },
        error: function(error){
            console.log(error)
            handleAlerts('danger', 'Oops! Something went wrong...')
        }
    })
})

addBtn.addEventListener('click', ()=> {
    dropozone.classList.remove('not-visible')
})

closeBtns.forEach(btn=> btn.addEventListener('click', ()=>{
    postForm.reset()
    if (!dropozone.classList.contains('not-visible')) {
        dropozone.classList.add('not-visible')
    }
    const myDropzone = Dropzone.forElement("#my-dropzone")
    myDropzone.removeAllFiles(true)   
}))

Dropzone.autoDiscover = false
const myDropzone = new Dropzone('#my-dropzone', {
    url:'upload/',
    init: function() {
        this.on('sending', function(file, xhr, formData){
            formData.append('csfrmiddlewaretoken', csrftoken)
            formData.append('new_post_id', newPostId)
        })
    },
    maxFiles: 5,
    maxFilesizes: 4,
    acceptedFiles: '.png, .jpg, .jpeg'
})

getData()