const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { instrument } = require("@socket.io/admin-ui");
const path = require('path');
const pool = require('./database.js');
const crypto = require('crypto');
const secretKey = crypto.randomBytes(32).toString('hex');
const jwt = require('jsonwebtoken');
const { type } = require('os');
const SECRET_KEY = '123456789';
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    maxHttpBufferSize: 1e7, // Set max HTTP buffer size to 1MB
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
});

instrument(io, {
    auth: false,
    mode: 'development'
});

//User name registration
let onlineUsers = [];
let rooms = [];

// setInterval(() => {
// console.log(onlineUsers);
// },2000);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

//API for registration and login
app.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        await pool.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, password, email])
        res.status(201).json({ register: true });
    } catch (error) {
        res.status(500).json({ error });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT password FROM users WHERE username = ?', [username]);
        if (result[0][0].password === password) {
            const token = jwt.sign({ username: username }, SECRET_KEY, { expiresIn: '1h' });
            res.json({ loggedIn: true, token, username: username })
        } else {
            res.status(401).send('Invalid username or password!!!');
        }
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});

// -------------------------------------------------------------
//socket.io logic
io.on('connection', (socket) => {
    console.log('A user has connected');
    socket.join('Public');
    const room = Array.from(socket.rooms)[1];

    socket.on('create room', (room) => {
        console.log('Room:', room);
        rooms.push(room);
        io.emit('appending room', rooms);
        console.log('Rooms:', rooms);
    });

    socket.on('join room', (room) => {
        const oldRoom = Array.from(socket.rooms)[1];
        socket.leave(oldRoom);
        socket.join(room);
        socket.emit('room joined', room);
    }
    );

    // -------------------------------------------------------------
    //authentication function
    socket.emit('authentication'); // Send token authentication request to client

    socket.on('authenticate', (token) => {
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                socket.emit('authentication failed');
                console.log('Authentication failed', err.message)
            } else {
                socket.username = decoded.username;
                if (!onlineUsers.includes(socket.username)) {
                    onlineUsers.push(socket.username);
                }
                io.emit('user count', onlineUsers);
                socket.emit('user connected', { username: socket.username, isSelf: true });
                socket.broadcast.emit('user connected', { username: socket.username, isSelf: false });
                socket.emit('authenticated', { username: socket.username });
                io.emit('appending room', rooms);
            }
        });
    });

    socket.on('update userCount', () => {
        io.emit('user count', onlineUsers);
    });

    // -------------------------------------------------------------
    // send message functions

    socket.on('chat message', (msg, currentRoom) => {
        if (socket.username || onlineUsers.includes(socket.username)) {
            const messageData = {
                username: socket.username,
                message: msg
            };
            io.to(currentRoom).emit('received message', { ...messageData });
        } else {
            socket.emit('message reject', 'You are not logged in, please log in first.');
        }
    }
    );




    // -------------------------------------------------------------
    //handle disconnection event
    socket.on('disconnect', () => {
        console.log('A user has disconnected', socket.username);
        socket.broadcast.emit('user disconnected', { username: socket.username });
        if (onlineUsers.includes(socket.username)) {
            const index = onlineUsers.indexOf(socket.username)
            onlineUsers.splice(index, 1);
        }
        io.emit('user count', onlineUsers);

    })
    // -------------------------------------------------------------
    // room function




    // -------------------------------------------------------------
    //Typing function
    // socket.on('userTyping', (data) => {
    //     io.emit('typing', data);
    // });

    // -------------------------------------------------------------
    //send photo function
    socket.on('send image', function (data) {
        // Broadcast the image data to all connected clients
        io.emit('receive image', data.image, socket.username);
    });


    ///////////////////////////////////////////////////////////////////
    // debug only
    socket.on('update room', (currentUser) => {
        console.log(socket.rooms)

        console.log(`${currentUser} is now at room ${room}`);
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







