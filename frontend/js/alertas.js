// Módulo Alertas — pendientes y atendidas
let _alertasFiltro = 'pendiente';

async function cargarAlertas() {
  const el = document.getElementById('view-alertas');
  el.innerHTML = `<div class="flex items-center justify-center h-48 text-on-surface-variant"><span class="material-symbols-outlined mr-2">refresh</span>Cargando...</div>`;
  try {
    const [pendientes, atendidas] = await Promise.all([
      api('/api/alertas?estado=pendiente'),
      api('/api/alertas?estado=atendida')
    ]);
    renderAlertas(pendientes, atendidas);
  } catch(e) { el.innerHTML = `<p class="text-error p-4">${e.message}</p>`; }
}

function renderAlertas(pendientes, atendidas) {
  const el = document.getElementById('view-alertas');
  const lista = _alertasFiltro === 'pendiente' ? pendientes : atendidas;

  el.innerHTML = `
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
    <div>
      <h1 class="text-headline-lg text-on-surface mb-xs">Gestión de Alertas</h1>
      <p class="text-body-lg text-on-surface-variant">Monitoreo de saturación y baja ocupación en tiempo real.</p>
    </div>
    <div class="flex border-b border-outline-variant/30 gap-md">
      <button onclick="cambiarFiltroAlertas('pendiente',${JSON.stringify(pendientes).replace(/"/g,'&quot;')},${JSON.stringify(atendidas).replace(/"/g,'&quot;')})"
        class="pb-sm px-xs text-label-lg border-b-2 ${_alertasFiltro==='pendiente'?'text-primary border-primary font-bold':'text-on-surface-variant border-transparent hover:border-outline-variant/50'}">
        Pendientes (${pendientes.length})
      </button>
      <button onclick="cambiarFiltroAlertas('atendida',${JSON.stringify(pendientes).replace(/"/g,'&quot;')},${JSON.stringify(atendidas).replace(/"/g,'&quot;')})"
        class="pb-sm px-xs text-label-lg border-b-2 ${_alertasFiltro==='atendida'?'text-primary border-primary font-bold':'text-on-surface-variant border-transparent hover:border-outline-variant/50'}">
        Atendidas (${atendidas.length})
      </button>
    </div>
  </div>

  ${lista.length === 0 ? `
  <div class="glass-card rounded-xl p-lg text-center">
    <span class="material-symbols-outlined text-4xl text-primary opacity-30">check_circle</span>
    <p class="text-on-surface-variant mt-2">${_alertasFiltro==='pendiente'?'No hay alertas pendientes ✓':'No hay alertas atendidas.'}</p>
  </div>` : `
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-md">
    ${lista.map(a => renderTarjetaAlerta(a)).join('')}
  </div>`}`;
}

function renderTarjetaAlerta(a) {
  const esSat = a.tipo === 'saturacion';
  return `
  <div class="glass-card rounded-xl p-md flex flex-col relative overflow-hidden">
    <div class="absolute left-0 top-0 bottom-0 w-1 ${esSat?'bg-error':'bg-yellow-500'}"></div>
    <div class="flex justify-between items-start mb-sm pl-xs flex-wrap gap-2">
      <div class="flex items-center gap-sm flex-wrap">
        <div class="${esSat?'bg-error/10 text-error':'bg-yellow-100 text-yellow-800'} px-3 py-1 rounded-full text-label-sm flex items-center gap-1">
          <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">${esSat?'error':'timer'}</span>
          ${esSat?'Saturación':'Baja ocupación'}
        </div>
        <span class="text-label-sm text-on-surface-variant flex items-center gap-1">
          <span class="material-symbols-outlined text-[16px]">schedule</span>${tiempoRelativo(a.fecha_hora)}
        </span>
      </div>
      ${a.estado==='pendiente' ? `
      <div class="flex gap-sm">
        <button onclick="accionAlerta(${a.id},'atender')" class="bg-primary text-white text-label-lg px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-1 hover:bg-primary-container">
          <span class="material-symbols-outlined text-[18px]">check_circle</span>Atender
        </button>
        ${esSat?`<button onclick="accionAlerta(${a.id},'apoyo')" class="bg-surface border border-primary/50 text-primary text-label-lg px-4 py-1.5 rounded-lg flex items-center gap-1 hover:bg-surface-container">
          <span class="material-symbols-outlined text-[18px]">support_agent</span>Apoyo
        </button>`:''}
      </div>` : `<span class="text-label-sm text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Atendida ✓</span>`}
    </div>

    <div class="pl-xs flex flex-col md:flex-row gap-md items-start">
      <div class="flex-1">
        <h3 class="text-headline-sm text-on-surface mb-xs">${esSat?'Saturación de pasajeros':'Baja ocupación — espera de 5 min'}</h3>
        <p class="text-body-md text-on-surface-variant mb-md">${esSat?'El bus ha superado el 150% de su capacidad.':'Bus por debajo del 25% de capacidad.'}</p>
        <div class="grid grid-cols-2 gap-sm">
          <div class="bg-surface-container-low p-sm rounded-lg border border-outline-variant/30">
            <span class="block text-label-sm text-on-surface-variant mb-1">Bus</span>
            <span class="text-headline-sm text-on-surface flex items-center gap-2"><span class="material-symbols-outlined text-secondary">directions_bus</span>${a.bus_codigo}</span>
          </div>
          <div class="bg-surface-container-low p-sm rounded-lg border border-outline-variant/30">
            <span class="block text-label-sm text-on-surface-variant mb-1">Estación</span>
            <span class="text-headline-sm text-on-surface flex items-center gap-2"><span class="material-symbols-outlined text-secondary">location_city</span>${a.estacion_nombre}</span>
          </div>
        </div>
      </div>
      <div class="${esSat?'bg-error/10':'bg-yellow-50 border border-yellow-200'} px-6 py-4 rounded-xl flex flex-col items-center justify-center">
        <span class="text-label-sm text-on-surface-variant mb-1">Ocupación</span>
        <span class="text-headline-lg ${esSat?'text-error':'text-yellow-700'} font-bold">${Number(a.porcentaje).toFixed(0)}%</span>
        ${a.capacidad?`<span class="text-label-sm text-on-surface-variant">${Math.round(a.capacidad*a.porcentaje/100)} / ${a.capacidad}</span>`:''}
      </div>
    </div>
  </div>`;
}

function cambiarFiltroAlertas(filtro, pendientes, atendidas) {
  _alertasFiltro = filtro;
  renderAlertas(pendientes, atendidas);
}

async function accionAlerta(id, accion) {
  try {
    await api.put(`/api/alertas/${id}/${accion==='apoyo'?'apoyo':'atender'}`);
    toast(accion==='apoyo'?'Apoyo enviado y alerta atendida.':'Alerta marcada como atendida.');
    cargarAlertas();
    actualizarBadgeAlertas();
  } catch(e) { toast(e.message, 'error'); }
}
