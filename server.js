const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    maxHttpBufferSize: 1e7 // Set max HTTP buffer size to 1MB
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/main', express.static(path.join(__dirname, 'main')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'index.html'));
});


//User name registration
let regUsers = {};

io.on('connection', (socket) => {
    console.log('A new user has connected');
        // ------------------------------------------------------------
    // Register username for new connections
    socket.on('register username', (regData) => {
        console.log(regData);
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
         socket.username = username;
         console.log(socket.username);
         socket.emit('username accepted', username, socket.username);
         console.log(`Username registered and set: ${socket.username}`);
         //display connected users
         console.log(regUsers);
     });

    // -------------------------------------------------------------
    //send message functions
    socket.on('chat message', (msg) => {
        console.log('Accessing username:', socket.username);
        console.log(regUsers.hasOwnProperty(socket.username));
        if(socket.username && regUsers.hasOwnProperty(socket.username)){
            const messageData = {
                username: socket.username,
                message: msg
            };
            io.emit('chat message', messageData);
    } else {
        socket.emit('message reject', 'You are not logged in, please log in first.');
    }});




    //     msg, regUsers[username]) => {
    //     // Assume 'socket.username' stores the username of the connected client
    //     console.log(`Received message from ${regUsers[username]}: ${msg}`);
    //     if (socket.username) {
    //         const messageData = {
    //             username: socket.username,
    //             message: msg
    //         };
    //         io.emit('chat message', messageData);  // Emit the structured object
    //     } else {
    //         console.log('Error: Username not set for the message received');
    //     }
    // });

    // -------------------------------------------------------------
    //handle disconnection event
    socket.on('disconnect', () => {
        console.log('A user has disconnected');

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
//start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})


