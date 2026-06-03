// Módulo Pilotos — CRUD con historial educativo
let _pilotos = [], _busesPiloto = [];

async function cargarPilotos() {
  const el = document.getElementById('view-pilotos');
  el.innerHTML = `<div class="flex items-center justify-center h-48 text-on-surface-variant"><span class="material-symbols-outlined mr-2">refresh</span>Cargando...</div>`;
  try {
    [_pilotos, _busesPiloto] = await Promise.all([api('/api/pilotos'), api('/api/buses')]);
    renderPilotos();
  } catch(e) { el.innerHTML = `<p class="text-error p-4">${e.message}</p>`; }
}

function renderPilotos() {
  const el = document.getElementById('view-pilotos');
  const bgColores = ['bg-primary','bg-secondary','bg-primary','bg-secondary','bg-primary'];
  el.innerHTML = `
  <div class="flex justify-between items-end mb-lg flex-wrap gap-3">
    <div>
      <h1 class="text-headline-lg text-on-surface mb-xs">Directorio de Pilotos</h1>
      <p class="text-body-md text-on-surface-variant">Gestión y estado operativo del personal de conducción.</p>
    </div>
    <button onclick="modalNuevoPiloto()" class="flex items-center gap-sm px-lg py-sm rounded-full bg-primary text-white text-label-lg hover:bg-primary-container shadow-sm">
      <span class="material-symbols-outlined">add</span>Nuevo piloto
    </button>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
    ${_pilotos.map((p,i)=>`
    <div class="glass-card rounded-xl p-lg flex flex-col gap-md hover:shadow-md transition-shadow">
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-md">
          <div class="relative">
            <div class="w-14 h-14 rounded-full ${bgColores[i%5]} flex items-center justify-center text-white text-headline-md font-bold shadow-sm">${iniciales(p.nombre)}</div>
            <div class="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-surface ${p.bus_estado==='Mantenimiento'?'bg-yellow-500':p.id_bus?'bg-primary':'bg-outline'}"></div>
          </div>
          <div>
            <h3 class="text-headline-sm font-bold text-on-surface">${p.nombre}</h3>
            <p class="text-body-md text-on-surface-variant flex items-center gap-xs"><span class="material-symbols-outlined text-sm">badge</span>DPI: ${p.dpi}</p>
          </div>
        </div>
        <span class="px-sm py-xs rounded-full text-label-sm border ${p.bus_estado==='Mantenimiento'?'bg-yellow-100 text-yellow-800 border-yellow-300/50':p.id_bus?'bg-primary/10 text-primary border-primary/20':'bg-surface-container text-on-surface-variant border-outline-variant/30'}">${p.bus_estado==='Mantenimiento'?'Bus en mantto.':p.id_bus?'Activo':'Sin bus'}</span>
      </div>
      <div class="grid grid-cols-2 gap-sm border-t border-outline-variant/20 pt-md">
        <div class="flex flex-col gap-xs">
          <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Bus asignado</span>
          <span class="text-label-lg text-on-surface flex items-center gap-xs">
            <span class="material-symbols-outlined ${p.bus_estado==='Mantenimiento'?'text-yellow-600':'text-primary'}">${p.bus_estado==='Mantenimiento'?'build':'directions_bus'}</span>
            ${p.bus_codigo||'Sin asignar'}
          </span>
        </div>
        <div class="flex flex-col gap-xs">
          <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Residencia</span>
          <span class="text-label-lg text-on-surface">${p.residencia||'—'}</span>
        </div>
      </div>
      <div class="flex gap-2 pt-2 border-t border-outline-variant/20">
        <button onclick="verHistorialPiloto(${p.id})" class="flex-1 text-center text-label-sm text-secondary hover:text-primary py-1.5 rounded border border-outline-variant/30 hover:bg-surface-container-low">Historial</button>
        <button onclick="modalEditarPiloto(${p.id})" class="text-label-sm text-secondary hover:text-primary px-3 py-1.5 rounded border border-outline-variant/30 hover:bg-surface-container-low">Editar</button>
        <button onclick="eliminarPiloto(${p.id})" class="text-label-sm text-error px-3 py-1.5 rounded border border-error/30 hover:bg-red-50">Elim.</button>
      </div>
    </div>`).join('')}
  </div>`;
}

async function verHistorialPiloto(id) {
  const p = await api(`/api/pilotos/${id}`);
  abrirModal(`Historial: ${p.nombre}`, `
  <div class="flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <p class="text-sm text-on-surface-variant">${p.historial?.length||0} registros educativos</p>
      <button onclick="modalAgregarHistorial(${id})" class="text-xs text-primary hover:underline">+ Agregar</button>
    </div>
    ${p.historial?.length ? p.historial.map(h=>`
    <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
      <div class="flex justify-between items-start">
        <div>
          <p class="font-semibold text-sm text-on-surface">${h.curso}</p>
          <p class="text-xs text-on-surface-variant mt-1">${h.tipo_licencia} · ${h.fecha||'—'}</p>
        </div>
        <button onclick="eliminarHistorialPiloto(${id},${h.id})" class="text-xs text-error hover:underline">Eliminar</button>
      </div>
    </div>`).join('') : '<p class="text-on-surface-variant text-sm text-center py-4">Sin historial educativo registrado.</p>'}
  </div>`);
}

function modalAgregarHistorial(idPiloto) {
  abrirModal('Agregar al historial', `
  <form onsubmit="guardarHistorial(event,${idPiloto})">
    <div class="flex flex-col gap-4">
      <div><label class="text-sm font-semibold block mb-1">Tipo de licencia *</label>
        <select name="tipo_licencia" class="w-full border border-outline-variant rounded-lg px-3 py-2">
          <option>Tipo A</option><option>Tipo B</option><option selected>Tipo C</option><option>Tipo E</option>
        </select></div>
      <div><label class="text-sm font-semibold block mb-1">Curso *</label>
        <input name="curso" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required placeholder="Ej: Manejo defensivo"/></div>
      <div><label class="text-sm font-semibold block mb-1">Fecha</label>
        <input name="fecha" type="date" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary"/></div>
      <div class="flex gap-2 justify-end">
        <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface">Cancelar</button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white">Agregar</button>
      </div>
    </div>
  </form>`);
}
async function guardarHistorial(e, idPiloto) {
  e.preventDefault();
  const f = e.target;
  try { await api.post(`/api/pilotos/${idPiloto}/historial`, { tipo_licencia: f.tipo_licencia.value, curso: f.curso.value, fecha: f.fecha.value }); cerrarModal(); toast('Registro agregado.'); } catch(err){ toast(err.message,'error'); }
}
async function eliminarHistorialPiloto(idPiloto, idH) {
  if (!confirm('¿Eliminar este registro?')) return;
  try { await api.delete(`/api/pilotos/${idPiloto}/historial/${idH}`); toast('Registro eliminado.'); verHistorialPiloto(idPiloto); } catch(e){ toast(e.message,'error'); }
}

function modalNuevoPiloto() {
  const optsBus = `<option value="">Sin asignar</option>${_busesPiloto.map(b=>`<option value="${b.id}">${b.codigo} — ${b.placa}</option>`).join('')}`;
  abrirModal('Nuevo piloto', `
  <form onsubmit="guardarPiloto(event)">
    <div class="flex flex-col gap-4">
      <div><label class="text-sm font-semibold block mb-1">Nombre completo *</label>
        <input name="nombre" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div><label class="text-sm font-semibold block mb-1">DPI *</label>
        <input name="dpi" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required placeholder="13 dígitos sin espacios"/></div>
      <div><label class="text-sm font-semibold block mb-1">Residencia</label>
        <input name="residencia" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary"/></div>
      <div><label class="text-sm font-semibold block mb-1">Bus asignado</label>
        <select name="id_bus" class="w-full border border-outline-variant rounded-lg px-3 py-2">${optsBus}</select></div>
      <div class="flex gap-2 justify-end pt-2">
        <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface">Cancelar</button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white">Guardar</button>
      </div>
    </div>
  </form>`);
}
async function guardarPiloto(e) {
  e.preventDefault();
  const f = e.target;
  try { await api.post('/api/pilotos', { nombre: f.nombre.value, dpi: f.dpi.value, residencia: f.residencia.value, id_bus: f.id_bus.value||null }); cerrarModal(); toast('Piloto registrado.'); cargarPilotos(); } catch(err){ toast(err.message,'error'); }
}

async function modalEditarPiloto(id) {
  const p = _pilotos.find(x=>x.id===id)||{};
  const optsBus = `<option value="">Sin asignar</option>${_busesPiloto.map(b=>`<option value="${b.id}" ${b.id===p.id_bus?'selected':''}>${b.codigo} — ${b.placa}</option>`).join('')}`;
  abrirModal('Editar piloto', `
  <form onsubmit="actualizarPiloto(event,${id})">
    <div class="flex flex-col gap-4">
      <div><label class="text-sm font-semibold block mb-1">Nombre completo *</label>
        <input name="nombre" value="${p.nombre||''}" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div><label class="text-sm font-semibold block mb-1">DPI *</label>
        <input name="dpi" value="${p.dpi||''}" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div><label class="text-sm font-semibold block mb-1">Residencia</label>
        <input name="residencia" value="${p.residencia||''}" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary"/></div>
      <div><label class="text-sm font-semibold block mb-1">Bus asignado</label>
        <select name="id_bus" class="w-full border border-outline-variant rounded-lg px-3 py-2">${optsBus}</select></div>
      <div class="flex gap-2 justify-end pt-2">
        <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface">Cancelar</button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white">Guardar cambios</button>
      </div>
    </div>
  </form>`);
}
async function actualizarPiloto(e, id) {
  e.preventDefault();
  const f = e.target;
  try { await api.put(`/api/pilotos/${id}`, { nombre: f.nombre.value, dpi: f.dpi.value, residencia: f.residencia.value, id_bus: f.id_bus.value||null }); cerrarModal(); toast('Piloto actualizado.'); cargarPilotos(); } catch(err){ toast(err.message,'error'); }
}
async function eliminarPiloto(id) {
  const p = _pilotos.find(x=>x.id===id);
  if (!confirm(`¿Eliminar al piloto "${p?.nombre}"?`)) return;
  try { await api.delete(`/api/pilotos/${id}`); toast('Piloto eliminado.'); cargarPilotos(); } catch(e){ toast(e.message,'error'); }
}
