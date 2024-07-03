const mysql2 = require('mysql2')

const pool = mysql2.createPool({
    host:'localhost',
    user:'root',
    password:'137958426',
    database:'Chat'
})