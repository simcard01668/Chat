

document.addEventListener('DOMContentLoaded', () => {

    const BtnReg = document.getElementById('BtnReg');
    const BtnLogin = document.getElementById('BtnLogin');
    const regToggle = document.querySelector('.reg-toggle');
    const loginToggle = document.querySelector('.login-toggle');
    const toggleContainer = document.querySelector('.toggle-container');
    const loginMain = document.querySelector('.login-main');
    const reg = document.querySelector('.reg');

    BtnReg.addEventListener('click', () => {
        toggleContainer.classList.add('active');
        regToggle.classList.add('hidden');
        loginToggle.classList.remove('hidden');
        loginMain.classList.add('active');
        reg.classList.add('active');
    });

    BtnLogin.addEventListener('click', () => {
        toggleContainer.classList.remove('active');
        regToggle.classList.remove('hidden');
        loginToggle.classList.add('hidden');
        loginMain.classList.remove('active');
        reg.classList.remove('active');
    });

    const socket = io();

    //user registration: submit username to server
    document.getElementById('userReg').addEventListener('click', function (e) {
        e.preventDefault();
        const username = document.getElementById('usernameRegInput').value;
        const password = document.getElementById('userRegPassword').value;
        const email = document.getElementById('userEmail').value;
        const regData = {
            username: username,
            password: password,
            email: email
        }
        socket.emit('register username', regData);
    });

    //user registration: reject from server
    socket.on('username rejected', function (message) {
        alert(message);  // Optionally alert the user that the username is taken
    });

    socket.on('username accepted', function(username) {
        alert(`You are now registrated and logged in as ${username}!`);
        window.location.href = '/main';
    });
    
    


});