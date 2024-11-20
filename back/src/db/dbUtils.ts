import mysql from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { IUserDb } from '../types/user';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}).promise();

let connection: PoolConnection;
let isDbReachable: boolean = false;

do {
    try {
        connection = await pool.getConnection();
        connection.release();
        isDbReachable = true;
    } catch (error) {
        isDbReachable = false;
        console.log("Cannot connect to database, retrying in 1 second");
        // Wait 1 sec
        await new Promise(f => setTimeout(f, 1000));
    }
} while (!isDbReachable)

console.log("Connected to database");

export default pool;



export function cleanUserDb(user: IUserDb) {
    if (!user)
        return user;
    if (user.interests === null)
        user.interests = [];
    if (user.pictures === null)
        user.pictures = []
    if (user.visits === null)
        user.visits = []
    if (user.likes === null)
        user.likes = []
    if (user.notifications === null)
        user.notifications = []
    return user;
}

export { default as sql } from 'sql-template-tag';