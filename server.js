const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const pool = require('./database.js');
const crypto = require('crypto');
const secretKey = crypto.randomBytes(32).toString('hex');
console.log(secretKey);
//authenicate user
const jwt = require('jsonwebtoken');
const SECRET_KEY = `${secretKey}`;
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    maxHttpBufferSize: 1e7 // Set max HTTP buffer size to 1MB
});
//User name registration
let onlineUsers = [];

//middleware for authenticating token
function authenicateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    await pool.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, password, email])
    try {
        res.status(201).json({ register: true });
    } catch (error) {
        res.status(500).send('Error registering user');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [result] = await pool.query('SELECT * FROM users Where username = ? AND password = ?', [username, password])
        if (result.length > 0) {
            const token = jwt.sign({ username: username }, SECRET_KEY, { expiresIn: '1h' });
            onlineUsers.push(username);
            res.json({ loggedIn: true, token, username: username })
        } else {
            res.status(401).send('Invalid username or password!!!');
        }
    } catch (error) {
        res.status(500).send('Error logging in');
    }
});

app.post('token-login', authenicateToken, (req, res) => {
    res.json({ loggedIn: true, username: decoded.username });
});



io.on('connection', (socket) => {


    socket.on('update userCount', () => {
        io.emit('user count', onlineUsers.length);
    });

    // -------------------------------------------------------------
    //send message functions
    socket.on('chat message', (msg) => {
        console.log('Accessing username:', socket.username);
        console.log(regUsers.hasOwnProperty(socket.username));
        if (socket.username && regUsers.hasOwnProperty(socket.username)) {
            const messageData = {
                username: socket.username,
                message: msg
            };
            socket.emit('chat message', { ...messageData, isSelf: true });
            socket.broadcast.emit('chat message', { ...messageData, isSelf: false });
        } else {
            socket.emit('message reject', 'You are not logged in, please log in first.');
        }
    });

    // -------------------------------------------------------------
    //handle disconnection event
    socket.on('disconnect', () => {
        console.log('A user has disconnected');
        socket.broadcast.emit('user disconnected', { username: socket.username });
        delete onlineUsers[socket.username];
        console.log(onlineUsers);
        // updateUserCount()
    })

    // --------------------------------------------------------------
    //login function


    // -------------------------------------------------------------
    //Typing function
    socket.on('userTyping', (data) => {
        io.emit('typing', data);
    });

    // -------------------------------------------------------------
    //send photo function
    socket.on('send image', function (data) {
        // Broadcast the image data to all connected clients
        io.emit('receive image', data.image, socket.username);
    });

})

// -------------------------------------------------------------
// user count


// -------------------------------------------------------------
//start server
const PORT = process.env.PORT || 443;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})


