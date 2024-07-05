const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const pool = require('./database.js');


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    maxHttpBufferSize: 1e7 // Set max HTTP buffer size to 1MB
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    pool.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, password, email])
    try {
        res.status(201).send('User successfully registered');
    } catch (error) {
        res.status(500).send('Error registering user');
    }
});

//User name registration
let regUsers = {};
let onlineUsers = {};

function registerOnlineUser(username, socket) {
    socket.username = username;
    socket.emit('username accepted', username);
    socket.emit('user connected', { username: socket.username, isSelf: true });

    onlineUsers[username] = {
        socketId: socket.id,
        username: username
    }
}

io.on('connection', (socket) => {
    console.log('A new user has connected');
    // ------------------------------------------------------------
    // Register username for new connections

    socket.on('register username', (regData) => {
        const { username, password, email } = regData;
        if (regUsers.hasOwnProperty(username)) {
            socket.emit('username rejected', 'Username is already taken, please try another one.');
            return;
        }
        //save the username and password
        regUsers[username] = {
            password: password,
            email: email,
        };

        registerOnlineUser(username, socket);
    
        socket.broadcast.emit('user connected', { username: socket.username, isSelf: false });

        console.log(onlineUsers);
        //  console.log(`Username registered and set: ${socket.username}`);
        //  console.log(regUsers);
        updateUserCount();
    });

    socket.on('login', (loginData) => {
        const { username, password } = loginData;
        if (regUsers.hasOwnProperty(username) && regUsers[username].password === password) {
            registerOnlineUser(username, socket);
            console.log(onlineUsers);
            updateUserCount();
        }
        else {
            socket.emit('username rejected', 'Invalid username or password');
        }
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
        updateUserCount()
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
function updateUserCount() {
    io.emit('user count', Object.keys(onlineUsers).length);
    console.log(Object.keys(onlineUsers).length);
};

// -------------------------------------------------------------
//start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})


