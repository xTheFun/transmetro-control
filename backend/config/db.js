// Conexión centralizada a la base de datos mediante Knex
// Soporta DB_MODE=demo (SQLite) y DB_MODE=postgres (PostgreSQL)
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const knex = require('knex');
const config = require('../../database/knexfile');

const db = knex(config);

module.exports = db;
