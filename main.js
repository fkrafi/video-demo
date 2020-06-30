const express = require('express');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

//all connected to the server users 
var users = {};

app.use(express.static('statics'));

io.on('connection', (socket) => {
    console.log("User connected");

    socket.on('login', (data) => {
        console.log("User logged", data.name);
        //if anyone is logged in with this username then refuse 
        if (users[data.name]) {
            socket.emit('login', { success: false });
        } else {
            //save user connection on the server 
            users[data.name] = socket;
            socket.name = data.name;
            socket.emit('login', { success: true });
        }
    });

    socket.on('offer', (data) => {
        //for ex. UserA wants to call UserB 
        console.log("Sending offer to: ", data.name);
        //if UserB exists then send him offer details 
        var conn = users[data.name];
        if (conn != null) {
            //setting that UserA connected with UserB 
            socket.otherName = data.name;
            // sendTo(conn, {
            //     type: "offer",
            //     offer: data.offer,
            //     name: connection.name
            // });
            socket.broadcast.emit('offer', { offer: data.offer, name: socket.name });
        }
    });

    socket.on('answer', (data) => {
        console.log("Sending answer to: ", data.name);
        //for ex. UserB answers UserA 
        var conn = users[data.name];
        if (conn != null) {
            socket.otherName = data.name;
            // sendTo(conn, {
            //     type: "answer",
            //     answer: data.answer
            // });
            socket.broadcast.emit('answer', { answer: data.answer });
        }
    });

    socket.on('candidate', (data) => {
        console.log("Sending candidate to:", data.name);
        var conn = users[data.name];
        if (conn != null) {
            // sendTo(conn, {
            //     type: "candidate",
            //     candidate: data.candidate
            // });
            socket.broadcast.emit('candidate', { candidate: data.candidate });
        }
    });

    socket.on('leave', (data) => {
        console.log("Disconnecting from", data.name);
        var conn = users[data.name];
        conn.otherName = null;
        //notify the other user so he can disconnect his peer connection 
        if (conn != null) {
            // sendTo(conn, {
            //     type: "leave"
            // });
            socket.broadcast.emit('leave');
        }
    });

    //when user exits, for example closes a browser window 
    //this may help if we are still in "offer","answer" or "candidate" state 
    socket.on('close', function () {
        if (socket.name) {
            delete users[socket.name];
            if (socket.otherName) {
                console.log("Disconnecting from ", socket.otherName);
                var conn = users[socket.otherName];
                conn.otherName = null;
                if (conn != null) {
                    // sendTo(conn, {
                    //     type: "leave"
                    // });
                    socket.broadcast.emit('leave');
                }
            }
        }
    });
});

http.listen(3000, function () {
    console.log('listening on localhost:3000');
});