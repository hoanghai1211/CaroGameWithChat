import express from 'express';
import homeController from '../controller/homeController';

// var express = require('express');
// var homeController = require('../controller/homeController');

let route = express.Router();

const initWebRoute = (app) => {
    // console.log(`Check req:`, app);
    route.get('/', homeController.getRegisterPage);

    return app.use('/', route);
}

// module.exports = initWebRoute;
export default initWebRoute;
