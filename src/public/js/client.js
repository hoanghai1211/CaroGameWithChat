let chatForm = document.getElementById("chat-form");
let roomName = document.getElementById("room-name");
let chatbox = document.querySelector(".chat-messages");
let leftSide = document.querySelector(".leftcolumn");

let soc = io("http://localhost:8686");

let url = new URL(location.href);
console.log(`>> Check url:`, url);

let username = url.searchParams.get("username");
let room = url.searchParams.get("room");

createCaroBoard();

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

soc.on(`Server-send-data`, ({ username, room, message, time }) => {
    console.log(`Server send data: `, { username, room, message, time });
    outputMessage({ username, message, time });
    chatbox.scrollTop = chatbox.scrollHeight;
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

let createCaroBoard = () => {
    const div = d3.select("body").append("div").attr("id", "content").style("text-align", "center");
    // create <svg>
    const svg = div.append("svg").attr("width", 500).attr("height", 600);
    //-------------------------------------------------------
    let boxsize = 50 // kich thuoc cua moi o vuong
    let n = 10 // so luong o vuong tren 1 hang
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            // draw each chess field
            const box = svg.append("rect")
                .attr("x", i * boxsize)
                .attr("y", j * boxsize)
                .attr("width", boxsize)
                .attr("height", boxsize)
                .attr("id", "b" + i + j)
                .style("stroke", "black")
                .on("click", function () {
                    let selected = d3.select(this);
                    socket.emit("su-kien-click", { x: selected.attr('x'), y: selected.attr('y') })

                });
            if ((i + j) % 2 === 0) {
                box.attr("fill", "beige");
            } else {
                box.attr("fill", "beige");
            }
        }
    }
    console.log(`Check div caro board: `, div);
}