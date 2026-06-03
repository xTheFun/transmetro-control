// Controlador de autenticación — login, perfil y cambio de contraseña
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET  = process.env.JWT_SECRET  || 'transmetro_jwt_secret_dev';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REMEMBER= process.env.JWT_REMEMBER_EXPIRES_IN || '7d';

// POST /api/auth/login
// Valida credenciales con bcrypt y devuelve un JWT firmado
async function login(req, res) {
  const { usuario, contrasena, recordar } = req.body;

  // Validación básica de entrada (seguridad: no revelar cuál campo faltó)
  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }

  // Sanitizar: longitud máxima para prevenir ataques de cadena larga
  if (usuario.length > 50 || contrasena.length > 100) {
    return res.status(400).json({ error: 'Credenciales inválidas.' });
  }

  const user = await db('usuario').where({ usuario }).first();

  // Comparación con bcrypt — nunca revelar si el usuario existe o no
  if (!user || !(await bcrypt.compare(contrasena, user.password_hash))) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  const payload = { id: user.id, nombre: user.nombre, usuario: user.usuario, rol: user.rol };
  const expiracion = recordar ? JWT_REMEMBER : JWT_EXPIRES;
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expiracion });

  res.json({ token, usuario: payload });
}

// GET /api/auth/perfil
// Devuelve datos del usuario autenticado (sin contraseña)
async function perfil(req, res) {
  const user = await db('usuario').select('id','nombre','usuario','rol').where({ id: req.usuario.id }).first();
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
  res.json(user);
}

// PUT /api/auth/cambiar-contrasena
// El usuario cambia su propia contraseña — requiere la actual
async function cambiarContrasena(req, res) {
  const { contrasenaActual, contrasenaNueva, confirmacion } = req.body;

  if (!contrasenaActual || !contrasenaNueva || !confirmacion) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }
  if (contrasenaNueva !== confirmacion) {
    return res.status(400).json({ error: 'La nueva contraseña y la confirmación no coinciden.' });
  }
  if (contrasenaNueva.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  const user = await db('usuario').where({ id: req.usuario.id }).first();
  if (!user || !(await bcrypt.compare(contrasenaActual, user.password_hash))) {
    return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
  }

  // Guardar SIEMPRE hasheada — nunca texto plano
  const nuevoHash = await bcrypt.hash(contrasenaNueva, 10);
  await db('usuario').where({ id: req.usuario.id }).update({ password_hash: nuevoHash });

  res.json({ mensaje: 'Contraseña actualizada correctamente.' });
}

// PUT /api/auth/resetear-contrasena/:id
// Solo el administrador puede resetear la contraseña de otro usuario
async function resetearContrasena(req, res) {
  const { contrasenaNueva } = req.body;
  const { id } = req.params;

  if (!contrasenaNueva || contrasenaNueva.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
  }

  const user = await db('usuario').where({ id }).first();
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

  const nuevoHash = await bcrypt.hash(contrasenaNueva, 10);
  await db('usuario').where({ id }).update({ password_hash: nuevoHash });

  res.json({ mensaje: `Contraseña de "${user.usuario}" restablecida correctamente.` });
}

// GET /api/auth/usuarios — listar usuarios (sin contraseña)
async function listarUsuarios(req, res) {
  const usuarios = await db('usuario').select('id','nombre','usuario','rol');
  res.json(usuarios);
}

// POST /api/auth/usuarios — crear usuario (solo admin)
async function crearUsuario(req, res) {
  const { nombre, usuario, contrasena, rol } = req.body;
  if (!nombre || !usuario || !contrasena || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }
  const rolesValidos = ['administrador','supervisor','operador','consulta'];
  if (!rolesValidos.includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido.' });
  }
  const existe = await db('usuario').where({ usuario }).first();
  if (existe) return res.status(409).json({ error: 'El nombre de usuario ya existe.' });

  const hash = await bcrypt.hash(contrasena, 10);
  const [id] = await db('usuario').insert({ nombre, usuario, password_hash: hash, rol });
  res.status(201).json({ id, nombre, usuario, rol });
}

module.exports = { login, perfil, cambiarContrasena, resetearContrasena, listarUsuarios, crearUsuario };
