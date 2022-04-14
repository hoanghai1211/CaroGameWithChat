import express from 'express';
import moment from 'moment';
import configViewEngine from './configs/viewEngine';
import initWebRoute from '../src/route/web';
import users from './controller/userController';
import game from './controller/gameController';

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

// Khởi tạo mảng chứa lượt đi của 2 ng chơi
var players = [];

//init game board 15 * 15 with value init = 0
let arrBoard = game.InitMatrix(15, 0);
// console.log(`Caro board: `, arrBoard);

// io.on
// io.sockets.emit --> server respond to all 
// socket.broadcast.emit --> server respond to all except sender
// socket.emit --> respond to only sender
// io.to --> server send to exactly receiver by socket.id
io.on(`connection`, (socket) => {
    console.log(`Start new socket from userID: `, socket.id);

    // Event new client A join room
    // send to only A message welcome
    // add A --> array User
    socket.on(`Client-join-room`, ({ username, room, message }) => {

        // If A exists in array users => alert & return login pages
        let checkExist = users.findUsername(socket.id, username, room);
        if (checkExist > -1) {
            socket.emit(`Reject-Login`, `User is still accessed from other device! `);
        }
        else {
            // Join room
            let usr = users.UserJoinGame(socket.id, username, room);
            let players = users.findPlayers();

            message = `Welcome ` + username + ` to room ` + room;
            socket.emit(`Server-send-data`, { username, room, message, time: moment().format(`h:mm a`), status: usr.status });

            // Update info players into 2 div id="player1" & id="player2"
            io.sockets.emit(`Update-Info-Player`, players);
        }
    })

    // Event send message to client in chat box
    socket.on(`SendMessagetoServer`, ({ username, room, message }) => {
        let usr = users.UserJoinGame(socket.id, username, room);
        // console.log(`User `, username, ` chat: `, message);
        io.sockets.emit(`Server-send-data`, { username, room, message, time: moment().format(`h:mm a`), status: usr.status });
    })


    // Event click in caro board
    socket.on("su-kien-click", function (data) { // toạ độ x, y

        let player = users.findPlayer(socket.id);
        let vitri = users.users.indexOf(player);
        let Column = data.x / 35;
        let Row = data.y / 35;
        console.log("Luot di cua ng choi: ", player.username, " - vitri: ", vitri, " - col:", Column, " - row:", Row);
        //Kiem tra khong cho nguoi choi gui du lieu 2 lan lien tuc len server
        if (player.username !== players[0]) {
            players.unshift(player.username);
            console.log(`Mang nguoi choi cap nhat:`, players);
            if (vitri === 0) {
                if (arrBoard[Row][Column] === 0) {
                    arrBoard[Row][Column] = 1;
                    io.sockets.emit("send-play-turn", {
                        name: player.username,
                        x: data.x,
                        y: data.y,
                        nguoichoi: vitri,
                        ArrId: players,
                        Board: arrBoard,
                        value: 1
                    })
                    if (game.Horizontal(arrBoard, Row, Column, 1) || game.Vertically(arrBoard, Row, Column, 1) ||
                        game.Diagonal(arrBoard, Row, Column, 1) || game.Diagonal_main(arrBoard, Row, Column, 1)) {
                        socket.broadcast.emit("khong-cho-doi-thu-click-khi-thua");
                        socket.broadcast.emit("phat-su-kien-thang-thua", "BAN DA THUA");
                    }
                }
            }
            else {
                if (arrBoard[Row][Column] === 0) {
                    arrBoard[Row][Column] = 2;
                    io.sockets.emit("send-play-turn", {
                        name: player.username,
                        x: data.x,
                        y: data.y,
                        nguoichoi: vitri,
                        ArrId: players,
                        Board: arrBoard,
                        value: 2
                    })
                    if (game.Horizontal(arrBoard, Row, Column, 2) || game.Vertically(arrBoard, Row, Column, 2) ||
                        game.Diagonal(arrBoard, Row, Column, 2) || game.Diagonal_main(arrBoard, Row, Column, 2)) {
                        socket.broadcast.emit("khong-cho-doi-thu-click-khi-thua");
                        socket.broadcast.emit("phat-su-kien-thang-thua", "BAN DA THUA");
                    }
                }
            }
        }
    })

    // Event client A leave room
    socket.on(`disconnect`, () => {
        let index = users.UserLeaveGame(socket.id);
        console.log(`User `, socket.id, ` disconnect!`);
    });
});

