require('dotenv').config();

const express = require('express');
const app = express();
const http = require('http');

// Add cors middleware
const cors = require('cors');
app.use(cors()); 


// set SocketIO connection, integrating cors management, and setting variables that will help managing events/communications/rooms..
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
const leaveRoom = require('./utils/leave_room');

// set Harper connection and import associated services (functions to store/retrieve messages into/from the harperDB)
const harperSaveMessage = require('./services/harper-save-message');
const harperGetLast100Messages = require('./services/harper-get-last100-messages');


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

    

    //Adding to a room. Listening to FRONTEND call (REPOSITORY realtime_chat_app_with_rooms/client/src/pages/home/index.js   =>   joinRoom()) 
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
        // Add the new connected user to the list of all connected members
        allMembers.push({ id: socket.id, username, room }); 
        // Filter users belonging to the room where the new connected user is trying to join
        chatRoomUsers = allMembers.filter((member) => member.room === room); 
        socket.to(room).emit('chatroom_users', chatRoomUsers);
        socket.emit('chatroom_users', chatRoomUsers);


        // Get last 100 messages sent in the chat room
        harperGetLast100Messages(room)
          .then((last100Messages) => {socket.emit('last_100_messages', last100Messages)})
          .catch((err) => console.log(err));


    });

    // Managing the 'sending message' actions, listening to FRONTEND call (REPOSITORY realtime_chat_app_with_rooms/client/src/pages/chat/send_message.js) 
    socket.on('send_message', (data) => {
      const { message, username, room, __createdtime__ } = data;
      io.in(room).emit('receive_message', data); // Send to all users in room, including sender
      harperSaveMessage(message, username, room, __createdtime__) // Save message in db
        .then((response) => console.log(response))
        .catch((err) => console.log(err));
    });

    // Managing FRONT request of leaving a room
    socket.on('leave_room', (data) => {
      const { username, room } = data;
      socket.leave(room);
      const __createdtime__ = Date.now();
      // Remove user from memory
      allMembers = leaveRoom(socket.id, allMembers);
      socket.to(room).emit('chatroom_users', allMembers);
      socket.to(room).emit('receive_message', {
        username: CHATBOT,
        message: `${username} has left the chat`,
        __createdtime__,
      });
      console.log(`${username} has left the chat`);
    });

    //managing FRONT request of disconnecting completely from the socket
    socket.on('disconnect', () => {
      console.log('User disconnected from the chat');
      const user = allMembers.find((user) => user.id == socket.id);
      if (user?.username) {
        allMembers = leaveRoom(socket.id, allMembers);
        socket.to(chatRoom).emit('chatroom_users', allMembers);
        socket.to(chatRoom).emit('receive_message', {
          message: `${user.username} has disconnected from the chat.`,
        });
      }
    });

});

server.listen(4000, () => 'Server running on port 4000');