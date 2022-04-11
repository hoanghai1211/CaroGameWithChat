let users = []

let UserJoinGame = (id, username, room) => {
    let user = { id, username, room };
    console.log(`>> User ${username} join room ${room}`);
    users.push(user);

    return user;
}

module.export = {
    UserJoinGame
}