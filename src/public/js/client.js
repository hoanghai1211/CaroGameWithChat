let soc = io("http://localhost:8686");

let url = new URL(location.href);
console.log(`>> Check url:`, url);

let username = url.searchParams.get("username");
let room = url.searchParams.get("room");
let user = { username, room };
console.log(`>> User info:`, user);

// let roomName = document.getElementById("room-name");
// roomName.innerText = room;

soc.emit(`Client-join-room`, `User ` + username + ` join room ` + room);

soc.on(`Server-send-data`, (data) => {
    console.log(`Server send data: `, data);
})

let outputRoomName = (room) => {
    document.getElementById("room-name").innerHTML = room;
}
