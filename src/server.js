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

        // Lấy thông tin danh sách người chơi và hiển thị lên giao diện
        // Nếu phòng chơi đã đủ 2 người chơi => hiển thị nút Ready
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

            // Hiện thông báo game bắt đầu, lượt chơi của người chơi thứ 1
            // Active các nút Resign, Draw, New Game trên màn hình 2 người chơi
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

        // Lấy thông tin đối thủ
        let opponent = await DatabaseController.getOpponentInfo(data.userRequest, data.room, data.domainID);
        console.log('Check info opponent: ', opponent);

        // Gửi thông tin đến player B còn lại về việc player A muốn hoà
        io.to(opponent.SocketID).emit("Response-Draw", {
            "userRequest": data.userRequest,
            'room': data.room,
            'domainID': data.domainID,
            "message": "Player " + data.userRequest + " muốn hoà!"
        });
    })

    socket.on("Confirm-Draw", async (data) => {
        console.log('confirm draw: ', data);

        // Cập nhật kết quả trận đấu hoà vào table games
        await DatabaseController.updateGameStatus(data.room, data.domainID, 2, 0);

        // Cập nhật kết quả lên giao diện room
        io.to(data.room).emit(`Update-Game-Result`, {
            'userRequest': data.userRequest,
            'room': data.room,
            'domainID': data.domainID,
            'result': 0,
            'message': "Kết quả trận đấu: Hoà!"
        });
    })

    socket.on("Reject-Draw", async (data) => {
        console.log('reject draw: ', data);

        // Lấy thông tin đối thủ
        let opponent = await DatabaseController.getOpponentInfo(data.userReject, data.room, data.domainID);
        console.log('Check info opponent: ', opponent);

        // Gửi thông tin đến player B còn lại về việc player A muốn hoà
        io.to(opponent.SocketID).emit("Confirm-Reject-Draw", { "message": "Player " + data.userReject + " từ chối hoà!" });
    })

    // ------------------------------------

    // RESIGN BUTTON
    // ------------------------------------

    socket.on("Resign", async (data) => {
        console.log('Check data resign:', data);

        // Cập nhật kết quả ván đấu vào table games
        await DatabaseController.updateGameStatus(data.room, data.domainID, 2, data.Player);

        // Cập nhật kết quả lên giao diện client
        io.to(data.room).emit("Update-Game-Result", {
            'userRequest': data.userResign,
            'room': data.room,
            'domainID': data.domainID,
            'result': data.Player,
            'message': "Kết quả trận đấu: " + data.userResign + " thua!"
        })
    })

    // ------------------------------------

    // NEW GAME BUTTON
    // ------------------------------------

    socket.on("Request-New-Game", async (data) => {
        console.log('Check data new game:', data);

        // Lấy thông tin đối thủ
        let opponent = await DatabaseController.getOpponentInfo(data.userRequest, data.room, data.domainID);
        console.log('Check info opponent: ', opponent);

        // Gửi thông tin đến player B còn lại về việc player A muốn chơi lại ván mới
        io.to(opponent.SocketID).emit("Response-New-Game", {
            "userRequest": data.userRequest,
            'room': data.room,
            'domainID': data.domainID,
            'result': data.result,
            "message": "Player " + data.userRequest + " muốn chơi lại ván mới!"
        });
    })

    socket.on("Confirm-New-Game", async (data) => {
        console.log('Check data confirm new game: ', data);

        // Khởi tạo lại ma trận bàn cờ --> update vào tbl games
        // init game board 15 * 15 with value init = 0
        let arrBoard = game.InitMatrix(15, 0);
        // Convert matrix to string & save to DB
        let str_arrBoard = game.ConvertMatrixToString(arrBoard);

        // Cập nhật khởi tạo lại thông tin ván đấu
        await DatabaseController.updateRenewGame(data.room, data.domainID, str_arrBoard);

        // // Lấy thông tin đối thủ
        // let opponent = await DatabaseController.getOpponentInfo(data.userConfirm, data.room, data.domainID);
        // console.log('Check info opponent: ', opponent);

        // Alert đến player B còn lại về việc player A đồng ý ván mới
        io.to(data.room).emit("Respose-Confirm-NewGame", {
            "userConfirm": data.userConfirm,
            "message": "Player " + data.userConfirm + " đồng ý tạo ván mới!"
        });

        // Vẽ lại bàn cờ trên toàn bộ client của room
        io.to(data.room).emit('Draw-Game-Board', {
            'GameStatus': 0,
            'NextTurn': data.Player1,
            'arrBoard': arrBoard
        })
    })

    socket.on("Reject-New-Game", async (data) => {
        console.log('Check data reject new game: ', data);

        // Lấy thông tin đối thủ
        let opponent = await DatabaseController.getOpponentInfo(data.userReject, data.room, data.domainID);
        console.log('Check info opponent: ', opponent);

        // Gửi thông tin đến player B còn lại về việc player A muốn hoà
        io.to(opponent.SocketID).emit("Confirm-Reject-NewGame", {
            "result": data.result,
            "message": "Player " + data.userReject + " từ chối tạo ván mới!"
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
                'message': data.username + ' đã rời khỏi phòng!!!',
                'time': moment().format(`h:mm a`)
            });
        }
        else if (data.isPlayer === '1') {
            if (data.Player === 1) {// Player 1
                if (gameStatus === 0 || gameStatus === 2) { // Ván đấu chưa diễn ra hoặc đã kết thúc
                    // alert chủ phòng rời phòng
                    io.to(data.room).emit("Alert-Owner-LeaveRoom", {
                        'message': 'Chủ phòng chơi đã rời đi! Vui lòng thoát ra!!!'
                    })
                }
                else if (gameStatus === 1) { // Ván đấu đang diễn ra

                    // Cập nhật kết quả lên giao diện client
                    io.to(data.room).emit("Update-Game-Result", {
                        'userRequest': data.username,
                        'room': data.room,
                        'domainID': data.domainID,
                        'result': data.Player,
                        'message': "Kết quả trận đấu: " + data.username + " thua!"
                    })

                    // alert chủ phòng rời phòng
                    io.to(data.room).emit("Alert-Owner-LeaveRoom", {
                        'message': 'Chủ phòng chơi đã rời đi! Vui lòng thoát ra!!!'
                    })
                }

                // Send message to all client chatbox
                io.to(data.room).emit(`Server-send-data`, {
                    'username': data.username,
                    'room': data.room,
                    'message': 'Chủ phòng chơi ' + data.username + ' đã rời khỏi phòng! Người chơi khác vui lòng thoát ra!!!',
                    'time': moment().format(`h:mm a`)
                });
            }
            else if (data.Player === 2) { // Player 2
                if (gameStatus === 0 || gameStatus === 2) { // Ván đấu chưa diễn ra hoặc đã kết thúc
                    // alert người chơi rời phòng
                    io.to(data.room).emit("Alert-Player-LeaveRoom", {
                        'message': 'Người chơi ' + data.username + ' đã rời khỏi phòng!!!'
                    })
                }
                else if (gameStatus === 1) { // Ván đấu đang diễn ra

                    // Cập nhật kết quả lên giao diện client
                    io.to(data.room).emit("Update-Game-Result", {
                        'userRequest': data.username,
                        'room': data.room,
                        'domainID': data.domainID,
                        'result': data.Player,
                        'message': "Kết quả trận đấu: " + data.username + " thua!"
                    })

                    // alert người chơi rời phòng
                    io.to(data.room).emit("Alert-Player-LeaveRoom", {
                        'message': 'Người chơi ' + data.username + ' đã rời khỏi phòng!!!'
                    })
                }

                // Send message to all client chatbox
                io.to(data.room).emit(`Server-send-data`, {
                    'username': data.username,
                    'room': data.room,
                    'message': 'Người chơi ' + data.username + ' đã rời khỏi phòng!!!',
                    'time': moment().format(`h:mm a`)
                });
            }
        }


    })

    // Event click in caro board
    socket.on("su-kien-click", async (data) => {
        console.log('Input of player turn:', data);

        let status = await DatabaseController.checkGameStatus(data.room, data.domainID);
        // console.log('Trạng thái ván cờ khi có sự kiện click:', status);
        let gameStatus = status.GameStatus;
        let NextTurn = status.NextTurn;
        let str_arrBoard = status.arrBoard;
        let arrBoard = game.ConvertStringToMatrix(str_arrBoard);

        if (data && gameStatus == 1) { // Ván đấu đang diễn ra
            let Column = data.x / 35;
            let Row = data.y / 35;
            let vitri;
            if (data.isPlayer == 1 && data.username === NextTurn) { // Nếu là người chơi && đến lượt thì mới xử lý tiếp
                if (data.username === data.Player1) {
                    vitri = 1;
                }
                else if (data.username === data.Player2) {
                    vitri = 2;
                }
                console.log(`DomainID: `, data.domainID, ` - Room: `, data.room, `Luot di cua ng choi: `,
                    NextTurn, " - vitri: ", vitri, " - col:", Column, " - row:", Row);

                // Lấy thông tin đối thủ
                let opponent = await DatabaseController.getOpponentInfo(data.username, data.room, data.domainID);
                // console.log('Check info opponent: ', opponent);

                if (vitri === 1) {// Player1 đánh
                    if (arrBoard[Row][Column] === 0) { // Chỉ xử lý với các ô chưa đánh

                        // Update giá trị về 1
                        arrBoard[Row][Column] = 1;

                        // Hiển thị nước đi lên giao diện client
                        io.to(data.room).emit("send-play-turn", {
                            'name': data.username,
                            'x': data.x,
                            'y': data.y,
                            'nguoichoi': vitri,
                            'NextTurn': NextTurn,
                            Board: arrBoard,
                            value: 1
                        })

                        // Check điều kiện chiến thắng
                        if (game.Horizontal(arrBoard, Row, Column, 1) || game.Vertically(arrBoard, Row, Column, 1) ||
                            game.Diagonal(arrBoard, Row, Column, 1) || game.Diagonal_main(arrBoard, Row, Column, 1)) {

                            io.to(data.room).emit("prevent-click-onboard");
                            io.to(opponent.SocketID).emit("alert-result", "BẠN ĐÃ THUA"); // Tạo popup trên màn hình người thua
                            socket.emit("alert-result", "BẠN ĐÃ THẮNG"); // Tạo popup trên màn hình người thắng

                            // Cập nhật kết quả lên giao diện client
                            io.to(data.room).emit("Update-Game-Result", {
                                'userRequest': data.username,
                                'room': data.room,
                                'domainID': data.domainID,
                                'result': vitri,
                                'message': "Kết quả trận đấu: " + opponent.Username + " thua!"
                            })

                            // Cập nhật kết quả ván đấu vào table games
                            await DatabaseController.updateGameStatus(data.room, data.domainID, 2, vitri);
                        }
                        else { // Ván đấu chưa kết thúc
                            NextTurn = opponent.Username;
                            str_arrBoard = game.ConvertMatrixToString(arrBoard);

                            // Hiển thị lượt đi tiếp theo lên client
                            io.to(data.room).emit("Next-turn", {
                                'Player': opponent.Username,
                                'vitri': vitri,
                                'message': 'Đến lượt đi của người chơi: ' + opponent.Username,
                                'room': data.room,
                                'domainID': data.domainID
                            })

                            // Cập nhật NextTurn vào tbl games
                            await DatabaseController.updateNextTurn(data.room, data.domainID, NextTurn, str_arrBoard);
                        }
                    }
                }
                else if (vitri === 2) { // Player2 đánh
                    if (arrBoard[Row][Column] === 0) { // Chỉ xử lý với các ô chưa đánh

                        // Update giá trị về 2
                        arrBoard[Row][Column] = 2;

                        // Hiển thị nước đi lên giao diện client
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

                    // Check điều kiện chiến thắng
                    if (game.Horizontal(arrBoard, Row, Column, 2) || game.Vertically(arrBoard, Row, Column, 2) ||
                        game.Diagonal(arrBoard, Row, Column, 2) || game.Diagonal_main(arrBoard, Row, Column, 2)) {

                        io.to(data.room).emit("prevent-click-onboard");
                        io.to(opponent.SocketID).emit("alert-result", "BẠN ĐÃ THUA"); // Tạo popup trên màn hình người thua
                        socket.emit("alert-result", "BẠN ĐÃ THẮNG"); // Tạo popup trên màn hình người thắng

                        // Cập nhật kết quả lên giao diện client
                        io.to(data.room).emit("Update-Game-Result", {
                            'userRequest': data.username,
                            'room': data.room,
                            'domainID': data.domainID,
                            'result': vitri,
                            'message': "Kết quả trận đấu: " + opponent.Username + " thua!"
                        })

                        // Cập nhật kết quả ván đấu vào table games
                        await DatabaseController.updateGameStatus(data.room, data.domainID, 2, vitri);
                    }
                    else { // Ván đấu chưa kết thúc
                        NextTurn = opponent.Username;
                        str_arrBoard = game.ConvertMatrixToString(arrBoard);

                        // Hiển thị lượt đi tiếp theo lên client
                        io.to(data.room).emit("Next-turn", {
                            'Player': opponent.Username,
                            'vitri': vitri,
                            'message': 'Đến lượt đi của người chơi: ' + opponent.Username,
                            'room': data.room,
                            'domainID': data.domainID
                        })

                        // Cập nhật NextTurn vào tbl games
                        await DatabaseController.updateNextTurn(data.room, data.domainID, NextTurn, str_arrBoard);
                    }
                }
            }
        }
    })

    socket.on("expired-timer", async (data) => {
        console.log('Check message expired-timer from player send:', data);

        // Không cho người chơi đi tiếp
        io.to(data.room).emit("prevent-click-onboard");
        socket.emit("alert-result", "BẠN ĐÃ THẮNG"); // Tạo popup trên màn hình người thắng

        // Lấy thông tin đối thủ
        let opponent = await DatabaseController.getOpponentInfo(data.userRequest, data.room, data.domainID);
        io.to(opponent.SocketID).emit("alert-result", "BẠN ĐÃ THUA"); // Tạo popup trên màn hình người thua

        // Cập nhật kết quả lên giao diện client
        io.to(data.room).emit("Update-Game-Result", {
            'userRequest': data.userRequest,
            'room': data.room,
            'domainID': data.domainID,
            'result': data.vitri,
            'message': "Kết quả trận đấu: " + data.Player_expired + " thua!"
        })

        // Cập nhật kết quả ván đấu vào table games
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
                    'message': userInfo.username + ' đã rời khỏi phòng!!!',
                    'time': moment().format(`h:mm a`)
                });
            }
            else if (userInfo.isPlayer === 1) {
                if (userInfo.Player === 1) {// Player 1
                    if (userInfo.GameStatus === 0 || userInfo.GameStatus === 2) { // Ván đấu chưa diễn ra hoặc đã kết thúc
                        // alert chủ phòng rời phòng
                        io.to(userInfo.room).emit("Alert-Owner-LeaveRoom", {
                            'message': 'Chủ phòng chơi đã rời đi! Vui lòng thoát ra!!!'
                        })
                    }
                    else if (userInfo.GameStatus === 1) { // Ván đấu đang diễn ra

                        // Cập nhật kết quả lên giao diện client
                        io.to(userInfo.room).emit("Update-Game-Result", {
                            'userRequest': userInfo.username,
                            'room': userInfo.room,
                            'domainID': userInfo.domainID,
                            'result': userInfo.Player,
                            'message': "Kết quả trận đấu: " + userInfo.username + " thua!"
                        })

                        // alert chủ phòng rời phòng
                        io.to(userInfo.room).emit("Alert-Owner-LeaveRoom", {
                            'message': 'Chủ phòng chơi đã rời đi! Vui lòng thoát ra!!!'
                        })
                    }

                    // Send message to all client chatbox
                    io.to(userInfo.room).emit(`Server-send-data`, {
                        'username': userInfo.username,
                        'room': userInfo.room,
                        'message': 'Chủ phòng chơi ' + userInfo.username + ' đã rời khỏi phòng! Người chơi khác vui lòng thoát ra!!!',
                        'time': moment().format(`h:mm a`)
                    });
                }
                else if (userInfo.Player === 2) { // Player 2
                    if (userInfo.GameStatus === 0 || userInfo.GameStatus === 2) { // Ván đấu chưa diễn ra hoặc đã kết thúc
                        // alert người chơi rời phòng
                        io.to(userInfo.room).emit("Alert-Player-LeaveRoom", {
                            'message': 'Người chơi ' + userInfo.username + ' đã rời khỏi phòng!!!'
                        })
                    }
                    else if (userInfo.GameStatus === 1) { // Ván đấu đang diễn ra

                        // Cập nhật kết quả lên giao diện client
                        io.to(userInfo.room).emit("Update-Game-Result", {
                            'userRequest': userInfo.username,
                            'room': userInfo.room,
                            'domainID': userInfo.domainID,
                            'result': userInfo.Player,
                            'message': "Kết quả trận đấu: " + userInfo.username + " thua!"
                        })

                        // alert người chơi rời phòng
                        io.to(userInfo.room).emit("Alert-Player-LeaveRoom", {
                            'message': 'Người chơi ' + userInfo.username + ' đã rời khỏi phòng!!!'
                        })
                    }

                    // Send message to all client chatbox
                    io.to(userInfo.room).emit(`Server-send-data`, {
                        'username': userInfo.username,
                        'room': userInfo.room,
                        'message': 'Người chơi ' + userInfo.username + ' đã rời khỏi phòng!!!',
                        'time': moment().format(`h:mm a`)
                    });
                }
            }
        }

    });
});

