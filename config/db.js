// 1. IMPORTANTE: Load dotenv para mabasa ang .env file
require('dotenv').config(); 

const mysql = require('mysql2/promise');

const db = mysql.createPool({
    // 2. Gagamit na tayo ng process.env
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME, 
    port: process.env.DB_PORT, 
    
    ssl: {
        rejectUnauthorized: true
    },
    // --- STABILITY SETTINGS (Parehas lang sa dati) ---
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    maxIdle: 0, 
    idleTimeout: 60000, 
    connectTimeout: 60000 
});

// Test Connection
db.getConnection()
    .then(connection => {
        console.log('✅ Connected to TiDB Cloud using .env credentials!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ DB Connection Error:', err.message);
        console.error('Check your .env file details!');
    });

module.exports = db;