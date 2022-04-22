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

// on the server side you need to add a middleware that will populate the body parameter in your request object
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// set up view engine
configViewEngine(app);
console.log(`config view!!!`);

// init web route
initWebRoute(app);
console.log(`Init Route!!!`);

// Khởi tạo mảng chứa lượt đi của 2 ng chơi
var turns = [];
var gameStatus = 0; // 0: new game; 1: game is continued; 2: game end

//init game board 15 * 15 with value init = 0
let arrBoard = game.InitMatrix(15, 0);
// console.log(`Caro board: `, arrBoard);

// io.on
// io.sockets.emit --> server respond to all 
// socket.broadcast.emit --> server respond to all except sender
// socket.emit --> respond to only sender
// io.to --> server send to exactly receiver by socket.id
io.on(`connection`, (socket) => {

    // Event new client A join room
    // send to only A message welcome
    // add A --> array User
    socket.on(`Client-join-room`, ({ username, room, message }) => {

        // If A exists in array users => alert & return login pages
        let checkExist = users.findUsername(socket.id, username, room);
        console.log(`Check exists:`, checkExist);
        if (checkExist) {
            socket.emit(`Reject-Login`, `User is still accessed from other device! `);
        }
        else {
            // Join room
            let usr = users.UserJoinGame(socket.id, username, room);
            let players = users.findPlayers();
            console.log(`Start new socket from user: `, username, ` - socketID: `, socket.id);
            console.log('Array Users:', users.users);
            console.log('Array Players:', players);

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
        let arrNgchoi = users.findPlayers();

        if (player !== undefined && arrNgchoi !== null) {
            if (arrNgchoi.length === 2) {
                if (arrNgchoi.includes(player.username) && gameStatus !== 2) {
                    let vitri = users.users.indexOf(player);
                    let Column = data.x / 35;
                    let Row = data.y / 35;
                    console.log("Luot di cua ng choi: ", player.username, " - vitri: ", vitri, " - col:", Column, " - row:", Row);
                    let opponent = turns[0];
                    let opponentId = users.findPlayerId(opponent);

                    //Kiem tra khong cho nguoi choi gui du lieu 2 lan lien tuc len server
                    if (player.username !== turns[0]) {
                        turns.unshift(player.username);
                        console.log(`Mang luot choi cap nhat:`, turns);
                        if (vitri === 0) {
                            if (arrBoard[Row][Column] === 0) {
                                arrBoard[Row][Column] = 1;
                                io.sockets.emit("send-play-turn", {
                                    name: player.username,
                                    x: data.x,
                                    y: data.y,
                                    nguoichoi: vitri,
                                    ArrId: turns,
                                    Board: arrBoard,
                                    value: 1
                                })
                                if (game.Horizontal(arrBoard, Row, Column, 1) || game.Vertically(arrBoard, Row, Column, 1) ||
                                    game.Diagonal(arrBoard, Row, Column, 1) || game.Diagonal_main(arrBoard, Row, Column, 1)) {
                                    socket.broadcast.emit("khong-cho-doi-thu-click-khi-thua");
                                    io.to(opponentId).emit("phat-su-kien-thang-thua", "BẠN ĐÃ THUA"); // Tạo popup trên màn hình người thua
                                    socket.emit("phat-su-kien-thang-thua", "BẠN ĐÃ THẮNG"); // Tạo popup trên màn hình người thắng
                                    io.sockets.emit("send-result-game", "Người thắng cuộc:" + player.username);
                                    turns = [];
                                    gameStatus = 2;
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
                                    ArrId: turns,
                                    Board: arrBoard,
                                    value: 2
                                })
                                if (game.Horizontal(arrBoard, Row, Column, 2) || game.Vertically(arrBoard, Row, Column, 2) ||
                                    game.Diagonal(arrBoard, Row, Column, 2) || game.Diagonal_main(arrBoard, Row, Column, 2)) {
                                    socket.broadcast.emit("khong-cho-doi-thu-click-khi-thua");
                                    io.to(opponentId).emit("phat-su-kien-thang-thua", "BẠN ĐÃ THUA"); // Tạo popup trên màn hình người thua
                                    socket.emit("phat-su-kien-thang-thua", "BẠN ĐÃ THẮNG"); // Tạo popup trên màn hình người thắng
                                    io.sockets.emit("send-result-game", "Người thắng cuộc:" + player.username);
                                    turns = [];
                                    gameStatus = 2;
                                }
                            }
                        }
                    }
                }
                else {

                }
            }
        }
    })

    // Event client A leave room
    socket.on(`disconnect`, () => {
        let dsNgChoi = users.findPlayers();
        let usr = users.findPlayer(socket.id);
        console.log('dsNgChoi:', dsNgChoi);
        console.log('usr:', usr);

        let total = 0;
        let index = users.UserLeaveGame(socket.id);
        console.log(`User `, socket.id, ` disconnect!`);

        // Check ban co da di nuoc nao chua
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                total += arrBoard[i][j];
            }
        }

        if (dsNgChoi !== null && usr !== null) {
            if (dsNgChoi.includes(usr.username)) {
                // console.log('User là người chơi!');
                let opponent = users.findOpponent(socket.id);
                if (opponent) {
                    if (total > 0) {
                        io.to(opponent.id).emit("phat-su-kien-thang-thua", "BẠN ĐÃ THẮNG");
                        io.sockets.emit("send-result-game", "Người thắng cuộc:" + opponent.username);
                        turns = [];
                        gameStatus = 2;
                    }
                    else {
                        dsNgChoi = users.findPlayers();
                        io.sockets.emit(`Update-Info-Player`, dsNgChoi);
                        turns = [];
                    }
                }
                else { }
            }
            else {
                // console.log(`User là viewer!`);
            }
        }
    });
});

