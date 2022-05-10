const res = require("express/lib/response");
import DatabaseController from '../controller/DatabaseController';
import game from './gameController';


let getRegisterPage = (req, res) => {
    let session = req.session;
    if (session.username) {
        res.redirect("/domain")
    } else {
        return res.render('index.ejs');
    }
}

let Login = async (req, res) => {
    // get domain ID 
    let domainID = await DatabaseController.getDomainID(req.body.domain);

    // Insert user
    let bool = await DatabaseController.insertUser(req.body.username, domainID);

    if (!bool) {
        // User đã tồn tại, không cho login
        return res.send('User exists!!!');
    } else {
        let session = req.session;
        session.username = req.body.username;
        session.domain = req.body.domain;
        session.domainID = domainID;
        console.log('Check session of user ', session.username, ' after Login: ', session);
        return res.redirect("/domain");
    }
}

let getDomainPage = async (req, res) => {
    let session = req.session;

    if (!session.domain || !session.username || !session.domainID) {
        console.log('Direct access link --> redirect to login');
        return res.redirect('/');
    }

    let { domain, username, domainID } = session;

    console.log('Check session of user ', session.username, ' after get Domain page: ', session);

    // List user in Domain
    let [users] = await DatabaseController.listUsersInDomain(domainID);

    // List room in Domain
    let rooms = await DatabaseController.listRoomsInDomain(domainID);

    return res.render('domain.ejs', {
        userLogin: username,
        dataUser: users,
        domain: { id: domainID, name: domain },
        dataRoom: rooms
    });
}

let CreateNewRoom = async (req, res) => {
    let session = req.session;

    if (!session.domain || !session.username || !session.domainID) {
        console.log('Direct access link --> redirect to login');
        return res.redirect('/');
    }

    let { domain, username, domainID } = session;
    session.room = req.body.pRoom;

    console.log('Check session of user ', session.username, ' after create room: ', session);

    // init game board 15 * 15 with value init = 0
    let arrBoard = game.InitMatrix(15, 0);
    // Convert matrix to string & save to DB
    let str_arrBoard = game.ConvertMatrixToString(arrBoard);    
    // console.log('Check str arrBoard:', str_arrBoard);

    let bool = await DatabaseController.CreateRoom(username, domainID, req.body.pRoom, str_arrBoard);

    if (bool) {
        return res.render('main.ejs', {
            room: req.body.pRoom,
            domain: { id: domainID, name: domain },
            user: username,
            isPlayer: 1,
            countPlayer: 1,
            Player1: username,
            Player2: null
        });
        // return res.send('create Room success!!!');
    }
    else {
        return res.send('Room exists!!!');
    }

    // return res.render()
}

let JoinRoom = async (req, res) => {
    let session = req.session;

    if (!session.domain || !session.username || !session.domainID) {
        console.log('Direct access link --> redirect to login');
        return res.redirect('/');
    }

    let { domain, username, domainID } = session;
    session.room = req.body.pRoom;

    console.log('Check session of user ', session.username, ' after join Room: ', session);

    // Check room còn trống người chơi k
    let result = await DatabaseController.playerJoinRoom(username, domainID, session.room);

    if (result.isPlayer) {
        return res.render('main.ejs', {
            room: session.room,
            domain: { id: domainID, name: domain },
            user: username,
            isPlayer: 1,
            countPlayer: result.countPlayer,
            Player1: result.Player1,
            Player2: result.Player2
        });
    }
    else {
        return res.render('main.ejs', {
            room: session.room,
            domain: { id: domainID, name: domain },
            user: username,
            isPlayer: 0,
            countPlayer: result.countPlayer,
            Player1: result.Player1,
            Player2: result.Player2
        });
    }
}

let LeaveDomain = async (req, res) => {
    let session = req.session;

    if (!session.domain || !session.username || !session.domainID) {
        console.log('Direct access link --> redirect to login');
        return res.redirect('/');
    }

    let { domain, username, domainID } = session;

    console.log('Check session of user ', session.username, ' after Leave domain: ', session);

    let a = await DatabaseController.DeleteUser(username, domainID);

    req.session.destroy();

    return res.render('index.ejs');
}

module.exports = {
    getRegisterPage,
    getDomainPage,
    CreateNewRoom,
    LeaveDomain,
    JoinRoom,
    Login
}
