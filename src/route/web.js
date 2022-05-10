import express from 'express';
import { home } from 'nodemon/lib/utils';
import homeController from '../controller/homeController';

// var express = require('express');
// var homeController = require('../controller/homeController');

let route = express.Router();

const initWebRoute = (app) => {
    // console.log(`Check req:`, app);
    route.get('/', homeController.getRegisterPage);
    route.post('/login', homeController.Login);
    route.get('/domain', homeController.getDomainPage);

    // route.post('/playGame', homeController.getMainPage);

    route.post('/CreateRoom', homeController.CreateNewRoom);
    route.post('/domain/LeaveDomain', homeController.LeaveDomain);
    route.post('/JoinRoom/:room', homeController.JoinRoom);


    return app.use('/', route);
}

// module.exports = initWebRoute;
export default initWebRoute;
