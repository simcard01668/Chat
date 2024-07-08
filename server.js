const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const pool = require('./database.js');
const crypto = require('crypto');
const secretKey = crypto.randomBytes(32).toString('hex');
const jwt = require('jsonwebtoken');
const SECRET_KEY = '123456789';
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    maxHttpBufferSize: 1e7 // Set max HTTP buffer size to 1MB
});
//User name registration
let onlineUsers = [];

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
    await pool.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, password, email])
        res.status(201).json({ register: true });
    } catch (error) {
        res.status(500).send('Error registering user');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT password FROM users WHERE username = ?', [username]);
        if (result[0][0].password === password) {
            console.log('User logged in:', username);
            const token = jwt.sign({ username: username }, SECRET_KEY, { expiresIn: '1h' });
            console.log('token:', token)
            onlineUsers.push(username);
            res.json({ loggedIn: true, token, username: username })
        } else {
            res.status(401).send('Invalid username or password!!!');
        }
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});


io.on('connection', (socket) => {
    socket.emit('authentication');

    socket.on('authenticate', (token) => {
        console.log(token);
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                socket.emit('authentication failed');
                console.log('Authentication failed', err.message)
            } else {
                socket.username = decoded.username;
                onlineUsers.push(decoded.username);
                io.emit('user count', onlineUsers.length);
                console.log('User connected:', decoded.username);
                socket.emit('authenticated', {username: decoded.username});
            }
        });
    });

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
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})


