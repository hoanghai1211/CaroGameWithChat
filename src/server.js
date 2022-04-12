import express from 'express';
import moment from 'moment';
import configViewEngine from './configs/viewEngine';
import initWebRoute from '../src/route/web';
import users from './controller/userController';

require('dotenv').config();

// const path = require('path')
const app = express();

let server = require("http").Server(app);
//khai bao socket
var io = require("socket.io")(server);

const port = process.env.PORT || 8686;
server.listen(port, () => {
    console.log(`App running on port: `, port);
});

// set up view engine
configViewEngine(app);
console.log(`config view!!!`);

// init web route
initWebRoute(app);
console.log(`Init Route!!!`);

// io.on
io.on(`connection`, (socket) => {
    console.log(`Start new socket from userID: `, socket.id);
    // console.log(`Check input username: `, username, `, room: `, room);
    // users.UserJoinGame(socket.id, p);

    socket.on(`Client-join-room`, ({ username, room, message }) => {
        message = `Welcome ` + username + ` to room ` + room;
        // io.sockets.emit(`Server-send-data`, `Welcome ` + username + `to room ` + room); // send all except username
        socket.emit(`Server-send-data`, { username, room, message, time: moment().format(`h:mm a`) }); // Send to username only
    })

    socket.on(`disconnect`, () => {
        console.log(`User `, socket.id, ` disconnect!`);
    });

    socket.on(`SendMessagetoServer`, ({ username, room, message }) => {
        console.log(`User `, username, ` chat: `, message);
        io.sockets.emit(`Server-send-data`, { username, room, message, time: moment().format(`h:mm a`) });
    })
});

