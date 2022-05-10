import mysql from 'mysql2/promise';
import pg from 'pg';

console.log("Create connection pool...");

var pool;

if (process.env.isTEST) { // MT test
    pool = mysql.createPool({
        host: "localhost",
        database: "CaroGame",
        user: "haiht",
        password: "123456"
    })
}
else { // MT Production
    pool = pg.createPool({
        host: "ec2-52-4-104-184.compute-1.amazonaws.com",
        database: "ddh5r1eric9r57",
        user: "rqathlundgueow",
        password: "d88479cab085ad84a9dfa254e98c1760b7712afc8e163b637876e82b5013cc35"
    })
}

export default pool;