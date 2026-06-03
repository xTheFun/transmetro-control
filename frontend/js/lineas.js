// Módulo Líneas y Rutas — CRUD + detalle de recorrido
let _lineas = [];

async function cargarLineas() {
  const el = document.getElementById('view-lineas');
  el.innerHTML = `<div class="flex items-center justify-center h-48 text-on-surface-variant"><span class="material-symbols-outlined mr-2">refresh</span>Cargando...</div>`;
  try {
    _lineas = await api('/api/lineas');
    renderLineas();
  } catch(e) { el.innerHTML = `<p class="text-error p-4">${e.message}</p>`; }
}

function renderLineas(selId) {
  const el = document.getElementById('view-lineas');
  const colores = ['bg-error','bg-secondary','bg-primary','bg-yellow-500'];
  const selLinea = selId ? _lineas.find(l=>l.id===selId) : _lineas[0];

  el.innerHTML = `
  <div class="flex justify-between items-end mb-lg flex-wrap gap-3">
    <div>
      <h1 class="text-headline-lg text-on-surface mb-xs">Líneas y Rutas</h1>
      <p class="text-body-md text-on-surface-variant">Gestión y monitoreo de los ejes principales del sistema.</p>
    </div>
    <button onclick="modalNuevaLinea()" class="bg-primary text-white text-label-lg px-6 py-3 rounded-full flex items-center gap-2 hover:bg-primary-container transition-colors shadow-sm">
      <span class="material-symbols-outlined">add</span>Nueva línea
    </button>
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-lg">
    <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-md">
      ${_lineas.map((l,i)=>`
      <div onclick="verDetalleLinea(${l.id})" class="glass-card rounded-xl p-lg relative overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform border-l-4 border-l-${['error','secondary','primary','yellow-500'][i%4]}">
        <div class="absolute top-0 right-0 p-md flex gap-2">
          <span class="${colorEstado(l.estado)} border text-label-sm px-3 py-1 rounded-full">${l.estado}</span>
        </div>
        <div class="flex items-center gap-3 mb-md mt-2">
          <div class="w-12 h-12 rounded-full ${colores[i%4]} text-white flex items-center justify-center"><span class="material-symbols-outlined">route</span></div>
          <div><h3 class="text-headline-md text-on-surface">${l.nombre}</h3><p class="text-label-sm text-on-surface-variant">CÓDIGO: ${l.codigo}</p></div>
        </div>
        <div class="grid grid-cols-2 gap-md mt-md">
          <div><p class="text-label-sm text-on-surface-variant mb-1">Distancia total</p><p class="text-headline-sm text-on-surface">${l.distancia_total} km</p></div>
          <div><p class="text-label-sm text-on-surface-variant mb-1">Municipalidad</p><p class="text-headline-sm text-on-surface text-sm">${l.municipalidad||'—'}</p></div>
        </div>
        <div class="mt-md pt-md border-t border-outline-variant/30 flex justify-between items-center">
          <div class="flex gap-2">
            <button onclick="event.stopPropagation();modalEditarLinea(${l.id})" class="text-label-sm text-secondary hover:text-primary px-2 py-1 rounded hover:bg-surface-container-low">Editar</button>
            <button onclick="event.stopPropagation();eliminarLinea(${l.id})" class="text-label-sm text-error hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">Eliminar</button>
          </div>
          <span class="text-primary text-label-sm flex items-center gap-1">Ver ruta <span class="material-symbols-outlined" style="font-size:16px">arrow_forward</span></span>
        </div>
      </div>`).join('')}
    </div>

    <!-- Panel de detalle de recorrido -->
    <div class="lg:col-span-4" id="panelDetalleLinea">
      <div class="glass-card rounded-xl p-lg h-full">
        <p class="text-on-surface-variant text-center py-8">Selecciona una línea para ver su recorrido</p>
      </div>
    </div>
  </div>`;

  if (selLinea) verDetalleLinea(selLinea.id);
}

async function verDetalleLinea(id) {
  const panel = document.getElementById('panelDetalleLinea');
  if (!panel) return;
  panel.innerHTML = `<div class="glass-card rounded-xl p-lg h-full flex items-center justify-center"><span class="material-symbols-outlined animate-spin">refresh</span></div>`;
  try {
    const l = await api(`/api/lineas/${id}`);
    panel.innerHTML = `
    <div class="glass-card rounded-xl p-lg h-full">
      <div class="flex items-center justify-between mb-md">
        <h3 class="text-headline-sm text-on-surface">Detalle: ${l.nombre}</h3>
      </div>
      <div class="relative">
        <div class="absolute left-[19px] top-4 bottom-4 w-0.5 bg-outline-variant/50 z-0"></div>
        <ul class="flex flex-col gap-md relative z-10">
          ${l.estaciones.map((e,i)=>`
          <li class="flex gap-4">
            <div class="w-10 h-10 rounded-full ${i===0?'bg-primary text-white':'bg-surface text-on-surface border-2 border-primary'} flex items-center justify-center text-label-lg font-bold border-4 ${i===0?'border-surface':''} shadow-sm shrink-0">${e.orden}</div>
            <div class="flex-1">
              <h4 class="text-label-lg text-on-surface">${e.estacion_nombre}</h4>
              ${i===0?'<p class="text-label-sm text-on-surface-variant">Inicio de ruta</p>':''}
            </div>
          </li>
          ${i < l.estaciones.length-1 ? `
          <li class="flex gap-4 -mt-2 mb-1">
            <div class="w-10 flex justify-center"></div>
            <div class="bg-surface-container-low px-3 py-1 rounded text-label-sm text-on-surface-variant flex items-center gap-1 border border-outline-variant/30">
              <span class="material-symbols-outlined" style="font-size:14px">straighten</span>${l.estaciones[i+1]?.distancia_tramo||0} km
            </div>
          </li>`:''}
          `).join('')}
        </ul>
      </div>
      ${l.estaciones.length===0?'<p class="text-on-surface-variant text-center py-4">Sin estaciones en esta ruta.</p>':''}
    </div>`;
  } catch(e) {
    panel.innerHTML = `<div class="glass-card rounded-xl p-lg"><p class="text-error">${e.message}</p></div>`;
  }
}

function modalNuevaLinea() {
  abrirModal('Nueva línea', `
  <form onsubmit="guardarLinea(event)">
    <div class="flex flex-col gap-4">
      <div><label class="text-sm font-semibold text-on-surface block mb-1">Nombre *</label>
        <input name="nombre" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required maxlength="100"/></div>
      <div><label class="text-sm font-semibold text-on-surface block mb-1">Código *</label>
        <input name="codigo" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required maxlength="20" placeholder="Ej: L-VER"/></div>
      <div><label class="text-sm font-semibold text-on-surface block mb-1">Distancia total (km)</label>
        <input name="distancia_total" type="number" step="0.1" min="0" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary"/></div>
      <div><label class="text-sm font-semibold text-on-surface block mb-1">Estado</label>
        <select name="estado" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary">
          <option>Activa</option><option>Inactiva</option><option>Saturada</option>
        </select></div>
      <div class="flex gap-2 justify-end pt-2">
        <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container">Cancelar</button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-container">Guardar</button>
      </div>
    </div>
  </form>`);
}

async function guardarLinea(e) {
  e.preventDefault();
  const f = e.target;
  const body = { nombre: f.nombre.value, codigo: f.codigo.value, distancia_total: parseFloat(f.distancia_total.value)||0, estado: f.estado.value };
  try { await api.post('/api/lineas', body); cerrarModal(); toast('Línea creada.'); cargarLineas(); } catch(err){ toast(err.message,'error'); }
}

async function modalEditarLinea(id) {
  const l = await api(`/api/lineas/${id}`);
  abrirModal('Editar línea', `
  <form onsubmit="actualizarLinea(event,${id})">
    <div class="flex flex-col gap-4">
      <div><label class="text-sm font-semibold text-on-surface block mb-1">Nombre *</label>
        <input name="nombre" value="${l.nombre}" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div><label class="text-sm font-semibold text-on-surface block mb-1">Código *</label>
        <input name="codigo" value="${l.codigo}" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary" required/></div>
      <div><label class="text-sm font-semibold text-on-surface block mb-1">Distancia total (km)</label>
        <input name="distancia_total" type="number" step="0.1" value="${l.distancia_total}" class="w-full border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary"/></div>
      <div><label class="text-sm font-semibold text-on-surface block mb-1">Estado</label>
        <select name="estado" class="w-full border border-outline-variant rounded-lg px-3 py-2">
          ${['Activa','Inactiva','Saturada'].map(s=>`<option ${s===l.estado?'selected':''}>${s}</option>`).join('')}
        </select></div>
      <div class="flex gap-2 justify-end pt-2">
        <button type="button" onclick="cerrarModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container">Cancelar</button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-container">Guardar cambios</button>
      </div>
    </div>
  </form>`);
}

async function actualizarLinea(e, id) {
  e.preventDefault();
  const f = e.target;
  const body = { nombre: f.nombre.value, codigo: f.codigo.value, distancia_total: parseFloat(f.distancia_total.value)||0, estado: f.estado.value };
  try { await api.put(`/api/lineas/${id}`, body); cerrarModal(); toast('Línea actualizada.'); cargarLineas(); } catch(err){ toast(err.message,'error'); }
}

async function eliminarLinea(id) {
  const l = _lineas.find(x=>x.id===id);
  if (!confirm(`¿Eliminar la línea "${l?.nombre}"? Esta acción no se puede deshacer.`)) return;
  try { await api.delete(`/api/lineas/${id}`); toast('Línea eliminada.'); cargarLineas(); } catch(e){ toast(e.message,'error'); }
}
