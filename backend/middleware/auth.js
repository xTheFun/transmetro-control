// Middleware de autenticación y control de acceso por rol
// Verifica el JWT en cada petición a rutas protegidas
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'transmetro_jwt_secret_dev';

// Verifica que el request traiga un token JWT válido
function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload; // { id, nombre, usuario, rol }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}

// Permite solo los roles indicados
// Uso: router.get('/ruta', autenticar, autorizar('administrador', 'supervisor'), handler)
function autorizar(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}.`
      });
    }
    next();
  };
}

module.exports = { autenticar, autorizar };
