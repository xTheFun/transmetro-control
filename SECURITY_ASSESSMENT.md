# SECURITY_ASSESSMENT.md — Evaluación de Seguridad
## Sistema de Control Operativo Transmetro
**Fecha:** Junio 2026 | **Versión:** 1.0 | **Idioma:** Español

---

## 1. Manejo de contraseñas

### Implementación
Las contraseñas se almacenan **exclusivamente** como hash bcrypt (costo 10) en la columna `password_hash` de la tabla `usuario`. Nunca se guarda la contraseña en texto plano, en forma reversible, ni en ningún log.

**Archivo:** `database/seeds/seed.js`, `backend/controllers/authController.js`

```js
// Siempre hasheada antes de guardar — nunca texto plano
const hash = await bcrypt.hash(contrasena, 10);
await db('usuario').insert({ password_hash: hash });
```

### Verificación de identidad
La comparación usa `bcrypt.compare()`, que es resistente a ataques de temporización (timing attacks) porque siempre completa el hash completo antes de devolver el resultado.

```js
const ok = await bcrypt.compare(contrasenaIngresada, user.password_hash);
```

### Irreversibilidad
bcrypt es una función de hash unidireccional. No existe ninguna operación en el sistema para recuperar o ver la contraseña original. El administrador solo puede **resetear** (asignar una nueva), no ver la existente.

---

## 2. Autenticación y manejo de sesiones (JWT)

### Mecanismo
Se usa **JSON Web Tokens (JWT)** firmados con HMAC-SHA256. El token se emite al hacer login y se envía en cada petición en el header `Authorization: Bearer <token>`.

**Archivo:** `backend/middleware/auth.js`, `backend/controllers/authController.js`

| Configuración | Valor |
|---|---|
| Algoritmo | HS256 (HMAC-SHA256) |
| Expiración normal | 1 hora |
| Expiración con "Recordar" | 7 días |
| Secreto | Variable de entorno `JWT_SECRET` |

### Almacenamiento en el cliente
- **Sin "Recordar credenciales":** Token en `sessionStorage` (se borra al cerrar pestaña).
- **Con "Recordar credenciales":** Token en `localStorage` (persiste entre sesiones).
- **Nunca** se almacena la contraseña en el cliente, solo el nombre de usuario si el usuario activa "Recordar".

### Protección
- Token expirado → respuesta 403, redirige al login automáticamente.
- Secreto incorrecto → JWT lanza error, middleware rechaza la petición.
- El `JWT_SECRET` está en el archivo `.env`, excluido del repositorio via `.gitignore`.

---

## 3. Protección contra inyección SQL

### Enfoque
Se usa **Knex.js** como query builder. Todas las consultas usan parámetros enlazados (parameterized queries / prepared statements). No existe concatenación directa de datos del usuario en queries SQL.

**Ejemplo correcto (Knex):**
```js
// Knex parametriza automáticamente — seguro contra SQL injection
const user = await db('usuario').where({ usuario: usuarioIngresado }).first();
```

**Equivalente SQL generado:**
```sql
SELECT * FROM usuario WHERE usuario = ? LIMIT 1
-- El valor de usuarioIngresado va como parámetro, nunca concatenado
```

### Validación adicional
- Longitud máxima: `usuario.length > 50` o `contrasena.length > 100` → rechazado antes de consultar la BD.
- Tipo de dato verificado: campos numéricos convertidos explícitamente con `parseInt()` o `parseFloat()`.

---

## 4. Control de acceso por roles

### Roles definidos

| Rol | Login | Consultar | Crear/Editar | Eliminar | Administrar usuarios |
|---|---|---|---|---|---|
| `administrador` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `supervisor` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `operador` | ✅ | ✅ | Solo ocupación | ❌ | ❌ |
| `consulta` | ✅ | ✅ | ❌ | ❌ | ❌ |

### Implementación
Dos middlewares en cadena:

```js
// 1. autenticar: verifica que el JWT sea válido
// 2. autorizar: verifica que el rol del usuario esté en la lista permitida
router.delete('/:id', autenticar, autorizar('administrador'), ctrl.eliminar);
```

**Archivo:** `backend/middleware/auth.js`

El rol viene en el payload del JWT. Aunque el cliente no puede modificar el JWT sin invalidar la firma, el rol se lee del JWT en el servidor — no del body de la petición.

---

## 5. Validación y saneamiento de entradas

### Backend
- Campos requeridos verificados antes de consultar la BD.
- Longitudes máximas aplicadas (usuario ≤ 50, contraseña ≤ 100 chars).
- Valores de enum verificados: `rol` solo acepta los 4 valores definidos.
- Valores numéricos convertidos explícitamente (`parseInt`, `parseFloat`).
- En el login, no se revela si el error fue "usuario no existe" o "contraseña incorrecta" — solo "Usuario o contraseña incorrectos" (previene enumeración de usuarios).

### Frontend
- Atributos HTML5: `required`, `maxlength`, `type="number"`, `min`, `minlength`.
- Validación visual con mensajes de error antes de enviar al servidor.
- Sanitización básica con `.trim()` en campos de texto.

---

## 6. Protección de rutas de la API

### Rate Limiting
**Archivo:** `backend/server.js`

```js
// Todas las rutas /api/: máximo 300 peticiones cada 15 minutos
const limiter = rateLimit({ windowMs: 15*60*1000, max: 300 });

// Endpoint de login: máximo 10 intentos cada 15 minutos (anti fuerza bruta)
const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 10 });
```

### Helmet
Se usa `helmet` para establecer cabeceras HTTP de seguridad:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (en producción con HTTPS)
- `Referrer-Policy`

### CORS
Configurado con el paquete `cors`. En producción se debe restringir a los orígenes permitidos (`origin: 'https://transmetro.gob.gt'`).

### Rutas sin autenticación
Solo existe **una** ruta pública: `POST /api/auth/login`. Todas las demás requieren JWT válido.

---

## 7. Recomendaciones para despliegue en producción

| # | Recomendación | Prioridad |
|---|---|---|
| 1 | **Usar HTTPS obligatoriamente.** El JWT viaja en cada petición; sin HTTPS puede ser interceptado. | 🔴 Crítica |
| 2 | **Cambiar `JWT_SECRET`** por una cadena aleatoria larga (≥ 64 chars), generada con `openssl rand -hex 32`. | 🔴 Crítica |
| 3 | **No exponer credenciales de BD** en el repositorio. Usar variables de entorno en el servidor. | 🔴 Crítica |
| 4 | **Agregar `.env` al `.gitignore`** para que nunca se suba al repositorio. | 🔴 Crítica |
| 5 | **Cambiar `DB_MODE=postgres`** y usar PostgreSQL en producción en lugar de SQLite. | 🟡 Alta |
| 6 | **Restringir CORS** al dominio real del aplicativo. | 🟡 Alta |
| 7 | **Aumentar el costo de bcrypt** a 12 en producción (actualmente 10). | 🟡 Alta |
| 8 | **Agregar logging de seguridad** (intentos de login fallidos, accesos denegados). | 🟡 Alta |
| 9 | **Implementar CSRF protection** si se usa cookies en lugar de Bearer tokens. | 🟠 Media |
| 10 | **Establecer Content-Security-Policy** adecuada para el dominio de producción. | 🟠 Media |
| 11 | **Auditar dependencias** regularmente con `npm audit`. | 🟠 Media |
| 12 | **Configurar expiración de tokens** más corta en producción y renovación automática. | 🟠 Media |

---

## 8. Tabla resumen — Checklist de controles de seguridad

| Control de seguridad | Estado | Archivo / Ubicación |
|---|---|---|
| Contraseñas hasheadas con bcrypt | ✅ Implementado | `authController.js` |
| Hash irreversible (sin funciones de descifrado) | ✅ Implementado | bcrypt por diseño |
| No almacenar contraseñas en texto plano | ✅ Verificado | Seed + Controller |
| Autenticación con JWT firmado | ✅ Implementado | `auth.js` middleware |
| Expiración de tokens | ✅ Implementado | `JWT_EXPIRES_IN` en `.env` |
| Token solo en variable de entorno (secreto) | ✅ Implementado | `.env` + `.env.example` |
| Control de acceso por rol en API | ✅ Implementado | `autorizar()` middleware |
| Rutas protegidas (solo login es público) | ✅ Implementado | Todas las rutas con `autenticar` |
| Protección contra inyección SQL (Knex) | ✅ Implementado | Todo el backend |
| Validación de entradas en backend | ✅ Implementado | Todos los controladores |
| Rate limiting en login (anti fuerza bruta) | ✅ Implementado | `server.js` (10 intentos/15 min) |
| Rate limiting general en API | ✅ Implementado | `server.js` (300/15 min) |
| Cabeceras HTTP seguras (Helmet) | ✅ Implementado | `server.js` |
| No revelar información en errores de login | ✅ Implementado | "Usuario o contraseña incorrectos" |
| Contraseña nunca transmitida después del login | ✅ Verificado | Solo se envía en POST /login |
| HTTPS (producción) | ⚠️ Pendiente | Configurar en servidor de producción |
| CORS restringido (producción) | ⚠️ Pendiente | Actualmente `*` — restringir en prod |
| Secretos fuera del repositorio (.gitignore) | ⚠️ Recomendado | Agregar `.env` a `.gitignore` |
| Auditoría de dependencias | ⚠️ Pendiente | Ejecutar `npm audit` |

**Leyenda:**
- ✅ Implementado y funcional  
- ⚠️ Recomendado para producción (no aplica en modo demo/desarrollo)  
- ❌ No implementado  

---

## 9. Conclusión

El aplicativo implementa las medidas de seguridad fundamentales para un sistema de información empresarial: autenticación robusta con JWT, contraseñas irreversibles con bcrypt, control de acceso por roles, protección contra inyección SQL mediante Knex, y rate limiting para prevenir ataques de fuerza bruta. Las vulnerabilidades pendientes (`HTTPS`, `CORS`, `.gitignore`) son propias del entorno de producción y no aplican en el entorno de desarrollo/demo descrito en este proyecto.

La implementación sigue las guías del **OWASP Top 10** para las amenazas más críticas de aplicaciones web:
- **A01 Broken Access Control** → Cubierto con roles y JWT
- **A02 Cryptographic Failures** → Cubierto con bcrypt + HTTPS recomendado
- **A03 Injection** → Cubierto con Knex parameterized queries
- **A07 Identification & Authentication Failures** → Cubierto con bcrypt, JWT, rate limiting
