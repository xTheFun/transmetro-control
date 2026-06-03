// Módulo Perfil — datos del usuario y cambio de contraseña
async function cargarPerfil() {
  const el = document.getElementById('view-perfil');
  el.innerHTML = `<div class="flex items-center justify-center h-48 text-on-surface-variant"><span class="material-symbols-outlined mr-2">refresh</span>Cargando...</div>`;
  try {
    const user = await api('/api/auth/perfil');
    const userData = JSON.parse(localStorage.getItem('tm_usuario_data')||'{}');
    const esAdmin = userData.rol === 'administrador';
    let usuariosHTML = '';

    if (esAdmin) {
      const usuarios = await api('/api/auth/usuarios');
      usuariosHTML = `
      <div class="glass-card rounded-xl p-lg mt-6">
        <h3 class="text-headline-sm text-on-surface mb-4">Administración de usuarios</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead><tr class="border-b border-outline-variant/30">
              <th class="py-2 px-3 text-on-surface-variant">Nombre</th>
              <th class="py-2 px-3 text-on-surface-variant">Usuario</th>
              <th class="py-2 px-3 text-on-surface-variant">Rol</th>
              <th class="py-2 px-3 text-on-surface-variant">Acciones</th>
            </tr></thead>
            <tbody class="divide-y divide-outline-variant/20">
              ${usuarios.map(u=>`
              <tr class="hover:bg-surface-container-highest/20">
                <td class="py-2 px-3 font-semibold">${u.nombre}</td>
                <td class="py-2 px-3 font-mono text-secondary">${u.usuario}</td>
                <td class="py-2 px-3"><span class="capitalize">${u.rol}</span></td>
                <td class="py-2 px-3">
                  <button onclick="modalResetearContrasena(${u.id},'${u.usuario}')" class="text-xs text-primary hover:underline">Resetear contraseña</button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <button onclick="modalNuevoUsuario()" class="mt-4 flex items-center gap-2 text-label-sm text-primary hover:underline">
          <span class="material-symbols-outlined text-sm">add</span>Agregar usuario
        </button>
      </div>`;
    }

    el.innerHTML = `
    <div class="mb-lg">
      <h1 class="text-headline-lg text-on-surface mb-xs">Mi perfil</h1>
      <p class="text-body-md text-on-surface-variant">Información de cuenta y seguridad.</p>
    </div>
    <div class="max-w-2xl mx-auto flex flex-col gap-6">
      <!-- Tarjeta de perfil -->
      <div class="glass-card rounded-xl p-lg flex items-center gap-lg flex-wrap">
        <div class="w-20 h-20 rounded-full bg-secondary text-white flex items-center justify-center text-display-num font-bold shadow-sm">
          ${iniciales(user.nombre)}
        </div>
        <div class="flex-1">
          <h2 class="text-headline-md text-on-surface">${user.nombre}</h2>
          <p class="text-body-md text-on-surface-variant">@${user.usuario}</p>
          <span class="inline-block mt-2 px-3 py-1 rounded-full text-label-sm capitalize ${
            user.rol==='administrador'?'bg-primary/10 text-primary border border-primary/20':
            user.rol==='supervisor'?'bg-secondary/10 text-secondary border border-secondary/20':
            'bg-surface-container text-on-surface-variant border border-outline-variant/30'}">${user.rol}</span>
        </div>
      </div>

      <!-- Cambiar contraseña -->
      <div class="glass-card rounded-xl p-lg">
        <h3 class="text-headline-sm text-on-surface mb-1">Cambiar contraseña</h3>
        <p class="text-body-md text-on-surface-variant mb-4 text-sm">Las contraseñas se almacenan cifradas. No es posible ver la contraseña actual, solo cambiarla.</p>
        <form onsubmit="cambiarContrasena(event)" class="flex flex-col gap-4">
          <div>
            <label class="text-sm font-semibold block mb-1">Contraseña actual *</label>
            <div class="relative">
              <input name="actual" type="password" class="w-full border border-outline-variant rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-primary" required/>
              <button type="button" onclick="togglePwd(this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5">
                <span class="material-symbols-outlined text-sm">visibility</span>
              </button>
            </div>
          </div>
          <div>
            <label class="text-sm font-semibold block mb-1">Nueva contraseña * <span class="font-normal text-xs text-on-surface-variant">(mínimo 8 caracteres)</span></label>
            <div class="relative">
              <input name="nueva" type="password" minlength="8" class="w-full border border-outline-variant rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-primary" required/>
              <button type="button" onclick="togglePwd(this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5">
                <span class="material-symbols-outlined text-sm">visibility</span>
              </button>
            </div>
          </div>
          <div>
            <label class="text-sm font-semibold block mb-1">Confirmar nueva contraseña *</label>
            <div class="relative">
              <input name="confirmacion" type="password" class="w-full border border-outline-variant rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-primary" required/>
              <button type="button" onclick="togglePwd(this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5">
                <span class="material-symbols-outlined text-sm">visibility</span>
              </button>
            </div>
          </div>
          <button type="submit" class="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-container transition-colors font-semibold">Actualizar contraseña</button>
        </form>
      </div>
      ${usuariosHTML}
    </div>`;
  } catch(e) { el.innerHTML = `<p class="text-error p-4">${e.message}</p>`; }
}

function togglePwd(btn) {
  const input = btn.closest('.relative').querySelector('input');
  const icon  = btn.querySelector('.material-symbols-outlined');
  input.type  = input.type === 'password' ? 'text' : 'password';
  icon.textContent = input.type === 'password' ? 'visibility' : 'visibility_off';
}

async function cambiarContrasena(e) {
  e.preventDefault();
  const f = e.target;
  if (f.nueva.value !== f.confirmacion.value) { toast('Las contraseñas no coinciden.','error'); return; }
  try {
    await api.put('/api/auth/cambiar-contrasena', { contrasenaActual: f.actual.value, contrasenaNueva: f.nueva.value, confirmacion: f.confirmacion.value });
    toast('Contraseña actualizada correctamente.');
    f.reset();
  } catch(err){ toast(err.message,'error'); }
}

function modalResetearContrasena(id, usuario) {
  abrirModal(`Resetear contraseña: @${usuario}`, `
  <p class="text-sm text-on-surface-variant mb-4">Asigna una nueva contraseña temporal. El usuario deberá cambiarla al ingresar.</p>
  <form onsubmit="ejecutarResetContrasena(event,${id})">
    <div class="flex flex-col gap-4">
      <div>
        <label class="text-sm font-semibold block mb-1">Nueva contraseña * <span class="font-normal text-xs">(mínimo 8 caracteres)</span></label>
        <input name="nueva" type="password" minlength="8" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/>
      </div>
      <div class="flex gap-2 justify-end">
        <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface">Cancelar</button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white">Resetear</button>
      </div>
    </div>
  </form>`);
}

async function ejecutarResetContrasena(e, id) {
  e.preventDefault();
  try {
    await api.put(`/api/auth/resetear-contrasena/${id}`, { contrasenaNueva: e.target.nueva.value });
    cerrarModal(); toast('Contraseña restablecida.');
  } catch(err){ toast(err.message,'error'); }
}

function modalNuevoUsuario() {
  abrirModal('Nuevo usuario', `
  <form onsubmit="crearUsuario(event)">
    <div class="flex flex-col gap-4">
      <div><label class="text-sm font-semibold block mb-1">Nombre completo *</label>
        <input name="nombre" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div><label class="text-sm font-semibold block mb-1">Usuario *</label>
        <input name="usuario" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div><label class="text-sm font-semibold block mb-1">Contraseña * <span class="font-normal text-xs">(mínimo 8 caracteres)</span></label>
        <input name="contrasena" type="password" minlength="8" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div><label class="text-sm font-semibold block mb-1">Rol *</label>
        <select name="rol" class="w-full border border-outline-variant rounded-lg px-3 py-2">
          <option value="administrador">Administrador</option>
          <option value="supervisor" selected>Supervisor</option>
          <option value="operador">Operador</option>
          <option value="consulta">Consulta</option>
        </select></div>
      <div class="flex gap-2 justify-end pt-2">
        <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface">Cancelar</button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white">Crear usuario</button>
      </div>
    </div>
  </form>`);
}

async function crearUsuario(e) {
  e.preventDefault();
  const f = e.target;
  try {
    await api.post('/api/auth/usuarios', { nombre: f.nombre.value, usuario: f.usuario.value, contrasena: f.contrasena.value, rol: f.rol.value });
    cerrarModal(); toast('Usuario creado.'); cargarPerfil();
  } catch(err){ toast(err.message,'error'); }
}
