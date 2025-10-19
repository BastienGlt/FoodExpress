const dotenv = require('dotenv').config();
const mongoose = require('mongoose');

const DB_URL = process.env.DB_URL + '/foodexpress';

mongoose.connect(DB_URL)
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
console.log('Connected to the database ' + DB_URL);
});

module.exports = db;