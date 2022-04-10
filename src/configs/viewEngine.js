import express from 'express';
import appRootPath from 'app-root-path';
// var express = require('express');


const configViewEngine = (app) => {
    app.use(express.static(appRootPath.path + '/src/public')); // khai baso đường dẫn chứa các file public internet
    // console.log(`Check approotpath: `, appRootPath.path);
    // app.use(express.static(__dirname + '/public'));
    app.set("view engine", "ejs");
    app.set("views", "./src/views");
}

export default configViewEngine;
// module.exports = configViewEngine;
