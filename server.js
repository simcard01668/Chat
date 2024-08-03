const express = require('express');
const https = require('https');
const http = require('http');
const socketIo = require('socket.io');
const { instrument } = require("@socket.io/admin-ui");
const path = require('path');
const fs = require('fs');

//AWS RDS database connection
require('dotenv').config();
const mysql2 = require('mysql2/promise')

const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
})

const crypto = require('crypto');
const secretKey = crypto.randomBytes(32).toString('hex');
const jwt = require('jsonwebtoken');
const { type } = require('os');
const SECRET_KEY = '123456789';
const app = express();
const AWS = require('aws-sdk');
const multer = require('multer'); //allow file upload

// -------------------------------------------------------------
//SSL certificate configuration for development environment
const isHttps = process.env.USE_HTTPS === 'true';

let server;
if (isHttps) {
    server = https.createServer(options, app);
} else {
    server = http.createServer(app);
}



const io = socketIo(server, {
    maxHttpBufferSize: 1e7, // Set max HTTP buffer size to 1MB
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
});

// -------------------------------------------------------------
//Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
    res.json(req.file);
});


instrument(io, {
    auth: false,
    mode: 'development'
});

//User name registration
let onlineUsers = {};
let rooms = [];

app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//API for registration and login
app.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        await pool.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, password, email])
        res.status(201).json({ register: true });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'Username already exists' });
        } else {
            res.status(500).json({ error: 'Error registering user' });
        }
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
            res.status(401).json('Invalid username or password!!!');
        }
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});

async function fetchMessages(room_id) {
    const fetchQuery = `select * from messages where room_id = ? ORDER BY timestamp DESC LIMIT 30;`;
    const [message] = await pool.query(fetchQuery, [room_id]);
    return message;
}


// -------------------------------------------------------------
//socket.io logic
io.on('connection', (socket) => {
    console.log('A user has connected');
    socket.join('Public');
    const room = Array.from(socket.rooms)[1];

    fetchMessages('Public').then((messages) => {
        socket.emit('fetch messages', messages);
    })

    socket.on('create room', (room) => {
        console.log('Room:', room);
        rooms.push(room);
        io.emit('appending room', rooms);
        console.log('Rooms:', rooms);
    });

    socket.on('join room', (room, user) => {
        const oldRoom = Array.from(socket.rooms)[1];
        socket.leave(oldRoom);
        socket.join(room);
        socket.emit('room joined', room, user);
        fetchMessages(room).then((messages) => {
            socket.emit('fetch messages', messages);
        })
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
                if (!onlineUsers[socket.username]) {
                    onlineUsers[socket.username] = {};
                }
                onlineUsers[socket.username].socket_id = socket.id;
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

    socket.on('chat message', async (msg, currentRoom) => {
        if (socket.username || onlineUsers.includes(socket.username)) {
            const messageData = {
                username: socket.username,
                message: msg,
                timestamp: new Date()
            };
            io.to(currentRoom).emit('received message', { ...messageData });
            console.log(currentRoom)
        } else {
            socket.emit('message reject', 'You are not logged in, please log in first.');
        }

        const sender_id = socket.username
        const message = msg
        const room_id = currentRoom
        const status = 'unread'

        try {
            await pool.query('INSERT INTO messages (room_id, sender_id, message, status) VALUES (?, ?, ?, ?)', [room_id, sender_id, message, status])
        } catch (error) {
            console.log(error)
        }
    }
    );

    // -------------------------------------------------------------
    //handle disconnection event
    socket.on('disconnect', () => {
        console.log('A user has disconnected', socket.username);
        socket.broadcast.emit('user disconnected', { username: socket.username });
        if (socket.username in onlineUsers) {
            delete onlineUsers[socket.username];
        }
        io.emit('user count', onlineUsers);

    })
    // -------------------------------------------------------------
    // Typing function
    socket.on('userTyping', (data) => {
        io.emit('typing', data);
    });

    // -------------------------------------------------------------
    //send photo function
    socket.on('send image', function (data) {
        // Broadcast the image data to all connected clients
        io.emit('receive image', data.image, socket.username);
    });


    ///////////////////////////////////////////////////////////////////
    // debug only
    socket.on('update room', (currentUser) => {
        // console.log(socket.rooms)
        // console.log(`${currentUser} is now at room ${room}`);
        // console.log(onlineUsers)
    });
})

// -------------------------------------------------------------
// user count


// -------------------------------------------------------------
//start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
})







