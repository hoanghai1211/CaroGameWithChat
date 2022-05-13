// import { max } from "lodash";

// import { Socket } from "socket.io";

let chatForm = document.getElementById("chat-form");
let roomName = document.getElementById("room-name");
let chatbox = document.querySelector(".chat-messages");
let leftSide = document.querySelector(".leftcolumn .card");

let player1 = document.getElementById("player1");
let lb_player1_timer = document.getElementById("lb-player1-timer");
let player1_timer = document.getElementById("player1-timer");
let Player1_Countdown;

let player2 = document.getElementById("player2");
let lb_player2_timer = document.getElementById("lb-player2-timer");
let player2_timer = document.getElementById("player2-timer");
let Player2_Countdown;

let ReadyBtn = document.getElementById("Ready");
let DrawBtn = document.getElementById("Draw");
let ResignBtn = document.getElementById("Resign");
let NewGameBtn = document.getElementById("NewGame");
let turn = document.getElementById("turn");
let result = document.getElementById("resultGame");

let soc = io("https://caro-game-with-chat.herokuapp.com/");
// let soc = io("http://localhost:8686");

//-------------------------------------------------------
var boxsize = 35 // kich thuoc cua moi o vuong
var n = 15 // so luong o vuong tren 1 hang
var svg = "";
var max_time = 120;
var isWaitingSrvRes = false;

// Init var from input data
console.log('Check input data:', data);

let username = data.username;
let room = data.room;
let domain = data.domain;
let domainID = data.domainID;
let isPlayer = data.isPlayer;
let countPlayer = data.countPlayer;
let Player1 = data.Player1;
let Player2 = data.Player2;

// Update room name to Chat header
roomName.innerHTML = "Room: " + room;

// Client join room
soc.emit(`Client-join-room`, {
    'username': username,
    'room': room,
    'domain': domain,
    'domainID': domainID,
    'isPlayer': isPlayer,
    'countPlayer': countPlayer,
    'Player1': Player1,
    'Player2': Player2
});


// Add event to Send button in Chat Form
chatForm.addEventListener("submit", (event) => {
    // The preventDefault() method cancels the event if it is cancelable
    event.preventDefault();

    // get message text
    let message = event.target.elements.msg.value.trim();

    if (!message) {
        return false;
    }

    // send message to socket server with event SendMessage
    soc.emit("SendMessagetoServer", { username, room, message });

    // Clear text box
    event.target.elements.msg.value = "";
})

// Lắng nghe event Server-send-data từ Server và cập nhật lên chat box
soc.on(`Server-send-data`, (data) => {
    console.log(`Server send data: `, data);
    outputMessage({
        'username': data.username,
        'message': data.message,
        'time': data.time
    });
    chatbox.scrollTop = chatbox.scrollHeight;
})

// Cập nhật info người chơi lên giao diện
// Nếu phòng chơi đã đủ 2 người chơi & là người chơi => hiển thị nút Ready
soc.on(`Update-Info-Player`, (data) => {
    console.log(`Check data update info player: `, data);
    player1.innerHTML = data.Player1;
    player2.innerHTML = data.Player2;

    turn.innerHTML = "";
    result.innerHTML = "";

    if (data.countPlayer === '2'
        && (username === data.Player1 || username === data.Player2)
    ) {
        Player1 = data.Player1;
        Player2 = data.Player2;

        ReadyBtn.style.display = "inline-block";
        ReadyBtn.disabled = false;
    }
})

// Vẽ bàn cờ sau khi join room
soc.on('Draw-Game-Board', (data) => {
    console.log('Check matrix board game to draw in client:', data);

    if (data.GameStatus === 0) {
        result.innerHTML = "";
    }

    // Trong trường hợp chơi lại ván mới, xoá bàn cờ cũ để tạo lại bàn cờ mới.
    if (document.querySelector("#content")) {
        document.querySelector("#content").remove();
    }

    let div = d3.select(".leftcolumn .card").append("div")
        .attr("id", "content")
        .style("text-align", "center")

    // create <svg>
    svg = div.append("svg")
        .attr("width", 600)
        .attr("height", 600);


    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {

            if (data.arrBoard[j][i] === 0) { // Ô cờ chưa đánh
                if (isPlayer == 1) {
                    // draw each chess field
                    let box = svg.append("rect")
                        .attr("x", i * boxsize)
                        .attr("y", j * boxsize)
                        .attr("width", boxsize)
                        .attr("height", boxsize)
                        .attr("id", "b" + i + j)
                        .attr("fill", "#f4f3f7")
                        .style("stroke", "black")
                        .on("click", function () {
                            if (!isWaitingSrvRes) {
                                isWaitingSrvRes = true;
                                console.log('Check biến isWaitingSrvRes:', isWaitingSrvRes);

                                let selected = d3.select(this);
                                soc.emit("su-kien-click", {
                                    'username': username,
                                    'room': room,
                                    'domainID': domainID,
                                    'Player1': Player1,
                                    'Player2': Player2,
                                    'isPlayer': isPlayer,
                                    'x': selected.attr('x'),
                                    'y': selected.attr('y')
                                })
                            }
                        });
                }
                else {
                    // draw each chess field
                    let box = svg.append("rect")
                        .attr("x", i * boxsize)
                        .attr("y", j * boxsize)
                        .attr("width", boxsize)
                        .attr("height", boxsize)
                        .attr("id", "b" + i + j)
                        .attr("fill", "#f4f3f7")
                        .style("stroke", "black");
                }
            }
            else if (data.arrBoard[j][i] === 1) {
                // draw each chess field
                let box = svg.append("rect")
                    .attr("x", i * boxsize)
                    .attr("y", j * boxsize)
                    .attr("width", boxsize)
                    .attr("height", boxsize)
                    .attr("id", "b" + i + j)
                    .attr("fill", "#f4f3f7")
                    .style("stroke", "black");

                svg
                    .append("text")
                    .attr("x", i * boxsize)
                    .attr("y", j * boxsize)
                    .attr("width", boxsize)
                    .attr("height", boxsize)
                    .attr("id", "b" + i + j)
                    .attr("text-anchor", "middle")
                    .attr("dx", boxsize / 2)
                    .attr("dy", boxsize / 2 + 8)
                    .text("X")
                    .style("stroke", "black")
                    .style("font-weight", "bold")
                    .style("font-size", "30px")
                    .style("fill", "#000066")
            }
            else if (data.arrBoard[j][i] === 2) {
                let box = svg.append("rect")
                    .attr("x", i * boxsize)
                    .attr("y", j * boxsize)
                    .attr("width", boxsize)
                    .attr("height", boxsize)
                    .attr("id", "b" + i + j)
                    .attr("fill", "#f4f3f7")
                    .style("stroke", "black");
                svg
                    .append("text")
                    .attr("x", i * boxsize)
                    .attr("y", j * boxsize)
                    .attr("width", boxsize)
                    .attr("height", boxsize)
                    .attr("id", "b" + i + j)
                    .attr("text-anchor", "middle")
                    .attr("dx", boxsize / 2)
                    .attr("dy", boxsize / 2 + 8)
                    .text("O")
                    .style("stroke", "black")
                    .style("font-weight", "bold")
                    .style("font-size", "30px")
                    .style("fill", "#FF0000")
            }
        }
    }
})

// Start game
soc.on(`Start-game`, (data) => {
    isWaitingSrvRes = false;
    let message = "Ván đấu bắt đầu, đến lượt đi của người chơi: " + Player1;
    turn.innerHTML = message;
    turn.style.color = "orange";

    if (isPlayer == 1) {
        lb_player1_timer.style.display = "inline-block";
        lb_player2_timer.style.display = "inline-block";

        // bật biến đếm cho player 1
        Player1_Countdown = setInterval(() => {
            // let i = setInterval(0, 1000);
            let countdown = 0;
            if (player1_timer.innerHTML != '') { // Nếu đã có giá trị thì lấy ra --> convert int --> trừ tiếp
                countdown = parseInt(player1_timer.innerHTML);
            } else { // Nếu chưa từng count down thì set = max_time = 3 phút
                countdown = max_time;
            }

            --countdown;
            player1_timer.innerHTML = countdown;

            if (countdown < 0) {
                clearInterval(Player1_Countdown);
                player1_timer.innerHTML = "EXPIRED";
                player1_timer.style.color = "red";

                // Player1 thua vì hết thời gian, Player2 gửi sự kiện expired-timer lên server
                if (username === Player2) {
                    soc.emit("expired-timer", {
                        'userRequest': username,
                        'vitri': 2,
                        'room': room,
                        'domainID': domainID,
                        'Player_expired': Player1
                    });
                }
            }
        }, 1000);
    }

    // Active button Draw, Resign. New Game chỉ active khi ván đấu kết thúc.
    if (username === Player1 || username === Player2) {
        DrawBtn.style.display = "inline-block";
        ResignBtn.style.display = "inline-block";

        DrawBtn.disabled = false;
        ResignBtn.disabled = false;
    }
})



// Lượt đi kế tiếp
soc.on("Next-turn", (data) => {
    isWaitingSrvRes = false;
    turn.innerHTML = data.message;

    if (isPlayer == 1) {
        if (data.vitri === 1) { // Người chơi 1 đã đánh, nc sau của ng chơi 2
            turn.style.color = "blue";

            // Dừng biến đếm của Player1
            clearInterval(Player1_Countdown);

            // Bật biến đếm của Player2

            Player2_Countdown = setInterval(() => {
                let countdown = 0;
                if (player2_timer.innerHTML != '') { // Nếu đã có giá trị thì lấy ra --> convert int --> trừ tiếp
                    countdown = parseInt(player2_timer.innerHTML);
                } else { // Nếu chưa từng count down thì set = max_time = 3 phút
                    countdown = max_time;
                }

                --countdown;
                player2_timer.innerHTML = countdown;

                if (countdown < 0) {
                    clearInterval(Player2_Countdown);
                    player2_timer.innerHTML = "EXPIRED";
                    player2_timer.style.color = "red";

                    // Player2 thua vì hết thời gian, Player1 gửi sự kiện expired-timer lên server
                    if (username === Player1) {
                        soc.emit("expired-timer", {
                            'userRequest': username,
                            'vitri': 1,
                            'room': room,
                            'domainID': domainID,
                            'Player_expired': Player2
                        });
                    }
                }
            }, 1000);
        }
        else { // Người chơi 2 đã đánh, nc sau của ng chơi 1
            turn.style.color = "orange";

            // Dừng biến đếm của Player2
            clearInterval(Player2_Countdown);

            // Bật biến đếm của Player1
            Player1_Countdown = setInterval(() => {
                let countdown = 0;
                if (player1_timer.innerHTML != '') { // Nếu đã có giá trị thì lấy ra --> convert int --> trừ tiếp
                    countdown = parseInt(player1_timer.innerHTML);
                } else { // Nếu chưa từng count down thì set = max_time = 3 phút
                    countdown = max_time;
                }

                --countdown;
                player1_timer.innerHTML = countdown;

                if (countdown < 0) {
                    clearInterval(Player1_Countdown);
                    player1_timer.innerHTML = "EXPIRED";
                    player1_timer.style.color = "red";

                    // Player1 thua vì hết thời gian, Player2 gửi sự kiện expired-timer lên server
                    if (username === Player2) {
                        soc.emit("expired-timer", {
                            'userRequest': username,
                            'vitri': 2,
                            'room': room,
                            'domainID': domainID,
                            'Player_expired': Player1
                        });
                    }
                }
            }, 1000);
        }
    }

})

// -------------------------------------
// ACTION
let ReadyToPlay = () => {

    // disable button
    ReadyBtn.disabled = true;

    // send message to socket server with event SendMessage
    if (username === Player1) {
        soc.emit("Ready-To-Player", {
            'username': username,
            'room': room,
            'domain': domain,
            'domainID': domainID,
            'Player': 1
        });
    }
    else {
        soc.emit("Ready-To-Player", {
            'username': username,
            'room': room,
            'domain': domain,
            'domainID': domainID,
            'Player': 2
        });
    }
}

let RequestDraw = () => {
    DrawBtn.disabled = true;
    ResignBtn.disabled = true;
    NewGameBtn.disabled = true;

    // Hiển thị popup xác nhận muốn cầu hoà
    let pop = confirm("Bạn muốn xin hoà ván đấu này?");

    if (pop) {
        console.log(username + " request to draw!");

        soc.emit("Request-Draw", {
            'userRequest': username,
            'room': room,
            'domainID': domainID,
            'message': 'Player ' + username + ' request to draw!'
        });
    }
}

let Resign = () => {
    DrawBtn.disabled = true;
    ResignBtn.disabled = true;

    // Hiển thị popup xác nhận muốn nhận thua
    let pop = confirm("Bạn muốn nhận thua ván đấu này?");

    if (pop) {
        console.log(username + " resign!");
        let i = 0;

        if (username === Player1) {
            i = 2; // Player 1 resign thì Player 2 thắng
        }
        else if (username === Player2) {
            i = 1; // Player 2 resign thì Player 1 thắng
        }

        soc.emit("Resign", {
            'userResign': username,
            'room': room,
            'domainID': domainID,
            'Player': i, // giá trị người thắng
            'message': 'Player ' + username + ' resign!'
        });
    }
}

let RequestNewGame = () => {
    DrawBtn.disabled = true;
    ResignBtn.disabled = true;
    NewGameBtn.disabled = true;

    // Hiển thị popup xác nhận muốn tạo ván mới
    let pop = confirm("Bạn muốn chơi lại ván mới?");

    if (pop) {
        soc.emit("Request-New-Game", {
            'userRequest': username,
            'room': room,
            'domainID': domainID,
            'result': result.innerHTML,
            'message': 'Player ' + username + ' request new game!'
        });
    }
    else {
        NewGameBtn.disabled = false;
    }
}

// -------------------------------------

// Phản hồi về yêu cầu cầu hoà của người chơi đối thủ
soc.on("Response-Draw", (data) => {
    DrawBtn.disabled = true;
    ResignBtn.disabled = true;
    NewGameBtn.disabled = true;

    console.log("Check data of request draw received: ", data);

    let pop = confirm("Đối thủ xin hoà ván đấu này, bạn có chấp nhận hoà không?");

    if (pop) {
        soc.emit("Confirm-Draw", {
            'userRequest': data.userRequest,
            'room': room,
            'domainID': domainID,
            'message': 'Chấp nhận hoà'
        });
    }
    else { // Từ chối hoà
        DrawBtn.disabled = false;
        ResignBtn.disabled = false;
        NewGameBtn.disabled = false;

        soc.emit("Reject-Draw", {
            'userReject': username,
            'room': room,
            'domainID': domainID,
            'message': 'Không chấp nhận hoà'
        });
    }
})

// Từ chối yêu cầu hoà
soc.on("Confirm-Reject-Draw", (data) => {
    console.log(data);
    DrawBtn.disabled = false;
    ResignBtn.disabled = false;
    NewGameBtn.disabled = false;

    alert(data.message);
})

// Phản hồi về yêu cầu tạo ván mới của người chơi đối thủ
soc.on("Response-New-Game", (data) => {
    DrawBtn.disabled = true;
    ResignBtn.disabled = true;
    NewGameBtn.disabled = true;

    console.log(username + " receive request to create new game! Check data receive: ", data);

    let pop = confirm("Đối thủ muốn chơi lại ván mới, bạn có chấp nhận không?");

    if (pop) {
        soc.emit("Confirm-New-Game", {
            'userConfirm': username,
            'room': room,
            'domainID': domainID,
            'Player1': Player1,
            'Player2': Player2,
            'message': 'Đồng ý tạo ván mới!'
        });

        ReadyBtn.disabled = false;
        DrawBtn.disabled = false;
        ResignBtn.disabled = false;
        NewGameBtn.disabled = false;

        DrawBtn.style.display = "none";
        ResignBtn.style.display = "none";
        NewGameBtn.style.display = "none";
    }
    else {
        // Từ chối tạo ván mới
        if (data.result === "") { // ván cũ chưa kết thúc
            DrawBtn.disabled = false;
            ResignBtn.disabled = false;
            NewGameBtn.disabled = false;
        }
        else {
            NewGameBtn.disabled = false;
        }

        soc.emit("Reject-New-Game", {
            'userReject': username,
            'room': room,
            'domainID': domainID,
            'result': data.result,
            'message': 'Không chấp nhận tạo ván mới'
        });
    }
})

soc.on("Respose-Confirm-NewGame", (data) => {
    console.log(data);

    if (isPlayer == 1) {
        lb_player1_timer.style.display = "none";
        lb_player2_timer.style.display = "none";
        player1_timer.innerHTML = "";
        player2_timer.innerHTML = "";
    }


    // Gửi đến toàn bộ client trong room, nhưng chỉ có Player request ván mới mới thực thi các tác vụ dưới
    if (isPlayer == 1 && username != data.userConfirm) {
        ReadyBtn.disabled = false;
        DrawBtn.disabled = false;
        ResignBtn.disabled = false;
        NewGameBtn.disabled = false;

        DrawBtn.style.display = "none";
        ResignBtn.style.display = "none";
        NewGameBtn.style.display = "none";

        alert(data.message);
    }

})

soc.on("Confirm-Reject-NewGame", (data) => {
    console.log(data);

    // Nhận thông báo từ chối tạo ván mới
    if (data.result === "") { // ván cũ chưa kết thúc
        DrawBtn.disabled = false;
        ResignBtn.disabled = false;
        NewGameBtn.disabled = false;
    }
    else {
        NewGameBtn.disabled = false;
    }

    alert(data.message);
})

// Cập nhật kết quả trận đấu lên giao diện
soc.on(`Update-Game-Result`, (data) => {
    DrawBtn.disabled = true;
    ResignBtn.disabled = true;

    console.log('Update result game: ', data);

    // Dừng biến đếm của 2 người chơi.
    clearInterval(Player1_Countdown);
    clearInterval(Player2_Countdown);

    // Cập nhật kết quả lên giao diện client
    turn.innerHTML = "";
    result.innerHTML = data.message;
    result.style.color = "green";

    // active nút new game
    if (isPlayer == 1) {
        NewGameBtn.style.display = "inline-block";
        NewGameBtn.disabled = false;
    }

})

// Event chủ phòng rời phòng
soc.on("Alert-Owner-LeaveRoom", (data) => {
    ReadyBtn.style.display = "none";
    DrawBtn.style.display = "none";
    ResignBtn.style.display = "none";
    NewGameBtn.style.display = "none";

    alert(data.message);
})

// Event player rời phòng
soc.on("Alert-Player-LeaveRoom", (data) => {
    if (isPlayer === '1') {
        DrawBtn.style.display = "none";
        ResignBtn.style.display = "none";
        NewGameBtn.style.display = "none";
        alert(data.message);
    }
})

// Create div with text chat & append to class chat-messages
let outputMessage = ({ username, message, time }) => {
    let div = document.createElement("div");
    div.classList.add("message");

    let p = document.createElement("p");
    p.classList.add("meta");
    p.innerHTML = username + " - " + time;
    div.appendChild(p); // tạo thẻ p trong thẻ div

    let text = document.createElement("p");
    text.classList.add("text");
    text.innerHTML = message;
    div.appendChild(text);

    chatbox.appendChild(div);

    console.log(`>> Hien thi class chat-messages: `, document.querySelector(".chat-messages"));
}

// Lắng nghe sự kiện send-play-turn và hiển thị X O lên bàn cờ

soc.on("send-play-turn", function (data) {
    console.log('Check data send to client for draw:', data);

    // Hiển thị lên bàn cờ
    let tick = svg
        .append("text")
        .attr("x", parseInt(data.x))
        .attr("y", parseInt(data.y))
        .attr("text-anchor", "middle")
        .attr("dx", boxsize / 2)
        .attr("dy", boxsize / 2 + 8)
        .text(function () {
            if (data.nguoichoi === 1) {
                return "X"
            }
            else if (data.nguoichoi === 2) {
                return "O"
            }
        })
        .style("font-weight", "bold")
        .style("font-size", "30px")
        .style("fill", function () {
            if (data.nguoichoi === 1) {
                return "#000066"
            }
            else if (data.nguoichoi === 2) {
                return "#FF0000"
            }
        })
})

//----------In len man hinh nguoi choi bi thua va nguoi thang cuoc--------
soc.on("alert-result", function (data) {

    $(document).ready(() => {
        alert(data);
    })
})

//khi 1 trong 2 nguoi choi bi thua thi se khong cho click them vao ban co
soc.on("prevent-click-onboard", function () {
    $('#content').css('pointer-events', 'none');
})

soc.on("Reject-Login", (data) => {
    window.location = 'https://caro-game-with-chat.herokuapp.com/';
    // window.location = 'http://localhost:8686/';

    $(document).ready(() => {
        alert(data);
    })
})

//Prompt the user before leave chat room

let LeaveRoom = () => {
    let pop = confirm('Bạn muốn rời khỏi phòng chơi');

    if (pop) {
        let i = 0;

        if (isPlayer === '1' && username === Player1) {
            i = 1; // Chủ phòng
        }
        else if (isPlayer === '1' && username === Player2) {
            i = 2;
        }

        soc.emit("Leave-Room", {
            'username': username,
            'room': room,
            'domainID': domainID,
            'isPlayer': isPlayer,
            'Player': i
        })

        window.location.href = '/domain';
    }
}

