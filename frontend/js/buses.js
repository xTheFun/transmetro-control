// Módulo Flota de Buses — CRUD con validación RN-04
let _buses = [], _parqueos = [], _lineasBus = [];

async function cargarFlota() {
  const el = document.getElementById('view-flota');
  el.innerHTML = `<div class="flex items-center justify-center h-48 text-on-surface-variant"><span class="material-symbols-outlined mr-2">refresh</span>Cargando...</div>`;
  try {
    [_buses, _parqueos, _lineasBus] = await Promise.all([
      api('/api/buses'), api('/api/buses/parqueos'), api('/api/lineas')
    ]);
    renderFlota();
  } catch(e) { el.innerHTML = `<p class="text-error p-4">${e.message}</p>`; }
}

function renderFlota() {
  const el = document.getElementById('view-flota');
  el.innerHTML = `
  <div class="flex justify-between items-end mb-lg flex-wrap gap-3">
    <div>
      <h1 class="text-headline-lg text-on-surface mb-xs">Directorio de Flota</h1>
      <p class="text-body-md text-on-surface-variant">${_buses.length} unidades registradas · gestión y estado operativo.</p>
    </div>
    <button onclick="modalNuevoBus()" class="bg-primary text-white text-label-lg px-6 py-3 rounded-full hover:bg-primary-container transition-colors shadow-sm flex items-center gap-sm">
      <span class="material-symbols-outlined">add</span>Nueva unidad
    </button>
  </div>

  <!-- Tabla en escritorio, tarjetas en móvil -->
  <div class="glass-card rounded-xl overflow-hidden hidden md:block">
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-outline-variant/50 bg-surface-container-low/50">
            <th class="py-4 px-6 text-label-lg text-on-surface-variant">Código</th>
            <th class="py-4 px-6 text-label-lg text-on-surface-variant">Placa</th>
            <th class="py-4 px-6 text-label-lg text-on-surface-variant">Cap.</th>
            <th class="py-4 px-6 text-label-lg text-on-surface-variant">Línea</th>
            <th class="py-4 px-6 text-label-lg text-on-surface-variant">Parqueo</th>
            <th class="py-4 px-6 text-label-lg text-on-surface-variant">Piloto</th>
            <th class="py-4 px-6 text-label-lg text-on-surface-variant">Estado</th>
            <th class="py-4 px-6 text-label-lg text-on-surface-variant">Acciones</th>
          </tr>
        </thead>
        <tbody class="text-body-md text-on-surface divide-y divide-outline-variant/30">
          ${_buses.map(b=>`
          <tr class="hover:bg-surface-container-highest/20 transition-colors">
            <td class="py-4 px-6 font-bold">${b.codigo}</td>
            <td class="py-4 px-6"><span class="bg-surface-container px-2 py-1 rounded border border-outline-variant/30 text-secondary font-mono text-sm">${b.placa}</span></td>
            <td class="py-4 px-6">${b.capacidad}</td>
            <td class="py-4 px-6">${b.linea_nombre||'<span class="text-on-surface-variant italic">Sin asignar</span>'}</td>
            <td class="py-4 px-6">${b.parqueo_nombre||'<span class="text-error">Sin parqueo</span>'}</td>
            <td class="py-4 px-6">${b.piloto_nombre
              ? `<div class="flex items-center gap-sm"><div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-label-sm">${iniciales(b.piloto_nombre)}</div><span>${b.piloto_nombre}</span></div>`
              : '<span class="text-on-surface-variant italic">Sin piloto</span>'}</td>
            <td class="py-4 px-6"><span class="${colorEstado(b.estado)} inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm border"><span class="w-2 h-2 rounded-full ${b.estado==='Activo'?'bg-primary':b.estado==='Mantenimiento'?'bg-yellow-500':'bg-outline'}"></span>${b.estado}</span></td>
            <td class="py-4 px-6">
              <div class="flex gap-2">
                <button onclick="modalEditarBus(${b.id})" class="text-xs text-secondary hover:text-primary px-2 py-1 rounded border border-outline-variant/30 hover:bg-surface-container-low">Editar</button>
                <button onclick="eliminarBus(${b.id})" class="text-xs text-error hover:text-red-700 px-2 py-1 rounded border border-error/30 hover:bg-red-50">Eliminar</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Tarjetas móvil -->
  <div class="flex flex-col gap-md md:hidden">
    ${_buses.map(b=>`
    <div class="glass-card rounded-xl p-md">
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-bold text-on-surface text-lg">${b.codigo}</h3>
          <span class="font-mono text-sm text-secondary">${b.placa}</span>
        </div>
        <span class="${colorEstado(b.estado)} text-label-sm px-2 py-0.5 rounded-full border">${b.estado}</span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm mb-3">
        <div><span class="text-on-surface-variant">Capacidad:</span> ${b.capacidad}</div>
        <div><span class="text-on-surface-variant">Línea:</span> ${b.linea_nombre||'—'}</div>
        <div><span class="text-on-surface-variant">Parqueo:</span> ${b.parqueo_nombre||'—'}</div>
        <div><span class="text-on-surface-variant">Piloto:</span> ${b.piloto_nombre||'—'}</div>
      </div>
      <div class="flex gap-2">
        <button onclick="modalEditarBus(${b.id})" class="flex-1 text-center text-label-sm text-secondary hover:text-primary py-2 rounded border border-outline-variant/30">Editar</button>
        <button onclick="eliminarBus(${b.id})" class="text-label-sm text-error px-4 py-2 rounded border border-error/30">Eliminar</button>
      </div>
    </div>`).join('')}
  </div>`;
}

function formBusHTML(b={}) {
  const optsLinea = `<option value="">Sin asignar</option>${_lineasBus.map(l=>`<option value="${l.id}" ${b.id_linea===l.id?'selected':''}>${l.nombre}</option>`).join('')}`;
  const optsParqueo = _parqueos.map(p=>`<option value="${p.id}" ${b.id_parqueo===p.id?'selected':''}>${p.nombre}</option>`).join('');
  const optsEstado = ['Activo','Mantenimiento','Inactivo'].map(s=>`<option ${s===b.estado?'selected':''}>${s}</option>`).join('');
  return `
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-sm font-semibold block mb-1">Código *</label>
        <input name="codigo" value="${b.codigo||''}" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required placeholder="TM-001"/></div>
      <div><label class="text-sm font-semibold block mb-1">Placa *</label>
        <input name="placa" value="${b.placa||''}" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required placeholder="C-000XXX"/></div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-sm font-semibold block mb-1">Capacidad *</label>
        <input name="capacidad" type="number" min="1" value="${b.capacidad||100}" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div><label class="text-sm font-semibold block mb-1">Estado</label>
        <select name="estado" class="w-full border border-outline-variant rounded-lg px-3 py-2">${optsEstado}</select></div>
    </div>
    <div><label class="text-sm font-semibold block mb-1">Línea asignada</label>
      <select name="id_linea" class="w-full border border-outline-variant rounded-lg px-3 py-2">${optsLinea}</select></div>
    <div><label class="text-sm font-semibold block mb-1">Parqueo * <span class="text-xs font-normal text-on-surface-variant">(RN-04: obligatorio)</span></label>
      <select name="id_parqueo" class="w-full border border-outline-variant rounded-lg px-3 py-2" required>${optsParqueo}</select></div>
  </div>`;
}

function modalNuevoBus() {
  abrirModal('Nueva unidad', `
  <form onsubmit="guardarBus(event)">
    ${formBusHTML()}
    <div class="flex gap-2 justify-end pt-4 mt-2 border-t border-outline-variant/20">
      <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface">Cancelar</button>
      <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white">Guardar</button>
    </div>
  </form>`);
}

async function guardarBus(e) {
  e.preventDefault();
  const f = e.target;
  const body = { codigo: f.codigo.value, placa: f.placa.value, capacidad: parseInt(f.capacidad.value), estado: f.estado.value, id_linea: f.id_linea.value||null, id_parqueo: parseInt(f.id_parqueo.value) };
  try { await api.post('/api/buses', body); cerrarModal(); toast('Bus registrado.'); cargarFlota(); } catch(err){ toast(err.message,'error'); }
}

async function modalEditarBus(id) {
  const b = _buses.find(x=>x.id===id)||{};
  abrirModal('Editar bus', `
  <form onsubmit="actualizarBus(event,${id})">
    ${formBusHTML(b)}
    <div class="flex gap-2 justify-end pt-4 mt-2 border-t border-outline-variant/20">
      <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface">Cancelar</button>
      <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white">Guardar cambios</button>
    </div>
  </form>`);
}

async function actualizarBus(e, id) {
  e.preventDefault();
  const f = e.target;
  const body = { codigo: f.codigo.value, placa: f.placa.value, capacidad: parseInt(f.capacidad.value), estado: f.estado.value, id_linea: f.id_linea.value||null, id_parqueo: parseInt(f.id_parqueo.value) };
  try { await api.put(`/api/buses/${id}`, body); cerrarModal(); toast('Bus actualizado.'); cargarFlota(); } catch(err){ toast(err.message,'error'); }
}

async function eliminarBus(id) {
  const b = _buses.find(x=>x.id===id);
  if (!confirm(`¿Eliminar el bus "${b?.codigo}"?`)) return;
  try { await api.delete(`/api/buses/${id}`); toast('Bus eliminado.'); cargarFlota(); } catch(err){ toast(err.message,'error'); }
}
