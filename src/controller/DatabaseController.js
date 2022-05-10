import res from 'express/lib/response';
import { Socket } from 'socket.io';
import pool from '../configs/connectDB'

let listUsersInDomain = async (domainID) => {
    let str_query =
        `select a.Username 
         from users a,
              domains b
         where a.DomainID = b.ID
           and b.ID = ` + domainID + `;`;
    const [rows] = await pool.execute(str_query);
    // console.log(`Check danh sach user trong domain:`, [rows]);
    return [rows];
}

let listRoomsInDomain = async (domainID) => {
    let str_query =
        `select a.ID, a.Name, a.Status 
         from rooms a,
              domains b
         where a.DomainID = b.ID
           and b.ID = ` + domainID + `
           and a.Status != 0;`;

    const [rows] = await pool.execute(str_query);
    // console.log(`Check danh sach room trong domain:`, rows);
    return rows;
}

let getDomainID = async (domainName) => {
    let str_query = `select ID from domains where Name = '` + domainName + `'`;
    const [rows] = await pool.execute(str_query);

    if ([rows].length > 0) {
        return rows[0].ID;
    }
    else {
        return null;
    }
}

let insertUser = async (username, domainID) => {

    // Check user đã tồn tại chưa
    let str_query = `select count(*) as cnt from users where DomainID = ` + domainID + ` and Username = '` + username + `';`;
    let [count] = await pool.execute(str_query);

    if (count[0].cnt > 0) {
        console.log('User ', username, ' exists!!!');
        return false;
    }
    else {
        let str_insert = `insert into users (Username, DomainID) values ('` + username + `', ` + domainID + `);`
        await pool.execute(str_insert);

        return true;
    }
}

let DeleteUser = async (username, domainID) => {
    let str_del = `delete from users where DomainID = ` + domainID + ` and Username = '` + username + `';`
    await pool.execute(str_del);

    return 1;
}

let CreateRoom = async (username, domainID, room, str_arrBoard) => {
    let str_query = `select count(*) as cnt from rooms where DomainID = ` + domainID + ` and Name = '` + room + `';`;
    let [count] = await pool.execute(str_query);

    if (count[0].cnt > 0) {
        return false;
    }
    else {
        // Tạo room và tạo game mới
        let str_insert = `insert into rooms (Name, DomainID, CreatedUser, Status) 
                          values ('` + room + `', ` + domainID + `, '` + username + `', 1);`;
        await pool.execute(str_insert);

        // Tạo game mới trong room
        str_insert = `  insert into games (Room, DomainID, Player1, GameStatus, arrBoard)
                        values ('` + room + `', ` + domainID + `, '` + username + `', 0, '` + str_arrBoard + `');`;
        await pool.execute(str_insert);

        // Cập nhật thông tin của user
        let str_update = `update users set Room = '` + room + `', Player = 1
                          where Username = '` + username + `';`;
        await pool.execute(str_update);

        return true;
    }
}

let playerJoinRoom = async (username, domainID, room) => {
    let str_check = `select Player1, Player2, count(case when Player2 is null then room end) as cnt 
                     from games 
                     where DomainID = ` + domainID + ` 
                       and room = '` + room + `'
                     group by Player1, Player2;`;
    let [count] = await pool.execute(str_check);

    if (count[0].cnt > 0) { // còn trống vị trí player2
        let str_update = `update games set Player2 = '` + username + `'
                          where DomainID = ` + domainID + ` 
                          and room = '` + room + `' and Player2 is null;`;
        await pool.execute(str_update);

        str_update = `  update users set Room = '` + room + `', Player = 1
                        where Username = '` + username + `'; `;
        await pool.execute(str_update);
        return {
            'Player1': count[0].Player1,
            'Player2': username,
            'countPlayer': 2,
            'isPlayer': 1
        };
    }
    else { // phòng đã full, vào làm viewer
        let str_update = `update users set Room = '` + room + `', Player = 0
                          where Username = '` + username + `'; `;
        await pool.execute(str_update);
        return {
            'Player1': count[0].Player1,
            'Player2': count[0].Player2,
            'countPlayer': 2,
            isPlayer: 0
        };
    }
}

let updateSocketID = async (username, socketID) => {
    let str_update = `update users set SocketID = '` + socketID + `'
                      where Username = '` + username + `';`;
    await pool.execute(str_update);
}

let updatePlayerStatus = async (room, domainID, player) => {

    // Update status
    if (player === 1) {
        let str_update = `update games set Player1_Status = 1
                          where Room = '` + room + `' and DomainID = ` + domainID + `;`;
        await pool.execute(str_update);
    }
    else {
        let str_update = `update games set Player2_Status = 1
                          where Room = '` + room + `' and DomainID = ` + domainID + `;`;
        await pool.execute(str_update);
    }

    // Check count player ready
    let str_query = `select count(*) as cnt from games
                     where Room = '` + room + `' and DomainID = ` + domainID + `
                     and Player1_Status = 1 and Player2_Status = 1;`;
    let [count] = await pool.execute(str_query);
    return count[0].cnt;
}

let updateGameStatus = async (room, domainID, status, result) => {
    let str_update = '';
    if (status == 1) { // Bắt đầu ván đấu
        str_update = `update games set GameStatus = ` + status + `, Result = ` + result + `, NextTurn = Player1
                      where Room = '` + room + `' and DomainID = ` + domainID + `;`;
    }
    else {
        str_update = `update games set GameStatus = ` + status + `, Result = ` + result + `
                      where Room = '` + room + `' and DomainID = ` + domainID + `;`;
    }

    await pool.execute(str_update);
}

let getOpponentInfo = async (username, room, domainID) => {
    let str_query = `select Username, SocketID
                     from users
                     where Room = '` + room + `' and DomainID = ` + domainID + `
                       and Player = 1 and Username != '` + username + `'; `;
    let [result] = await pool.execute(str_query);
    // console.log('Check info opponent: ', result[0]);
    return result[0];
}

let updateRenewGame = async (room, domainID, str_arrBoard) => {
    let str_update = `update games set GameStatus = 0, Result = null, Player1_Status = null, Player2_Status = null, 
                                       NextTurn = null, arrBoard = '` + str_arrBoard + `'
                      where Room = '` + room + `' and DomainID = ` + domainID + `; `;
    await pool.execute(str_update);
}

let updateUserLeaveRoom = async (username, room, domainID, isPlayer, Player) => {

    // update table users
    let str_update = `update users set Room = null, Player = null, SocketID = null
                        where Username = '` + username + `' and Room = '` + room + `' and domainID = ` + domainID + `; `;
    await pool.execute(str_update);

    // update table rooms if player is room owner set room Status = inactive
    if (isPlayer == 1 && Player === 1) {
        str_update = `update rooms set Status = 0
                      where Name = '` + room + `' and domainID = ` + domainID + `; `;
        await pool.execute(str_update);
    }

    // update table games
    if (isPlayer == 1 && Player === 1) { // if Player 1 --> games is unavailable
        str_update = `update games set Player1 = null, GameStatus = 0, Result = null, NextTurn = null,
                                       Player2_Status = null, Player1_Status = null
                      where Room = '` + room + `' and domainID = ` + domainID + `; `;
        await pool.execute(str_update);
    }
    else if (isPlayer == 1 && Player === 2) { // if Player 2 --> reset game in tbl games
        str_update = `update games set Player2 = null, GameStatus = 0, Result = null, NextTurn = null,
                                       Player2_Status = null, Player1_Status = null
                      where Room = '` + room + `' and domainID = ` + domainID + `; `;
        await pool.execute(str_update);
    }
}

let checkGameStatus = async (room, domainID) => {
    let str_query = `select GameStatus, NextTurn, arrBoard
                     from games
                     where Room = '` + room + `' and domainID = ` + domainID + `; `;
    let [result] = await pool.execute(str_query);

    if (result) {
        return result[0];
    }
    else {
        return null;
    }
}

let getUserInfoBySocket = async (SocketID) => {

    let str_query = `select a.username, a.socketID, a.Player as isPlayer,a.room, a.domainID, b.GameStatus,
                            (case when a.Player = 0 then 0
                                  when a.Player = 1 and a.username = b.Player1 then 1
                                  when a.Player = 1 and a.username = b.Player2 then 2 end) Player
                    from users a,
                         games b
                    where a.domainID = b.domainID and a.room = b.room
                      and a.SocketID = '` + SocketID + `';`
    let [result] = await pool.execute(str_query);
    console.log('Check info of getUserInfoBySocket:', result);

    if (result[0]) {
        return result[0];
    }
    else return null;
}

let updateNextTurn = async (room, domainID, NextTurn, arrBoard) => {
    let str_update = `update games set NextTurn = '` + NextTurn + `', arrBoard = '` + arrBoard + `'
                      where Room = '` + room + `' and DomainID = ` + domainID + ` and GameStatus = 1;`

    await pool.execute(str_update);
}

module.exports = {
    listUsersInDomain,
    insertUser,
    getDomainID,
    listRoomsInDomain,
    DeleteUser,
    CreateRoom,
    playerJoinRoom,
    updateSocketID,
    updatePlayerStatus,
    updateGameStatus,
    getOpponentInfo,
    // updateGameResult,
    updateRenewGame,
    updateUserLeaveRoom,
    checkGameStatus,
    getUserInfoBySocket,
    updateNextTurn
}
