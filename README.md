# Sistema de Control Operativo — Transmetro Guatemala

Proyecto de Graduación · Ingeniería en Sistemas de Información  
Universidad Mariano Gálvez de Guatemala · 2026

---

## ¿De qué trata el proyecto?

Sistema web para el control operativo del sistema de transporte público Transmetro en Guatemala. Permite gestionar las 7 líneas, 73 estaciones y la flota de buses, registrar la ocupación en tiempo real y generar alertas automáticas cuando un bus está saturado o con muy pocos pasajeros.

---

## Tecnologías usadas

- **Backend:** Node.js + Express
- **Base de datos:** SQLite (modo demo, sin instalación) / PostgreSQL (producción)
- **ORM:** Knex.js
- **Frontend:** HTML + Tailwind CSS + JavaScript
- **Autenticación:** JWT + bcrypt

---

## Cómo ejecutar el proyecto

### Requisitos
- Node.js v18 o superior
- npm

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor (la base de datos se crea automáticamente)
npm run dev
```

Abrir en el navegador: **http://localhost:3000**

---

## Usuarios de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| admin | Admin2026 | Administrador |
| wvicente | Super2026 | Supervisor |
| mlopez | Oper2026 | Operador |
| consulta | Cons2026 | Consulta |

---

## Estructura del proyecto

```
backend/        → API REST (rutas, controladores, lógica de negocio)
database/       → Esquema de base de datos y datos de ejemplo
frontend/       → Interfaz web (login + 8 módulos)
docs/           → Documentación de queries SQL
tests/          → Pruebas automatizadas
```

---

## Módulos del sistema

1. Panel principal — métricas en tiempo real
2. Líneas y rutas — gestión de las 7 líneas reales de Transmetro
3. Estaciones — 73 estaciones con accesos, guardias y parqueos
4. Flota de buses — 86 unidades registradas
5. Pilotos — directorio con historial educativo
6. Registro de ocupación — pantalla del operador
7. Alertas — saturación (≥150%) y baja ocupación (<25%)
8. Reportes — gráficas y exportación a PDF

---

## Reglas de negocio principales

- **RN-06:** Si un bus registra ≥150% de ocupación → se genera alerta de saturación automáticamente
- **RN-07:** Si la ocupación es <25% → se genera alerta de baja ocupación
- **RN-04:** Todo bus debe tener parqueo asignado (obligatorio)
- **RN-02/03:** Cada línea tiene entre N y 2N buses según el número de estaciones

---

## Líneas reales incluidas

| Código | Nombre |
|---|---|
| L-01 | Centro Histórico |
| L-02 | Centro Histórico – Hipódromo |
| L-06 | Zona 6 |
| L-07 | Anillo Periférico |
| L-12 | Eje Sur (Aguilar Batres) |
| L-13 | Eje Central |
| L-18 | Eje Norte |

Las estaciones de transferencia (Plaza Barrios, El Trébol, Centra Sur, Centra Atlántida) están modeladas como nodos compartidos entre líneas.

---

## Scripts disponibles

```bash
npm run dev        # Iniciar servidor
npm run seed       # Cargar datos de ejemplo
npm run simulador  # Servidor con simulación de ocupación en tiempo real
npm test           # Ejecutar pruebas automatizadas
```
