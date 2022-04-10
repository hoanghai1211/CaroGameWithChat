// var express = require('express');
// var configViewEngine = require('./configs/viewEngine');
// var initWebRoute = require('./route/web');


import express from 'express';
// import io from 'socket.io';
import configViewEngine from './configs/viewEngine';
import initWebRoute from '../src/route/web';
import { Socket } from 'socket.io';

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
io.on("connection", (socket) => {
    console.log(`Start new socket from userID: `, socket.id);
});

