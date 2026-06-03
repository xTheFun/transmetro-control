// Configuración de Knex para SQLite (demo) y PostgreSQL (producción)
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const modo = process.env.DB_MODE || 'demo';

const config = {
  demo: {
    client: 'better-sqlite3',
    connection: {
      filename: require('path').join(__dirname, 'transmetro_demo.sqlite3')
    },
    useNullAsDefault: true,
    migrations: { directory: './migrations' },
    seeds:      { directory: './seeds' }
  },

  postgres: {
    client: 'pg',
    connection: {
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 5432,
      database: process.env.DB_NAME     || 'transmetro_db',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || ''
    },
    pool: { min: 2, max: 10 },
    migrations: { directory: './migrations' },
    seeds:      { directory: './seeds' }
  }
};

module.exports = config[modo] || config.demo;
