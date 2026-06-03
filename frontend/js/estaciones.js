// Módulo Estaciones — CRUD con accesos, guardias y parqueos
let _estaciones = [];

async function cargarEstaciones() {
  const el = document.getElementById('view-estaciones');
  el.innerHTML = `<div class="flex items-center justify-center h-48 text-on-surface-variant"><span class="material-symbols-outlined mr-2">refresh</span>Cargando...</div>`;
  try {
    _estaciones = await api('/api/estaciones');
    renderEstaciones();
  } catch(e) { el.innerHTML = `<p class="text-error p-4">${e.message}</p>`; }
}

function renderEstaciones() {
  const el = document.getElementById('view-estaciones');
  el.innerHTML = `
  <div class="flex justify-between items-end mb-lg flex-wrap gap-3">
    <div>
      <h1 class="text-headline-lg text-on-surface mb-xs">Red de Estaciones</h1>
      <p class="text-body-md text-on-surface-variant">${_estaciones.length} estaciones registradas con accesos, guardias y parqueos.</p>
    </div>
    <button onclick="modalNuevaEstacion()" class="flex items-center gap-xs px-4 py-2 bg-primary rounded-lg text-white text-label-lg hover:opacity-90 shadow-sm">
      <span class="material-symbols-outlined text-[18px]">add</span>Nueva
    </button>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
    ${_estaciones.map(e=>`
    <div class="glass-card rounded-xl p-md hover:shadow-md transition-shadow">
      <div class="flex justify-between items-start mb-md">
        <div>
          <h3 class="text-headline-sm text-on-surface">${e.nombre}</h3>
          <p class="text-label-sm text-on-surface-variant mt-1">${e.lineas?.map(l=>l.nombre).join(' · ')||e.ubicacion||'—'}</p>
        </div>
        <span class="${colorEstado(e.estado)} border text-label-sm px-3 py-1 rounded-full">${e.estado}</span>
      </div>
      <div class="grid grid-cols-2 gap-sm">
        <div class="bg-surface-container-low p-sm rounded-lg border border-outline-variant/20">
          <div class="flex items-center gap-xs text-on-surface-variant mb-1"><span class="material-symbols-outlined text-[16px]">door_front</span><span class="text-label-sm">Accesos</span></div>
          <p class="text-headline-md text-on-surface">${e.num_accesos}</p>
        </div>
        <div class="bg-surface-container-low p-sm rounded-lg border border-outline-variant/20">
          <div class="flex items-center gap-xs text-on-surface-variant mb-1"><span class="material-symbols-outlined text-[16px]">security</span><span class="text-label-sm">Guardias</span></div>
          <p class="text-headline-md text-on-surface">${e.num_guardias}</p>
        </div>
        <div class="bg-surface-container-low p-sm rounded-lg border border-outline-variant/20 col-span-2 flex items-center justify-between">
          <div class="flex items-center gap-xs text-on-surface-variant"><span class="material-symbols-outlined text-[16px]">local_parking</span><span class="text-label-sm">Parqueo</span></div>
          <p class="text-label-lg ${e.num_parqueos>0?'text-on-surface':'text-on-surface-variant italic'}">${e.num_parqueos>0?e.num_parqueos+' parqueo'+(e.num_parqueos>1?'s':''):'Sin parqueo'}</p>
        </div>
      </div>
      <div class="mt-3 flex gap-2 pt-3 border-t border-outline-variant/20">
        <button onclick="verDetalleEstacion(${e.id})" class="flex-1 text-center text-label-sm text-secondary hover:text-primary py-1 rounded hover:bg-surface-container-low">Ver detalle</button>
        <button onclick="modalEditarEstacion(${e.id})" class="text-label-sm text-secondary hover:text-primary px-3 py-1 rounded hover:bg-surface-container-low">Editar</button>
        <button onclick="eliminarEstacion(${e.id})" class="text-label-sm text-error hover:text-red-700 px-3 py-1 rounded hover:bg-red-50">Eliminar</button>
      </div>
    </div>`).join('')}
  </div>`;
}

async function verDetalleEstacion(id) {
  const e = await api(`/api/estaciones/${id}`);
  abrirModal(`Detalle: ${e.nombre}`, `
  <div class="flex flex-col gap-4">
    <div>
      <p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Ubicación</p>
      <p class="text-on-surface">${e.ubicacion||'—'}</p>
    </div>
    <div>
      <div class="flex justify-between items-center mb-2">
        <p class="text-label-sm text-on-surface-variant uppercase tracking-wider">Accesos y Guardias</p>
        <button onclick="modalNuevoAcceso(${id})" class="text-xs text-primary hover:underline">+ Agregar acceso</button>
      </div>
      ${e.accesos?.map(acc=>`
      <div class="mb-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
        <div class="flex justify-between items-center mb-2">
          <p class="font-semibold text-sm text-on-surface">${acc.nombre}</p>
          <button onclick="modalNuevoGuardia(${id},${acc.id})" class="text-xs text-primary hover:underline">+ Guardia</button>
        </div>
        ${acc.guardias?.length ? acc.guardias.map(g=>`
        <div class="flex items-center gap-2 text-sm text-on-surface-variant">
          <span class="material-symbols-outlined text-sm">security</span>${g.nombre} · ${g.turno||'—'}
        </div>`).join('') : '<p class="text-xs text-error">Sin guardias asignados</p>'}
      </div>`).join('') || '<p class="text-on-surface-variant text-sm">Sin accesos registrados.</p>'}
    </div>
    <div>
      <p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Operadores</p>
      ${e.operadores?.map(op=>`<p class="text-sm text-on-surface flex items-center gap-2"><span class="material-symbols-outlined text-sm text-primary">person</span>${op.nombre}</p>`).join('') || '<p class="text-on-surface-variant text-sm">Sin operadores.</p>'}
    </div>
  </div>`);
}

function modalNuevaEstacion() {
  abrirModal('Nueva estación', `
  <form onsubmit="guardarEstacion(event)">
    <div class="flex flex-col gap-4">
      <div><label class="text-sm font-semibold block mb-1">Nombre *</label>
        <input name="nombre" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div><label class="text-sm font-semibold block mb-1">Ubicación</label>
        <input name="ubicacion" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary"/></div>
      <div><label class="text-sm font-semibold block mb-1">Estado</label>
        <select name="estado" class="w-full border border-outline-variant rounded-lg px-3 py-2">
          <option>Activa</option><option>Inactiva</option><option>Mantenimiento</option>
        </select></div>
      <div class="flex gap-2 justify-end pt-2">
        <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface">Cancelar</button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white">Guardar</button>
      </div>
    </div>
  </form>`);
}

async function guardarEstacion(e) {
  e.preventDefault();
  const f = e.target;
  try { await api.post('/api/estaciones', { nombre: f.nombre.value, ubicacion: f.ubicacion.value, estado: f.estado.value }); cerrarModal(); toast('Estación creada.'); cargarEstaciones(); } catch(err){ toast(err.message,'error'); }
}

async function modalEditarEstacion(id) {
  const e = _estaciones.find(x=>x.id===id)||{};
  abrirModal('Editar estación', `
  <form onsubmit="actualizarEstacion(event,${id})">
    <div class="flex flex-col gap-4">
      <div><label class="text-sm font-semibold block mb-1">Nombre *</label>
        <input name="nombre" value="${e.nombre||''}" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div><label class="text-sm font-semibold block mb-1">Ubicación</label>
        <input name="ubicacion" value="${e.ubicacion||''}" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary"/></div>
      <div><label class="text-sm font-semibold block mb-1">Estado</label>
        <select name="estado" class="w-full border border-outline-variant rounded-lg px-3 py-2">
          ${['Activa','Inactiva','Mantenimiento'].map(s=>`<option ${s===e.estado?'selected':''}>${s}</option>`).join('')}
        </select></div>
      <div class="flex gap-2 justify-end pt-2">
        <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface">Cancelar</button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white">Guardar cambios</button>
      </div>
    </div>
  </form>`);
}

async function actualizarEstacion(e, id) {
  e.preventDefault();
  const f = e.target;
  try { await api.put(`/api/estaciones/${id}`, { nombre: f.nombre.value, ubicacion: f.ubicacion.value, estado: f.estado.value }); cerrarModal(); toast('Estación actualizada.'); cargarEstaciones(); } catch(err){ toast(err.message,'error'); }
}

async function eliminarEstacion(id) {
  const e = _estaciones.find(x=>x.id===id);
  if (!confirm(`¿Eliminar la estación "${e?.nombre}"?`)) return;
  try { await api.delete(`/api/estaciones/${id}`); toast('Estación eliminada.'); cargarEstaciones(); } catch(err){ toast(err.message,'error'); }
}

function modalNuevoAcceso(idEstacion) {
  abrirModal('Nuevo acceso', `
  <form onsubmit="guardarAcceso(event,${idEstacion})">
    <div class="flex flex-col gap-4">
      <div><label class="text-sm font-semibold block mb-1">Nombre del acceso *</label>
        <input name="nombre" placeholder="Ej: Acceso Norte" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div class="flex gap-2 justify-end">
        <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface">Cancelar</button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white">Agregar</button>
      </div>
    </div>
  </form>`);
}
async function guardarAcceso(e, idEstacion) {
  e.preventDefault();
  try { await api.post(`/api/estaciones/${idEstacion}/accesos`, { nombre: e.target.nombre.value }); cerrarModal(); toast('Acceso creado.'); cargarEstaciones(); } catch(err){ toast(err.message,'error'); }
}

function modalNuevoGuardia(idEstacion, idAcceso) {
  abrirModal('Nuevo guardia', `
  <form onsubmit="guardarGuardia(event,${idEstacion},${idAcceso})">
    <div class="flex flex-col gap-4">
      <div><label class="text-sm font-semibold block mb-1">Nombre *</label>
        <input name="nombre" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div><label class="text-sm font-semibold block mb-1">Turno</label>
        <select name="turno" class="w-full border border-outline-variant rounded-lg px-3 py-2">
          <option>Mañana</option><option>Tarde</option><option>Noche</option>
        </select></div>
      <div class="flex gap-2 justify-end">
        <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface">Cancelar</button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white">Guardar</button>
      </div>
    </div>
  </form>`);
}
async function guardarGuardia(e, idEstacion, idAcceso) {
  e.preventDefault();
  try { await api.post(`/api/estaciones/${idEstacion}/guardias`, { id_acceso: idAcceso, nombre: e.target.nombre.value, turno: e.target.turno.value }); cerrarModal(); toast('Guardia agregado.'); cargarEstaciones(); } catch(err){ toast(err.message,'error'); }
}
