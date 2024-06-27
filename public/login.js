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
