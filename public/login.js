const BtnReg =  document.getElementById('BtnReg');
const BtnLogin =  document.getElementById('BtnLogin');
const regHidden = document.getElementById('reg-hidden')
const regShow = document.getElementById('reg-show')
const loginHidden = document.getElementById('login-hidden')
const loginShow = document.getElementById('login-show')

BtnReg.addEventListener('click', () => {
    loginHidden.style.display = 'block';
    loginShow.style.display = 'none';
     regShow.style.display = 'block'
     regHidden.style.display = 'none'
});

BtnLogin.addEventListener('click', () => {
    loginHidden.style.display = 'none';
    loginShow.style.display = 'block';
     regShow.style.display = 'none'
     regHidden.style.display = 'block'
});