require('dotenv').config();

module.exports = {
    "development": {
        "username": process.env.DB_USER,
        "password": process.env.DB_PASSWORD,
        "database": process.env.DB_NAME,
        "host": process.env.DB_HOST,
        "port": process.env.DB_PORT,
        "dialect": "postgres",
        "logging": false // Add this line to disable logging
    },
    "test": {
        "username": process.env.DB_USER,
        "password": process.env.DB_PASSWORD,
        "database": process.env.DB_NAME + "_test",
        "host": process.env.DB_HOST,
        "port": process.env.DB_PORT,
        "dialect": "postgres",
        "logging": false // Add here too if needed
    },
    "production": {
        "url": process.env.DB_URL,
        // "username": process.env.DB_USER,
        // "password": process.env.DB_PASSWORD,
        // "database": process.env.DB_NAME,
        // "host": process.env.DB_HOST,
        // "port": process.env.DB_PORT,
        // "dialect": "postgres",
        // "logging": false // Add here too if needed
    }
}
