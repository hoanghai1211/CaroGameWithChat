import mysql from 'mysql2/promise';
// import pg from 'pg';

console.log("Create connection pool...");

const pool = mysql.createPool({
    host: "localhost",
    database: "CaroGame",
    user: "haiht",
    password: "123456"
})

export default pool;