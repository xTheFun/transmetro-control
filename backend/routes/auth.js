const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { autenticar, autorizar } = require('../middleware/auth');

// POST /api/auth/login — público
router.post('/login', ctrl.login);

// GET /api/auth/perfil — requiere sesión
router.get('/perfil', autenticar, ctrl.perfil);

// PUT /api/auth/cambiar-contrasena — el usuario cambia la suya
router.put('/cambiar-contrasena', autenticar, ctrl.cambiarContrasena);

// GET/POST /api/auth/usuarios — solo administrador
router.get('/usuarios', autenticar, autorizar('administrador'), ctrl.listarUsuarios);
router.post('/usuarios', autenticar, autorizar('administrador'), ctrl.crearUsuario);

// PUT /api/auth/resetear-contrasena/:id — solo administrador
router.put('/resetear-contrasena/:id', autenticar, autorizar('administrador'), ctrl.resetearContrasena);

module.exports = router;
