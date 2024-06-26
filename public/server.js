const express = require('express');
const http = require('http');
const socketIo = require('socket.io');


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    maxHttpBufferSize: 1e7 // Set max HTTP buffer size to 1MB
});

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A new user has connected');

    //send message functions
    socket.on('chat message', (msg) => {
        // Assume 'socket.username' stores the username of the connected client
        console.log(`Received message from ${socket.username}: ${msg}`);
        if (socket.username) {
            const messageData = {
                username: socket.username,
                message: msg
            };
            io.emit('chat message', messageData);  // Emit the structured object
        } else {
            console.log('Error: Username not set for the message received');
        }
    });
    //handle disconnection event
    socket.on('disconnect', () => {
        console.log('A user has disconnected');
        if (socket.username && activeUsernames[socket.username]) {
            delete activeUsernames[socket.username];
            io.emit('update user list', Object.keys(activeUsernames));
            console.log(`Username ${socket.username} removed from active users`);
        }
    })

    // Register username for new connections
    socket.on('register username', (username) => {
        if (!activeUsernames[username]) {
            activeUsernames[username] = socket.id;
            socket.username = username; // Also set the username here
            socket.emit('username accepted', username);
            console.log(`Username registered and set: ${username}`);
            io.emit('update user list', Object.keys(activeUsernames));
        } else {
            socket.emit('username rejected', 'Username is already taken');
        }

    });
    //Typing function
    socket.on('userTyping', (data) => {
        io.emit('typing', data);
    });

    //send photo function
    socket.on('send image', function (data) {
        // Broadcast the image data to all connected clients
        io.emit('receive image', data.image, socket.username);
    });

})

//start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})


//User name registration
let activeUsernames = {};
