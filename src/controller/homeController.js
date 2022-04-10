import express from 'express';
// var express = require('express');

let getRegisterPage = (req, res) => {
    return res.render('index.ejs');
}

module.exports = {
    getRegisterPage
}
