// File chứa các hàm xử lý ra vào, tìm phần tử trong mảng users

let users = []

// Add user mới login vào mảng users
let UserJoinGame = (id, username, room) => {
    let user = { id, username, room, status: 0 };
    users.push(user);

    // If index of user in (0,1) => update status = 1 (player) else 0 (viewer)
    let index = users.findIndex((user) => {
        return user.id === id;
    })
    // console.log(`Check index of new user in array:`, index);
    if (index === 0) {
        users[index].status = 1; // Player 1
    }
    else if (index === 1) {
        users[index].status = 2; // Player 2
    }
    console.log(`>> Array users after update: `, users);

    return user;
}

// Loại bỏ user đã disconnect ra khỏi mảng
let UserLeaveGame = (id) => {
    let index = users.findIndex((user) => {
        return user.id === id
    });
    console.log(`Check index user leave:`, index);
    if (index > -1) {
        return users.splice(index, 1); // 2nd parameter means remove one item only
    }
}


let findUsername = (id, username, room) => {
    return users.find((user) => {
        user.room === room && user.username === username;
    })
}

// Trả ra mảng 2 user là người chơi
let findPlayers = () => {
    if (!users[1]) {
        return [users[0].username, ""];
    }

    return [users[0].username, users[1].username];

}

// Tìm user trong mảng dựa vào socket.id
let findPlayer = (id) => {
    return users.find(user => user.id === id);
}

let findPlayerId = (username) => {
    let usr = users.find(user => user.username === username);
    if (usr) {
        return usr.id;
    }
    else {
        return null;
    }
}

// Trả ra index của user trong mảng
let findPlayerIndex = (player) => {
    return users.indexOf(player);
}


module.exports = {
    UserJoinGame,
    UserLeaveGame,
    findPlayer,
    findUsername,
    findPlayers,
    findPlayerIndex,
    users,
    findPlayerId
}