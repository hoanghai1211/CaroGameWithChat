import express from 'express';
import appRootPath from 'app-root-path';
// var express = require('express');


const configViewEngine = (app) => {
    const static_path = appRootPath.path + '/src/public';
    console.log('Check static path: ', static_path);

    app.use(express.static(static_path)); // khai baso đường dẫn chứa các file public internet
    // app.use(express.static(__dirname + '/public'));
    app.set("view engine", "ejs");
    app.set("views", "./src/views");
}

export default configViewEngine;
// module.exports = configViewEngine;
