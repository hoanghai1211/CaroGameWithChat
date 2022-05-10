import mysql from 'mysql2/promise';
require('dotenv').config();

var pool;

if (process.env.isTEST) {
    console.log("Create connection pool at test env ...");
    pool = mysql.createPool({
        host: "localhost",
        database: "CaroGame",
        user: "haiht",
        password: "123456"
    })
}
else { // Production
    console.log("Create connection pool at prod env ...");
    pool = mysql.createPool({
        host: "us-cdbr-east-05.cleardb.net",
        database: "heroku_e3ab0ef9ae93fcb",
        user: "be7c078ec85735",
        password: "694e3149"
    })
}

export default pool;