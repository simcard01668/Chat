const mysql2 = require('mysql2')

// const pool = mysql2.createPool({
//     host:'localhost',
//     user:'root',
//     password:'137958426',
//     database:'Chat'
// })
const pool = mysql.createPool(process.env.b8c0a1f6e66648:d605ad76@us-cluster-east-01.k8s.cleardb.net/heroku_9ccb0de730c94e1?reconnect=true);

module.exports = pool.promise()