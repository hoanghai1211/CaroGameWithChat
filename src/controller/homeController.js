

let getRegisterPage = (req, res) => {
    return res.render('index.ejs');
}

let getMainPage = (req, res) => {
    console.log(`>> Check req: `, req.params);
    return res.render(`main.ejs`);
}

module.exports = {
    getRegisterPage,
    getMainPage
}
