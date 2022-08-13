const express = require('express');
const app = express();
const http = require('http');

// Add cors middleware
const cors = require('cors');
app.use(cors()); 


// set SocketIO connection, integrating cors management, and setting variables that will help us managing events/communications/rooms..
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });
const CHATBOT = 'chatBot';
let chatRoom = '';
let allMembers =[];


/**
 * =====================================================================================================================================
 * LISTENER TO  FRONTEND CONNECTIONS    
 *    dependancies:   GitHub REPOSITORY  named realtime_chat_app_with_rooms_front/src/App.js
 *                    below listener INDEED listens to every socketIO connexion coming from the front End
 *                    realtime_chat_app_with_rooms_front REPOSITORY, 
 *                     => file src/App.js directly connects through const socket = io.connect('http://localhost:4000') ) 
 * =====================================================================================================================================  
 */ 
io.on('connection', (socket) => {    
    // Associated logic and sub listeners (coming from socket) here (adding user to rooms...)
    console.log(`User connected ${socket.id}`);  

    

    //Adding to a room 
    socket.on('join_room', (data) => {
        // Data sent from FRONTEND when join_room event emitted
        const { username, room } = data;

        // Join the user to a socket room 
        socket.join(room); 

        let __createdtime__ = Date.now(); 
        
        // Send message to users currently in room, apart from the user that just joined
        socket.to(room).emit('receive_message', {
            message: `${username} has joined the chat room`,
            username: CHATBOT,
            __createdtime__,
        });

        // Send welcome msg to user that just joined chat only
        socket.emit('receive_message', {
            message: `Welcome ${username}`,
            username: CHATBOT,
            __createdtime__,
        });

        chatRoom = room;
        // add the new connected user to the list of all connected members
        allMembers.push({ id: socket.id, username, room }); 
        // filter users belonging to the room where the new connected user is trying to join
        chatRoomUsers = allMembers.filter((member) => member.room === room); 
        socket.to(room).emit('chatroom_users', chatRoomUsers);
        socket.emit('chatroom_users', chatRoomUsers);

      });

});

server.listen(4000, () => 'Server running on port 4000');