import express from 'express';
import moment from 'moment';
import configViewEngine from './configs/viewEngine';
import initWebRoute from '../src/route/web';
import users from './controller/userController';
import DatabaseController from './controller/DatabaseController';
import homeController from './controller/homeController';
import cookieParser from "cookie-parser";
import sessions from 'express-session';

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

const oneSession = 1000 * 60 * 60;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneSession },
    resave: false
}));

// cookie parser middleware
app.use(cookieParser());

// set up view engine
configViewEngine(app);
console.log(`config view!!!`);

// init web route
initWebRoute(app);
console.log(`Init Route!!!`);

// io.on
// io.sockets.emit --> server respond to all 
// socket.broadcast.emit --> server respond to all except sender
// socket.emit --> respond to only sender
// io.to --> server send to exactly receiver by socket.id
io.on(`connection`, (socket) => {

    // Event new client A join room
    socket.on(`Client-join-room`, async (data) => {
        // join socket to room
        socket.join(data.room);

        console.log('Check data client ', data.username, ' send to server when join room: ', data);

        // Welcome user trong khung chat
        socket.emit(`Server-send-data`, {
            'username': data.username,
            'message': `Welcome ` + data.username + ` to room ` + data.room,
            'time': moment().format(`h:mm a`)
        });

        // L???y th??ng tin danh s??ch ng?????i ch??i v?? hi???n th??? l??n giao di???n
        // N???u ph??ng ch??i ???? ????? 2 ng?????i ch??i => hi???n th??? n??t Ready
        io.to(data.room).emit(`Update-Info-Player`, {
            'countPlayer': data.countPlayer,
            'Player1': data.Player1,
            'Player2': data.Player2
        });

        // Update value socketID to table users
        await DatabaseController.updateSocketID(data.username, socket.id);

        // Send to client info of game & arrBoard
        let caroGame = await DatabaseController.checkGameStatus(data.room, data.domainID);
        // console.log('caroGame:', caroGame);
        if (caroGame) {
            let GameStatus = caroGame.GameStatus;
            let NextTurn = caroGame.NextTurn;
            let str_arrBoard = caroGame.arrBoard;
            let arrBoard = game.ConvertStringToMatrix(str_arrBoard);

            socket.emit('Draw-Game-Board', {
                'GameStatus': GameStatus,
                'NextTurn': NextTurn,
                'arrBoard': arrBoard
            })
        }
    })

    // Event send message to client in chat box
    socket.on(`SendMessagetoServer`, ({ username, room, message }) => {
        let usr = users.UserJoinGame(socket.id, username, room);
        // console.log(`User `, username, ` chat: `, message);
        io.to(room).emit(`Server-send-data`, { username, room, message, time: moment().format(`h:mm a`), status: usr.status });
    })

    // Event Player A click Ready button
    socket.on("Ready-To-Player", async (data) => {
        let message = 'Player ' + data.username + ' ready to play!';

        // Send message to all client chatbox
        io.to(data.room).emit(`Server-send-data`, {
            'username': data.username,
            'room': data.room,
            'message': message,
            'time': moment().format(`h:mm a`)
        });

        // Update Status Player in table games
        let cntPlayerReady = await DatabaseController.updatePlayerStatus(data.room, data.domainID, data.Player);

        if (cntPlayerReady === 1) {
            console.log('Start game at room: ', data.room, ' - domain: ', data.domain, '!!!');

            // update game status --> 1: start game
            await DatabaseController.updateGameStatus(data.room, data.domainID, 1, null);

            // Hi???n th??ng b??o game b???t ?????u, l?????t ch??i c???a ng?????i ch??i th??? 1
            // Active c??c n??t Resign, Draw, New Game tr??n m??n h??nh 2 ng?????i ch??i
            io.to(data.room).emit(`Start-game`, {
                'room': data.room,
                'domain': data.domainID
            });
        }
    })

    // DRAW BUTTON
    // ------------------------------------    

    socket.on("Request-Draw", async (data) => {
        console.log('Request draw: ', data);

        // L???y th??ng tin ?????i th???
        let opponent = await DatabaseController.getOpponentInfo(data.userRequest, data.room, data.domainID);
        console.log('Check info opponent: ', opponent);

        // G???i th??ng tin ?????n player B c??n l???i v??? vi???c player A mu???n ho??
        io.to(opponent.SocketID).emit("Response-Draw", {
            "userRequest": data.userRequest,
            'room': data.room,
            'domainID': data.domainID,
            "message": "Player " + data.userRequest + " mu???n ho??!"
        });
    })

    socket.on("Confirm-Draw", async (data) => {
        console.log('confirm draw: ', data);

        // C???p nh???t k???t qu??? tr???n ?????u ho?? v??o table games
        await DatabaseController.updateGameStatus(data.room, data.domainID, 2, 0);

        // C???p nh???t k???t qu??? l??n giao di???n room
        io.to(data.room).emit(`Update-Game-Result`, {
            'userRequest': data.userRequest,
            'room': data.room,
            'domainID': data.domainID,
            'result': 0,
            'message': "K???t qu??? tr???n ?????u: Ho??!"
        });
    })

    socket.on("Reject-Draw", async (data) => {
        console.log('reject draw: ', data);

        // L???y th??ng tin ?????i th???
        let opponent = await DatabaseController.getOpponentInfo(data.userReject, data.room, data.domainID);
        console.log('Check info opponent: ', opponent);

        // G???i th??ng tin ?????n player B c??n l???i v??? vi???c player A mu???n ho??
        io.to(opponent.SocketID).emit("Confirm-Reject-Draw", { "message": "Player " + data.userReject + " t??? ch???i ho??!" });
    })

    // ------------------------------------

    // RESIGN BUTTON
    // ------------------------------------

    socket.on("Resign", async (data) => {
        console.log('Check data resign:', data);

        // C???p nh???t k???t qu??? v??n ?????u v??o table games
        await DatabaseController.updateGameStatus(data.room, data.domainID, 2, data.Player);

        // C???p nh???t k???t qu??? l??n giao di???n client
        io.to(data.room).emit("Update-Game-Result", {
            'userRequest': data.userResign,
            'room': data.room,
            'domainID': data.domainID,
            'result': data.Player,
            'message': "K???t qu??? tr???n ?????u: " + data.userResign + " thua!"
        })
    })

    // ------------------------------------

    // NEW GAME BUTTON
    // ------------------------------------

    socket.on("Request-New-Game", async (data) => {
        console.log('Check data new game:', data);

        // L???y th??ng tin ?????i th???
        let opponent = await DatabaseController.getOpponentInfo(data.userRequest, data.room, data.domainID);
        console.log('Check info opponent: ', opponent);

        // G???i th??ng tin ?????n player B c??n l???i v??? vi???c player A mu???n ch??i l???i v??n m???i
        io.to(opponent.SocketID).emit("Response-New-Game", {
            "userRequest": data.userRequest,
            'room': data.room,
            'domainID': data.domainID,
            'result': data.result,
            "message": "Player " + data.userRequest + " mu???n ch??i l???i v??n m???i!"
        });
    })

    socket.on("Confirm-New-Game", async (data) => {
        console.log('Check data confirm new game: ', data);

        // Kh???i t???o l???i ma tr???n b??n c??? --> update v??o tbl games
        // init game board 15 * 15 with value init = 0
        let arrBoard = game.InitMatrix(15, 0);
        // Convert matrix to string & save to DB
        let str_arrBoard = game.ConvertMatrixToString(arrBoard);

        // C???p nh???t kh???i t???o l???i th??ng tin v??n ?????u
        await DatabaseController.updateRenewGame(data.room, data.domainID, str_arrBoard);

        // // L???y th??ng tin ?????i th???
        // let opponent = await DatabaseController.getOpponentInfo(data.userConfirm, data.room, data.domainID);
        // console.log('Check info opponent: ', opponent);

        // Alert ?????n player B c??n l???i v??? vi???c player A ?????ng ?? v??n m???i
        io.to(data.room).emit("Respose-Confirm-NewGame", {
            "userConfirm": data.userConfirm,
            "message": "Player " + data.userConfirm + " ?????ng ?? t???o v??n m???i!"
        });

        // V??? l???i b??n c??? tr??n to??n b??? client c???a room
        io.to(data.room).emit('Draw-Game-Board', {
            'GameStatus': 0,
            'NextTurn': data.Player1,
            'arrBoard': arrBoard
        })
    })

    socket.on("Reject-New-Game", async (data) => {
        console.log('Check data reject new game: ', data);

        // L???y th??ng tin ?????i th???
        let opponent = await DatabaseController.getOpponentInfo(data.userReject, data.room, data.domainID);
        console.log('Check info opponent: ', opponent);

        // G???i th??ng tin ?????n player B c??n l???i v??? vi???c player A mu???n ho??
        io.to(opponent.SocketID).emit("Confirm-Reject-NewGame", {
            "result": data.result,
            "message": "Player " + data.userReject + " t??? ch???i t???o v??n m???i!"
        });
    })

    // ------------------------------------

    socket.on("Leave-Room", async (data) => {
        console.log('Check data leave room: ', data);

        // Check game status
        let status = await DatabaseController.checkGameStatus(data.room, data.domainID);
        let gameStatus = status.GameStatus;
        console.log('Check game status when player leaving:', gameStatus);

        // update database
        await DatabaseController.updateUserLeaveRoom(data.username, data.room, data.domainID, data.isPlayer, data.Player);

        if (data.isPlayer === '0') { // Viewer
            // Send message to all client chatbox
            io.to(data.room).emit(`Server-send-data`, {
                'username': data.username,
                'room': data.room,
                'message': data.username + ' ???? r???i kh???i ph??ng!!!',
                'time': moment().format(`h:mm a`)
            });
        }
        else if (data.isPlayer === '1') {
            if (data.Player === 1) {// Player 1
                if (gameStatus === 0 || gameStatus === 2) { // V??n ?????u ch??a di???n ra ho???c ???? k???t th??c
                    // alert ch??? ph??ng r???i ph??ng
                    io.to(data.room).emit("Alert-Owner-LeaveRoom", {
                        'message': 'Ch??? ph??ng ch??i ???? r???i ??i! Vui l??ng tho??t ra!!!'
                    })
                }
                else if (gameStatus === 1) { // V??n ?????u ??ang di???n ra

                    // C???p nh???t k???t qu??? l??n giao di???n client
                    io.to(data.room).emit("Update-Game-Result", {
                        'userRequest': data.username,
                        'room': data.room,
                        'domainID': data.domainID,
                        'result': data.Player,
                        'message': "K???t qu??? tr???n ?????u: " + data.username + " thua!"
                    })

                    // alert ch??? ph??ng r???i ph??ng
                    io.to(data.room).emit("Alert-Owner-LeaveRoom", {
                        'message': 'Ch??? ph??ng ch??i ???? r???i ??i! Vui l??ng tho??t ra!!!'
                    })
                }

                // Send message to all client chatbox
                io.to(data.room).emit(`Server-send-data`, {
                    'username': data.username,
                    'room': data.room,
                    'message': 'Ch??? ph??ng ch??i ' + data.username + ' ???? r???i kh???i ph??ng! Ng?????i ch??i kh??c vui l??ng tho??t ra!!!',
                    'time': moment().format(`h:mm a`)
                });
            }
            else if (data.Player === 2) { // Player 2
                if (gameStatus === 0 || gameStatus === 2) { // V??n ?????u ch??a di???n ra ho???c ???? k???t th??c
                    // alert ng?????i ch??i r???i ph??ng
                    io.to(data.room).emit("Alert-Player-LeaveRoom", {
                        'message': 'Ng?????i ch??i ' + data.username + ' ???? r???i kh???i ph??ng!!!'
                    })
                }
                else if (gameStatus === 1) { // V??n ?????u ??ang di???n ra

                    // C???p nh???t k???t qu??? l??n giao di???n client
                    io.to(data.room).emit("Update-Game-Result", {
                        'userRequest': data.username,
                        'room': data.room,
                        'domainID': data.domainID,
                        'result': data.Player,
                        'message': "K???t qu??? tr???n ?????u: " + data.username + " thua!"
                    })

                    // alert ng?????i ch??i r???i ph??ng
                    io.to(data.room).emit("Alert-Player-LeaveRoom", {
                        'message': 'Ng?????i ch??i ' + data.username + ' ???? r???i kh???i ph??ng!!!'
                    })
                }

                // Send message to all client chatbox
                io.to(data.room).emit(`Server-send-data`, {
                    'username': data.username,
                    'room': data.room,
                    'message': 'Ng?????i ch??i ' + data.username + ' ???? r???i kh???i ph??ng!!!',
                    'time': moment().format(`h:mm a`)
                });
            }
        }


    })

    // Event click in caro board
    socket.on("su-kien-click", async (data) => {
        console.log('Input of player turn:', data);

        let status = await DatabaseController.checkGameStatus(data.room, data.domainID);
        // console.log('Tr???ng th??i v??n c??? khi c?? s??? ki???n click:', status);
        let gameStatus = status.GameStatus;
        let NextTurn = status.NextTurn;
        let str_arrBoard = status.arrBoard;
        let arrBoard = game.ConvertStringToMatrix(str_arrBoard);

        if (data && gameStatus == 1) { // V??n ?????u ??ang di???n ra
            let Column = data.x / 35;
            let Row = data.y / 35;
            let vitri;
            if (data.isPlayer == 1 && data.username === NextTurn) { // N???u l?? ng?????i ch??i && ?????n l?????t th?? m???i x??? l?? ti???p
                if (data.username === data.Player1) {
                    vitri = 1;
                }
                else if (data.username === data.Player2) {
                    vitri = 2;
                }
                console.log(`DomainID: `, data.domainID, ` - Room: `, data.room, `Luot di cua ng choi: `,
                    NextTurn, " - vitri: ", vitri, " - col:", Column, " - row:", Row);

                // L???y th??ng tin ?????i th???
                let opponent = await DatabaseController.getOpponentInfo(data.username, data.room, data.domainID);
                // console.log('Check info opponent: ', opponent);

                if (vitri === 1) {// Player1 ????nh
                    if (arrBoard[Row][Column] === 0) { // Ch??? x??? l?? v???i c??c ?? ch??a ????nh

                        // Update gi?? tr??? v??? 1
                        arrBoard[Row][Column] = 1;

                        // Hi???n th??? n?????c ??i l??n giao di???n client
                        io.to(data.room).emit("send-play-turn", {
                            'name': data.username,
                            'x': data.x,
                            'y': data.y,
                            'nguoichoi': vitri,
                            'NextTurn': NextTurn,
                            Board: arrBoard,
                            value: 1
                        })

                        // Check ??i???u ki???n chi???n th???ng
                        if (game.Horizontal(arrBoard, Row, Column, 1) || game.Vertically(arrBoard, Row, Column, 1) ||
                            game.Diagonal(arrBoard, Row, Column, 1) || game.Diagonal_main(arrBoard, Row, Column, 1)) {

                            io.to(data.room).emit("prevent-click-onboard");
                            io.to(opponent.SocketID).emit("alert-result", "B???N ???? THUA"); // T???o popup tr??n m??n h??nh ng?????i thua
                            socket.emit("alert-result", "B???N ???? TH???NG"); // T???o popup tr??n m??n h??nh ng?????i th???ng

                            // C???p nh???t k???t qu??? l??n giao di???n client
                            io.to(data.room).emit("Update-Game-Result", {
                                'userRequest': data.username,
                                'room': data.room,
                                'domainID': data.domainID,
                                'result': vitri,
                                'message': "K???t qu??? tr???n ?????u: " + opponent.Username + " thua!"
                            })

                            // C???p nh???t k???t qu??? v??n ?????u v??o table games
                            await DatabaseController.updateGameStatus(data.room, data.domainID, 2, vitri);
                        }
                        else { // V??n ?????u ch??a k???t th??c
                            NextTurn = opponent.Username;
                            str_arrBoard = game.ConvertMatrixToString(arrBoard);

                            // C???p nh???t NextTurn v??o tbl games
                            await DatabaseController.updateNextTurn(data.room, data.domainID, NextTurn, str_arrBoard);

                            // Hi???n th??? l?????t ??i ti???p theo l??n client
                            io.to(data.room).emit("Next-turn", {
                                'Player': opponent.Username,
                                'vitri': vitri,
                                'message': '?????n l?????t ??i c???a ng?????i ch??i: ' + opponent.Username,
                                'room': data.room,
                                'domainID': data.domainID
                            })
                        }
                    }
                }
                else if (vitri === 2) { // Player2 ????nh
                    if (arrBoard[Row][Column] === 0) { // Ch??? x??? l?? v???i c??c ?? ch??a ????nh

                        // Update gi?? tr??? v??? 2
                        arrBoard[Row][Column] = 2;

                        // Hi???n th??? n?????c ??i l??n giao di???n client
                        io.to(data.room).emit("send-play-turn", {
                            'name': data.username,
                            'x': data.x,
                            'y': data.y,
                            'nguoichoi': vitri,
                            'NextTurn': NextTurn,
                            Board: arrBoard,
                            value: 2
                        })
                    }

                    // Check ??i???u ki???n chi???n th???ng
                    if (game.Horizontal(arrBoard, Row, Column, 2) || game.Vertically(arrBoard, Row, Column, 2) ||
                        game.Diagonal(arrBoard, Row, Column, 2) || game.Diagonal_main(arrBoard, Row, Column, 2)) {

                        io.to(data.room).emit("prevent-click-onboard");
                        io.to(opponent.SocketID).emit("alert-result", "B???N ???? THUA"); // T???o popup tr??n m??n h??nh ng?????i thua
                        socket.emit("alert-result", "B???N ???? TH???NG"); // T???o popup tr??n m??n h??nh ng?????i th???ng

                        // C???p nh???t k???t qu??? l??n giao di???n client
                        io.to(data.room).emit("Update-Game-Result", {
                            'userRequest': data.username,
                            'room': data.room,
                            'domainID': data.domainID,
                            'result': vitri,
                            'message': "K???t qu??? tr???n ?????u: " + opponent.Username + " thua!"
                        })

                        // C???p nh???t k???t qu??? v??n ?????u v??o table games
                        await DatabaseController.updateGameStatus(data.room, data.domainID, 2, vitri);
                    }
                    else { // V??n ?????u ch??a k???t th??c
                        NextTurn = opponent.Username;
                        str_arrBoard = game.ConvertMatrixToString(arrBoard);

                        // C???p nh???t NextTurn v??o tbl games
                        await DatabaseController.updateNextTurn(data.room, data.domainID, NextTurn, str_arrBoard);

                        // Hi???n th??? l?????t ??i ti???p theo l??n client
                        io.to(data.room).emit("Next-turn", {
                            'Player': opponent.Username,
                            'vitri': vitri,
                            'message': '?????n l?????t ??i c???a ng?????i ch??i: ' + opponent.Username,
                            'room': data.room,
                            'domainID': data.domainID
                        })
                    }
                }
            }
        }
    })

    socket.on("expired-timer", async (data) => {
        console.log('Check message expired-timer from player send:', data);

        // Kh??ng cho ng?????i ch??i ??i ti???p
        io.to(data.room).emit("prevent-click-onboard");
        socket.emit("alert-result", "B???N ???? TH???NG"); // T???o popup tr??n m??n h??nh ng?????i th???ng

        // L???y th??ng tin ?????i th???
        let opponent = await DatabaseController.getOpponentInfo(data.userRequest, data.room, data.domainID);
        io.to(opponent.SocketID).emit("alert-result", "B???N ???? THUA"); // T???o popup tr??n m??n h??nh ng?????i thua

        // C???p nh???t k???t qu??? l??n giao di???n client
        io.to(data.room).emit("Update-Game-Result", {
            'userRequest': data.userRequest,
            'room': data.room,
            'domainID': data.domainID,
            'result': data.vitri,
            'message': "K???t qu??? tr???n ?????u: " + data.Player_expired + " thua!"
        })

        // C???p nh???t k???t qu??? v??n ?????u v??o table games
        await DatabaseController.updateGameStatus(data.room, data.domainID, 2, data.vitri);
    })

    // Event client A leave room
    socket.on(`disconnect`, async () => {
        console.log('check socketID disconnect:', socket.id);
        let userInfo = await DatabaseController.getUserInfoBySocket(socket.id);

        if (userInfo) {
            // update database
            await DatabaseController.updateUserLeaveRoom(userInfo.username, userInfo.room, userInfo.domainID, userInfo.isPlayer, userInfo.Player);

            if (userInfo.isPlayer === 0) { // Viewer
                // Send message to all client chatbox
                io.to(userInfo.room).emit(`Server-send-data`, {
                    'username': userInfo.username,
                    'room': userInfo.room,
                    'message': userInfo.username + ' ???? r???i kh???i ph??ng!!!',
                    'time': moment().format(`h:mm a`)
                });
            }
            else if (userInfo.isPlayer === 1) {
                if (userInfo.Player === 1) {// Player 1
                    if (userInfo.GameStatus === 0 || userInfo.GameStatus === 2) { // V??n ?????u ch??a di???n ra ho???c ???? k???t th??c
                        // alert ch??? ph??ng r???i ph??ng
                        io.to(userInfo.room).emit("Alert-Owner-LeaveRoom", {
                            'message': 'Ch??? ph??ng ch??i ???? r???i ??i! Vui l??ng tho??t ra!!!'
                        })
                    }
                    else if (userInfo.GameStatus === 1) { // V??n ?????u ??ang di???n ra

                        // C???p nh???t k???t qu??? l??n giao di???n client
                        io.to(userInfo.room).emit("Update-Game-Result", {
                            'userRequest': userInfo.username,
                            'room': userInfo.room,
                            'domainID': userInfo.domainID,
                            'result': userInfo.Player,
                            'message': "K???t qu??? tr???n ?????u: " + userInfo.username + " thua!"
                        })

                        // alert ch??? ph??ng r???i ph??ng
                        io.to(userInfo.room).emit("Alert-Owner-LeaveRoom", {
                            'message': 'Ch??? ph??ng ch??i ???? r???i ??i! Vui l??ng tho??t ra!!!'
                        })
                    }

                    // Send message to all client chatbox
                    io.to(userInfo.room).emit(`Server-send-data`, {
                        'username': userInfo.username,
                        'room': userInfo.room,
                        'message': 'Ch??? ph??ng ch??i ' + userInfo.username + ' ???? r???i kh???i ph??ng! Ng?????i ch??i kh??c vui l??ng tho??t ra!!!',
                        'time': moment().format(`h:mm a`)
                    });
                }
                else if (userInfo.Player === 2) { // Player 2
                    if (userInfo.GameStatus === 0 || userInfo.GameStatus === 2) { // V??n ?????u ch??a di???n ra ho???c ???? k???t th??c
                        // alert ng?????i ch??i r???i ph??ng
                        io.to(userInfo.room).emit("Alert-Player-LeaveRoom", {
                            'message': 'Ng?????i ch??i ' + userInfo.username + ' ???? r???i kh???i ph??ng!!!'
                        })
                    }
                    else if (userInfo.GameStatus === 1) { // V??n ?????u ??ang di???n ra

                        // C???p nh???t k???t qu??? l??n giao di???n client
                        io.to(userInfo.room).emit("Update-Game-Result", {
                            'userRequest': userInfo.username,
                            'room': userInfo.room,
                            'domainID': userInfo.domainID,
                            'result': userInfo.Player,
                            'message': "K???t qu??? tr???n ?????u: " + userInfo.username + " thua!"
                        })

                        // alert ng?????i ch??i r???i ph??ng
                        io.to(userInfo.room).emit("Alert-Player-LeaveRoom", {
                            'message': 'Ng?????i ch??i ' + userInfo.username + ' ???? r???i kh???i ph??ng!!!'
                        })
                    }

                    // Send message to all client chatbox
                    io.to(userInfo.room).emit(`Server-send-data`, {
                        'username': userInfo.username,
                        'room': userInfo.room,
                        'message': 'Ng?????i ch??i ' + userInfo.username + ' ???? r???i kh???i ph??ng!!!',
                        'time': moment().format(`h:mm a`)
                    });
                }
            }
        }

    });
});

