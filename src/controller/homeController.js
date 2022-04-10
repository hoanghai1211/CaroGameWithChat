import express from 'express';
// var express = require('express');

let getRegisterPage = (req, res) => {
    return res.render('index.ejs');
}

let getMainPage = (req, res) => {
    console.log(`>> Check req: `, req); //req.query.pUsername
    return res.send(`Màn hình chơi game`)
}

module.exports = {
    getRegisterPage,
    getMainPage
}
