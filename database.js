const mysql = require('mysql2')

// const pool = mysql2.createPool({
//     host:'localhost',
//     user:'root',
//     password:'137958426',
//     database:'Chat'
// })

const pool = mysql.createPool(process.env.CLEARDB_DATABASE_URL);

module.exports = pool.promise();

