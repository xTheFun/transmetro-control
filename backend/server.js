// ============================================================
// SERVIDOR PRINCIPAL — Sistema de Control Transmetro
// Node.js + Express + Knex (SQLite demo / PostgreSQL producción)
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const db         = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Seguridad: cabeceras HTTP seguras (helmet)
app.use(helmet({ contentSecurityPolicy: false })); // CSP desactivado para CDN en frontend

// ── Seguridad: limitar peticiones para prevenir fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  message: { error: 'Demasiadas peticiones. Intenta más tarde.' }
});
app.use('/api/', limiter);

// Límite más estricto para el endpoint de login (anti fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login. Espera 15 minutos.' }
});
app.use('/api/auth/login', loginLimiter);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Rutas de la API (todas protegidas excepto /login)
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/lineas',     require('./routes/lineas'));
app.use('/api/estaciones', require('./routes/estaciones'));
app.use('/api/buses',      require('./routes/buses'));
app.use('/api/pilotos',    require('./routes/pilotos'));
app.use('/api/ocupacion',  require('./routes/ocupacion'));
app.use('/api/alertas',    require('./routes/alertas'));
app.use('/api/reportes',   require('./routes/reportes'));

// Ruta catch-all: cualquier URL que no sea /api redirige al frontend
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use(errorHandler);

// ── Inicialización: migrar la base y arrancar
async function iniciar() {
  try {
    console.log(`🗄️  Modo BD: ${process.env.DB_MODE || 'demo'}`);
    await db.migrate.latest({ directory: path.join(__dirname, '../database/migrations') });
    console.log('✅ Migraciones aplicadas.');

    // En modo demo, sembrar si la tabla usuario está vacía
    if (process.env.DB_MODE !== 'postgres') {
      const [{ total }] = await db('usuario').count('id as total').catch(() => [{ total: 0 }]);
      if (Number(total) === 0) {
        console.log('🌱 Sembrando datos de ejemplo...');
        require('../database/seeds/seed');
      }
    }

    app.listen(PORT, () => {
      console.log(`\n🚌 Transmetro Control corriendo en http://localhost:${PORT}`);
      console.log(`   Login: admin / Admin2026\n`);
    });

    // Iniciar simulador si está activado
    if (process.env.SIMULADOR === 'on') {
      const { iniciarSimulador } = require('./simulador/simulador');
      iniciarSimulador(Number(process.env.SIMULADOR_INTERVALO) || 15);
    }
  } catch (err) {
    console.error('❌ Error al iniciar el servidor:', err.message);
    process.exit(1);
  }
}

iniciar();
module.exports = app; // exportado para tests
