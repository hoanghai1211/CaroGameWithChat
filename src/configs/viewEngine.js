// import express from 'express';
var express = require('express');


const configViewEngine = (app) => {
    app.use(express.static('./src/public')); // khai baso đường dẫn chứa các file public internet
    //app.use(express.static(__dirname + '/public'));
    app.set("view engine", "ejs");
    app.set("views", "./src/views");
}

export default configViewEngine;
// module.exports = configViewEngine;
