# Sistema de Control Operativo — Transmetro Guatemala
**Proyecto de Graduación — Ingeniería en Sistemas**  
Universidad Mariano Gálvez de Guatemala, 2026

---

## Descripción

Aplicativo web para el control operativo del sistema de transporte público Transmetro en Guatemala. Permite gestionar líneas, estaciones, flota de buses, pilotos, registrar la ocupación en tiempo real y generar alertas automáticas de saturación y baja ocupación.

---

## Credenciales de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin2026` | Administrador |
| `wvicente` | `Super2026` | Supervisor |
| `mlopez` | `Oper2026` | Operador |
| `consulta` | `Cons2026` | Consulta |

---

## Requisitos

- **Node.js** v18 o superior
- **npm** v9 o superior
- Para modo demo (predeterminado): **no se requiere nada más**
- Para modo producción: PostgreSQL 14+

---

## Instalación rápida (modo demo con SQLite)

```bash
# 1. Clonar o descomprimir el proyecto
cd transmetro-app

# 2. Instalar dependencias
npm install

# 3. Copiar el archivo de variables de entorno
copy .env.example .env

# 4. Iniciar el servidor (siembra automáticamente los datos de ejemplo)
npm run dev
```

El servidor arrancará en **http://localhost:3000**

> El modo demo siembra automáticamente los datos de ejemplo la primera vez que se ejecuta.
> Si deseas sembrar manualmente: `npm run seed`

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor en modo desarrollo (DB_MODE=demo) |
| `npm run seed` | Siembra datos de ejemplo en la base de datos |
| `npm run simulador` | Inicia el servidor con el simulador de ocupación activo |
| `npm test` | Ejecuta los tests automatizados de reglas de negocio |

---

## Variables de entorno (.env)

```env
# Modo de base de datos: "demo" (SQLite) o "postgres"
DB_MODE=demo

# Puerto del servidor
PORT=3000

# Secreto JWT — cambiar en producción
JWT_SECRET=transmetro_jwt_secret_2026_cambiar_en_produccion

# Expiración del token
JWT_EXPIRES_IN=1h
JWT_REMEMBER_EXPIRES_IN=7d

# Simulador de ocupación aleatoria
SIMULADOR=off
SIMULADOR_INTERVALO=15

# Solo si DB_MODE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transmetro_db
DB_USER=postgres
DB_PASSWORD=tu_contrasena
```

---

## Estructura del proyecto

```
transmetro-app/
├── backend/
│   ├── server.js           # Servidor Express principal
│   ├── config/db.js        # Conexión Knex (SQLite/PostgreSQL)
│   ├── routes/             # Rutas de la API REST
│   ├── controllers/        # Lógica de cada módulo
│   ├── middleware/         # Autenticación JWT y manejo de errores
│   ├── rules/              # Reglas de negocio RN-01 a RN-09
│   └── simulador/          # Generador de ocupación aleatoria
├── database/
│   ├── knexfile.js         # Configuración de Knex
│   ├── migrations/         # Esquema de las 17 tablas
│   └── seeds/seed.js       # Datos de ejemplo
├── frontend/
│   ├── index.html          # Pantalla de login
│   ├── app.html            # SPA con las 8 vistas
│   ├── css/                # Estilos adicionales
│   └── js/                 # Módulos JavaScript por pantalla
├── tests/
│   └── reglas.test.js      # Tests automatizados (27 casos)
├── mockups/                # Diseño visual de referencia
├── QA_REPORT.md            # Reporte de control de calidad
├── SECURITY_ASSESSMENT.md  # Evaluación de seguridad
├── .env.example            # Plantilla de variables de entorno
└── README.md               # Este archivo
```

---

## Endpoints principales de la API

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión | Público |
| GET | `/api/dashboard` | Métricas del sistema | JWT |
| GET | `/api/lineas` | Listar líneas | JWT |
| POST | `/api/lineas` | Crear línea | Supervisor+ |
| GET | `/api/estaciones` | Listar estaciones | JWT |
| GET | `/api/buses` | Listar flota | JWT |
| POST | `/api/ocupacion` | Registrar ocupación (RN-06/07) | Operador+ |
| GET | `/api/alertas` | Listar alertas | JWT |
| PUT | `/api/alertas/:id/atender` | Atender alerta | Supervisor+ |
| GET | `/api/reportes/resumen` | Resumen operativo | JWT |

---

## Reglas de negocio implementadas

| Regla | Descripción | Verificación |
|---|---|---|
| RN-01 | Un bus tiene máximo 1 línea asignada | Modelo de datos |
| RN-02 | Línea: mínimo buses = estaciones | `reglasNegocio.js` |
| RN-03 | Línea: máximo buses = 2× estaciones | `reglasNegocio.js` |
| RN-04 | Bus siempre con parqueo asignado | Migración NOT NULL + validación |
| RN-05 | Cada acceso tiene mínimo 1 guardia | Seed + UI |
| **RN-06** | **Saturación ≥150% → alerta automática** | **`ocupacionController.js`** |
| **RN-07** | **Baja ocupación <25% → alerta automática** | **`ocupacionController.js`** |
| RN-08 | Estación puede pertenecer a varias líneas | Tabla linea_estacion |
| RN-09 | Línea y estación tienen municipalidad | FK en migración |

---

## Ejecución con simulador de datos dinámicos

El simulador genera registros de ocupación aleatorios cada 15 segundos:

```bash
# Opción 1: Variable de entorno en .env
SIMULADOR=on
npm run dev

# Opción 2: Script dedicado
npm run simulador
```

El simulador genera con probabilidad:
- 10% → Saturación (150-200%) → dispara RN-06
- 10% → Baja ocupación (0-24%) → dispara RN-07
- 80% → Ocupación normal (25-130%)

---

## Ejecución de tests

```bash
npm test
```

Los 27 tests cubren: RN-04, RN-06, RN-07, RN-02, RN-03, bcrypt y JWT.

---

## Configuración con PostgreSQL (producción)

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE transmetro_db;"

# Configurar .env
DB_MODE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transmetro_db
DB_USER=postgres
DB_PASSWORD=tu_contrasena

# Ejecutar migraciones y seed
npm run seed
npm run dev
```

---

## Diseño visual

El frontend replica exactamente el diseño de los mockups en `mockups/mockups_transmetro_final.html`:
- Fuente: **Manrope** (Google Fonts)
- Colores: verde primario `#006037`, azul marino `#49607c`, rojo `#ba1a1a`
- Componentes: tarjetas glassmorphism, sidebar fijo, bottom nav en móvil
- Tagline: **"Orden y Progreso"**
- Avatares con iniciales en círculos de color (sin fotos)

---

*Universidad Mariano Gálvez de Guatemala — Ingeniería en Sistemas de Información — 2026*
