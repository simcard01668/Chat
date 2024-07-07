import { messageForm, messageInput, messagesContainer, clearBtn, chatWindow, usernameInput, userReg, userList, namePlace, imageInput, currentUser } from './config/config.js'

document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------
    // declare socket and event listeners
    const socket = io();
    const BtnReg = document.getElementById('BtnReg');
    const BtnLogin = document.getElementById('BtnLogin');
    const regToggle = document.querySelector('.reg-toggle');
    const loginToggle = document.querySelector('.login-toggle');
    const toggleContainer = document.querySelector('.toggle-container');
    const loginMain = document.querySelector('.login-main');
    const reg = document.querySelector('.reg');
    const loginPage = document.querySelector('#login-page');
    const chatContainer = document.querySelector('.chat-container');
    const profile = document.querySelector('.profile');
    const usernameInput = document.getElementById('usernameInput');
    const userPassword = document.getElementById('userPassword');
    const userCount = document.querySelector('.userCount');
    const userProfile = document.querySelector('.userProfile');
    const chatPage = document.querySelector('#chatPage');

    // -----------------------------------------------------------
    //button interaction
    BtnReg.addEventListener('click', () => {
        toggleContainer.classList.add('active');
        regToggle.classList.add('hidden');
        loginToggle.classList.remove('hidden');
        loginMain.classList.add('active');
        reg.classList.add('active');
    });

    BtnLogin.addEventListener('click', () => {
        BtnLoginToggle();
    });

    function BtnLoginToggle() {
        toggleContainer.classList.remove('active');
        regToggle.classList.remove('hidden');
        loginToggle.classList.add('hidden');
        loginMain.classList.remove('active');
        reg.classList.remove('active');
    }
    // --------------------------------------------------------
    //user authentication auto login
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/token-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                loginPage.classList.add('hidden');
                chatPage.classList.remove('hidden');
                userProfile.innerHTML = `Welcome ${data.username}!`;
                socket.emit('update userCount');
            }
        })
        .catch(error => console.log(error))
    }
    // --------------------------------------------------------
    //user registration: submit username to server
    document.getElementById('userReg').addEventListener('click', function (e) {
        e.preventDefault();
        let username = document.getElementById('usernameRegInput').value;
        let password = document.getElementById('userRegPassword').value;
        let email = document.getElementById('userEmail').value;

        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username, password, email
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.register) {
                    alert(`You are registered as ${username}!, please login to continue`);
                    BtnLoginToggle();
                }
            })
            .catch(error => console.log(error))
        console.log('submitted registration')
    });
    // --------------------------------------------------------
    //user login: submit username to server
    document.getElementById('userLogin').addEventListener('click', (e) => {
        e.preventDefault();

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput.value,
                password: userPassword.value
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    alert(`You are now logged in as ${data.username}!`);
                    localStorage.setItem('token', data.token);
                    loginPage.classList.add('hidden');
                    chatPage.classList.remove('hidden');
                    userProfile.innerHTML = `Welcome ${data.username}!`;
                    socket.emit('update userCount');
                } else {
                    alert(data.message);
                }
            })
    })
    // -------------------------------------------------------
    //alert new user connection

    socket.on('user count', (data) => {
        console.log('triggered');
        userCount.textContent = `Users online: ${data}`;
    })

    socket.on('user connected', function (data) {
        const item = document.createElement('div');
        const usernameSpan = document.createElement('span');
        usernameSpan.style.fontWeight = 'bold';
        const messageSpan = document.createElement('span');
        messageSpan.style.display = 'inline';
        item.classList.add('message-container');


        if (data.isSelf) {
            item.style.alignSelf = 'center';
            usernameSpan.textContent = `You: `;
            messageSpan.textContent = 'have joint the chat';
            item.appendChild(usernameSpan);
            item.appendChild(messageSpan);
        } else {
            item.style.alignSelf = 'center';
            usernameSpan.textContent = `${data.username}: `;
            messageSpan.textContent = 'has joint the chat';
            item.appendChild(usernameSpan);
            item.appendChild(messageSpan);
        }

        setTimeout(() => {
            if (messagesContainer.firstChild) {
                messagesContainer.insertBefore(item, messagesContainer.firstChild);
            } else {
                messagesContainer.appendChild(item);
            }
        }, 2000);
    });

    //----------------------------------------------------------------
    // User disconnect event
    socket.on('user disconnected', (data) => {
        const item = document.createElement('div');
        const usernameSpan = document.createElement('span');
        usernameSpan.style.fontWeight = 'bold';
        const messageSpan = document.createElement('span');
        messageSpan.style.display = 'inline';
        item.classList.add('message-container');
        item.style.alignSelf = 'center';
        usernameSpan.textContent = `${data.username}: `;
        messageSpan.textContent = 'has left the chat';
        item.appendChild(usernameSpan);
        item.appendChild(messageSpan);

        setTimeout(() => {
            if (messagesContainer.firstChild) {
                messagesContainer.insertBefore(item, messagesContainer.firstChild);
            } else {
                messagesContainer.appendChild(item);
            }
        }, 2000);
    })
    //----------------------------------------------------------------
    // User count event
    socket.on('user count', (data) => {

    })
    // --------------------------------------------------------
    // send message function

    messageForm.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log('submitted message')
        if (messageInput.value) {
            socket.emit('chat message', messageInput.value);
            messageInput.value = '';
        }
    })

    //listen to message from server and appending to chat
    socket.on('chat message', function (data) {
        const item = document.createElement('div');
        const usernameSpan = document.createElement('span');
        usernameSpan.style.fontWeight = 'bold';

        const messageSpan = document.createElement('span');
        messageSpan.textContent = data.message;
        messageSpan.style.display = 'inline';

        item.classList.add('message-container');


        if (data.isSelf) {
            item.style.alignSelf = 'flex-end'; // Moves self messages to the right
            usernameSpan.textContent = `You: `;
            item.appendChild(usernameSpan);
            item.appendChild(messageSpan);
        } else {
            item.style.alignSelf = 'flex-start'; // Keeps other messages on the left
            usernameSpan.textContent = `${data.username}: `;
            item.appendChild(usernameSpan);
            item.appendChild(messageSpan);
        }

        // socket.emit('userTyping', { username: currentUser, isTyping: false });
        if (messagesContainer.firstChild) {
            messagesContainer.insertBefore(item, messagesContainer.firstChild);
        } else {
            messagesContainer.appendChild(item);
        }
    });

    //reject message if not logged in
    socket.on('message reject', function (message) {
        alert(message);
        loginPage.classList.remove('hidden');
    })

    // ------------------------------------------------------
    // send image function

    //send image client to server
    document.getElementById('imageInput').addEventListener('change', function () {
        if (this.files.length > 0) {
            const file = this.files[0];
            const reader = new FileReader();

            reader.onload = function (e) {
                // Emit the image data to the server
                socket.emit('send image', { image: e.target.result });
            };

            reader.readAsDataURL(file);
        }
    });

    //send image: receiving from server and appending to chat
    socket.on('receive image', function (imageSrc, username) {

        const img = document.createElement('img');
        const item = document.createElement('div');
        item.innerHTML = `<b>${username}</b>: sent an image`;
        img.src = imageSrc;
        messagesContainer.appendChild(item);
        document.getElementById('chat').appendChild(img);
        document.getElementById('chat').scrollTo(0, document.body.scrollHeight); // Scroll to the bottom of the chat

        window.scrollTo(0, document.body.scrollHeight); // Scroll to the bottom of the chat

    });


    // --------------------------------------------------------------------
    // clear chat function
    clearBtn.addEventListener('click', function () {
        messagesContainer.innerHTML = ''; // Clear the chat container
    });


    // -------------------------------------------------------------------------
    // user registration: update active user
    socket.on('update user list', function (users) {
        userList.innerHTML = ''; //clear the list
        users.forEach(user => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            li.appendChild(span);
            span.textContent = user;
            userList.appendChild(li);
        })

    })


    // ------------------------------------------------------------------------------
    // typing event function

    //sending typing event to server
    let typingTimer;
    const typingInterval = 3000;

    messageInput.addEventListener('keypress', function () {
        clearTimeout(typingTimer);  // Clear the existing timer on every keypress

        if (!currentUser) return;  // If no user is set, just return without doing anything

        // Emit that the user is currently typing
        socket.emit('userTyping', { username: currentUser, isTyping: true });

        // Reset the timer to set typing to false after period of inactivity
        typingTimer = setTimeout(() => {
            socket.emit('userTyping', { username: currentUser, isTyping: false });
            console.log('stopped typing');
        }, typingInterval);
    });


    //receive typing event from server
    socket.on('typing', function (data) {
        const typingIndicator = document.getElementById('type');
        if (data.isTyping) {
            typingIndicator.textContent = `${data.username} is typing...`;
        } else {
            typingIndicator.textContent = '';  // Clear the typing indicator
        }
    });

})