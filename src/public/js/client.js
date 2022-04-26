
let chatForm = document.getElementById("chat-form");
let roomName = document.getElementById("room-name");
let chatbox = document.querySelector(".chat-messages");
let leftSide = document.querySelector(".leftcolumn .card");
let player1 = document.getElementById("player1");
let player2 = document.getElementById("player2");
let resultGame = document.getElementById("resultGame");

let soc = io("https://caro-game-with-chat.herokuapp.com/");
// let soc = io("http://localhost:8686");

// xử lý url lọc lấy giá trị username và room
// let url = new URL(location.href);
// console.log(`>> Check url:`, url);

// let username = url.searchParams.get("username");
// let room = url.searchParams.get("room");
// console.log(`Check req.body:`, req.body);

console.log('Check input data:', data);

let username = data.username;
let room = data.room;
// console.log('Check req username: ', req.body.username, ', req room:', req.body.room);

// Update room name to Chat header
roomName.innerHTML = "Room: " + room;

// Send message to server with event Client-join-room
soc.emit(`Client-join-room`, { username, room, message: "join room!" });

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
soc.on(`Server-send-data`, ({ username, room, message, time, status }) => {
    console.log(`Server send data: `, { username, room, message, time, status });
    outputMessage({ username, message, time });
    chatbox.scrollTop = chatbox.scrollHeight;
})

// Cập nhật info người chơi lên giao diện
soc.on(`Update-Info-Player`, (players) => {
    player1.innerHTML = players[0];
    player2.innerHTML = players[1];
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

//-------------------------------------------------------
var boxsize = 35 // kich thuoc cua moi o vuong
var n = 15 // so luong o vuong tren 1 hang
var svg = "";

// Khởi tạo bàn cờ và tạo sự kiện on click tại mỗi ô trên bàn cờ
let createCaroBoard = () => {

    let div = d3.select(".leftcolumn .card").append("div").attr("id", "content").style("text-align", "center");
    // create <svg>
    svg = div.append("svg").attr("width", 600).attr("height", 600);


    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
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
                    let selected = d3.select(this);
                    soc.emit("su-kien-click", { x: selected.attr('x'), y: selected.attr('y') })

                });
        }
    }
}
createCaroBoard();

// Lắng nghe sự kiện send-play-turn và hiển thị X O lên bàn cờ

soc.on("send-play-turn", function (data) {
    console.log("gia tri ma client nhan tu server:")
    console.log("mang nguoi choi :" + data.ArrId)
    console.log("Id:" + data.name);
    console.log("nguoi cho thu:", data.nguoichoi)
    console.log("Ma tran cac nuoc di:", data.Board)
    console.log("Gia tri cua nguoi choi:" + data.value)
    console.log("x_client:" + data.x);
    console.log("y_client:" + data.y);
    let matrix = data.Board;
    let Cur_Row = parseInt(data.x);
    let Cur_Col = parseInt(data.y);
    let Value = parseInt(data.value);
    const tick = svg
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
            else if (data.nguoichoi === 0) {
                return "O"
            }
        })
        .style("font-weight", "bold")
        .style("font-size", "30px")
        .style("fill", function () {
            if (data.nguoichoi === 1) {
                return "#000066"
            }
            else if (data.nguoichoi === 0) {
                return "#FF0000"
            }
        })
})

//----------In len man hinh nguoi choi bi thua va nguoi thang cuoc--------
soc.on("phat-su-kien-thang-thua", function (data) {

    $(document).ready(() => {
        alert(data);
    })
})

soc.on("send-result-game", (data) => {
    resultGame.innerHTML = data;
})

//khi 1 trong 2 nguoi choi bi thua thi se khong cho click them vao ban co
soc.on("khong-cho-doi-thu-click-khi-thua", function () {
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
document.getElementById('leave-btn').addEventListener('click', () => {
    const leaveRoom = confirm('Are you sure you want to leave room?');
    console.log(`>> Check location: `, location);

    if (leaveRoom) {
        window.location = 'https://caro-game-with-chat.herokuapp.com/';
        // window.location = 'http://localhost:8686/';
    }
});

