const res = require("express/lib/response");


let getRegisterPage = (req, res) => {
    return res.render('index.ejs');
}

let getMainPage = (req, res) => {
    console.log(`Check login req:`, req.body);
    return res.render(`main.ejs`, { data: req.body });
}

let RedirectLogin = () => {
    console.log('Đã vào đây!');
    return res.render('index.ejs');
}

module.exports = {
    getRegisterPage,
    getMainPage,
    RedirectLogin
}
