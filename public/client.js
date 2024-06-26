import { messageForm, messageInput, messagesContainer, clearBtn, chatWindow, usernameInput, userReg, userList, namePlace, imageInput, currentUser } from './modules/config.js'

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();


    // --------------------------------------------------------
    // send message function

    messageForm.addEventListener('submit', function (e) {
        e.preventDefault();
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
        usernameSpan.textContent = `${data.username}: `;

        const messageSpan = document.createElement('span');
        messageSpan.textContent = data.message;
        messageSpan.style.display = 'inline';

        item.appendChild(usernameSpan);
        item.appendChild(messageSpan);

        console.log('Received:', data);
        socket.emit('userTyping', { username: currentUser, isTyping: false });
        messagesContainer.appendChild(item);

        window.scrollTo(0, document.body.scrollHeight); // Scroll to the bottom of the chat
        document.getElementById('chat').scrollTo(0, document.body.scrollHeight); // Scroll to the bottom of the chat
    });

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
    // user registration function

    //user registration: submit username to server
    document.getElementById('usernameForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('usernameInput').value;
        socket.emit('register username', username);
    });

    //user registration: response from server
    socket.on('username accepted', function (username) {
        chatWindow.classList.remove('hidden');  // Show the chat window
        usernameInput.classList.add('hidden');          // Disable the username input
        userReg.disabled = true;          // Disable the submit button
        userReg.classList.add('hidden')

        namePlace.innerHTML = `Your username is: ${username}`;
        currentUser = username;
    });

    //user registration: reject from server
    socket.on('username rejected', function (message) {
        alert(message);  // Optionally alert the user that the username is taken
    });

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