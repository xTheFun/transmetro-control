// Módulo Reportes — gráficas y exportación a PDF
let _reporteTab = 'estaciones';

async function cargarReportes() {
  const el = document.getElementById('view-reportes');
  el.innerHTML = `<div class="flex items-center justify-center h-48 text-on-surface-variant"><span class="material-symbols-outlined mr-2">refresh</span>Cargando...</div>`;
  try {
    const [resumen, ocupacion, lineas, flota] = await Promise.all([
      api('/api/reportes/resumen'),
      api('/api/reportes/ocupacion-por-estacion'),
      api('/api/reportes/estado-lineas'),
      api('/api/reportes/estado-flota')
    ]);
    renderReportes(resumen, ocupacion, lineas, flota);
  } catch(e) { el.innerHTML = `<p class="text-error p-4">${e.message}</p>`; }
}

function renderReportes(resumen, ocupacion, lineas, flota) {
  const el = document.getElementById('view-reportes');
  el.innerHTML = `
  <div class="flex justify-between items-center mb-lg flex-wrap gap-3">
    <div>
      <h1 class="text-headline-lg text-on-surface mb-xs">Reportes Operativos</h1>
      <p class="text-body-lg text-on-surface-variant">Resumen del estado actual del sistema Transmetro.</p>
    </div>
    <button onclick="exportarPDF()" class="bg-primary-container hover:bg-primary text-white text-label-lg px-6 py-3 rounded-full flex items-center gap-2 shadow-sm">
      <span class="material-symbols-outlined">picture_as_pdf</span>Exportar PDF
    </button>
  </div>

  <!-- Tabs -->
  <div class="flex border-b border-outline-variant/30 mb-lg overflow-x-auto">
    ${[['estaciones','Estaciones'],['lineas','Líneas'],['flota','Flota']].map(([k,v])=>`
    <button onclick="cambiarTabReporte('${k}')" class="px-6 py-3 text-label-lg whitespace-nowrap border-b-2 transition-colors ${_reporteTab===k?'text-primary border-primary font-bold':'text-on-surface-variant border-transparent hover:bg-surface-container-high rounded-t-lg'}">${v}</button>`).join('')}
  </div>

  <!-- Métricas resumen -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
    <div class="glass-card p-md rounded-xl flex flex-col justify-between">
      <div><h3 class="text-headline-md text-on-surface mb-1">Alertas hoy</h3><p class="text-body-md text-on-surface-variant">Saturación + baja ocupación</p></div>
      <div class="mt-md flex items-end justify-between"><span class="text-display-num text-error">${resumen.alertas_hoy}</span><span class="material-symbols-outlined text-error opacity-20" style="font-size:48px">warning</span></div>
    </div>
    <div class="glass-card p-md rounded-xl flex flex-col justify-between">
      <div><h3 class="text-headline-md text-on-surface mb-1">Buses en operación</h3><p class="text-body-md text-on-surface-variant">Flota activa actual</p></div>
      <div class="mt-md flex items-end justify-between"><span class="text-display-num text-primary">${resumen.buses_en_operacion}</span><span class="material-symbols-outlined text-primary opacity-20" style="font-size:48px">directions_bus</span></div>
    </div>
    <div class="glass-card p-md rounded-xl flex flex-col justify-between">
      <div><h3 class="text-headline-md text-on-surface mb-1">Ocupación promedio</h3><p class="text-body-md text-on-surface-variant">Todas las líneas</p></div>
      <div class="mt-md flex items-end justify-between"><span class="text-display-num text-on-surface">${resumen.ocupacion_promedio}%</span><span class="material-symbols-outlined text-on-surface opacity-20" style="font-size:48px">groups</span></div>
    </div>
  </div>

  <!-- Contenido de tab -->
  <div class="glass-card p-lg rounded-xl" id="reporteContenido">
    ${renderTabReporte(_reporteTab, ocupacion, lineas, flota)}
  </div>`;
}

function renderTabReporte(tab, ocupacion, lineas, flota) {
  if (tab === 'estaciones') {
    const max = Math.max(...ocupacion.map(e=>e.porcentaje), 1);
    return `
    <div class="flex justify-between items-center mb-md flex-wrap gap-2">
      <h3 class="text-headline-md text-on-surface">Ocupación por estación</h3>
      <div class="flex gap-md flex-wrap">
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-primary"></div><span class="text-label-sm">Normal (&lt;100%)</span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-yellow-500"></div><span class="text-label-sm">Elevada (100-149%)</span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-error"></div><span class="text-label-sm">Saturada (≥150%)</span></div>
      </div>
    </div>
    <div class="overflow-x-auto">
      <div class="flex items-end gap-3 h-64 pt-6 border-b border-outline-variant/30 pb-2 min-w-max md:min-w-0">
        ${ocupacion.map(e=>{
          const h = Math.round((e.porcentaje/Math.max(max,1))*100);
          const color = e.porcentaje>=150?'bg-error':e.porcentaje>=100?'bg-yellow-500':'bg-primary';
          return `
          <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-[60px]">
            <span class="text-label-sm font-bold ${e.porcentaje>=150?'text-error':e.porcentaje>=100?'text-yellow-700':''}">${e.porcentaje.toFixed(0)}%</span>
            <div class="w-full ${color} rounded-t" style="height:${Math.max(h,4)}%"></div>
          </div>`;
        }).join('')}
      </div>
      <div class="flex justify-between mt-3 overflow-x-auto">
        ${ocupacion.map(e=>`<span class="flex-1 text-center text-label-sm text-on-surface-variant min-w-[60px] px-1">${e.estacion}</span>`).join('')}
      </div>
    </div>`;
  }

  if (tab === 'lineas') {
    return `
    <h3 class="text-headline-md text-on-surface mb-md">Estado de líneas</h3>
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead><tr class="border-b border-outline-variant/30 bg-surface-container-low/50">
          <th class="py-3 px-4 text-label-lg text-on-surface-variant">Línea</th>
          <th class="py-3 px-4 text-label-lg text-on-surface-variant">Estado</th>
          <th class="py-3 px-4 text-label-lg text-on-surface-variant">Buses</th>
          <th class="py-3 px-4 text-label-lg text-on-surface-variant">Estaciones</th>
          <th class="py-3 px-4 text-label-lg text-on-surface-variant">Distancia</th>
        </tr></thead>
        <tbody class="divide-y divide-outline-variant/20">
          ${lineas.map(l=>`
          <tr class="hover:bg-surface-container-highest/20">
            <td class="py-3 px-4 font-bold text-on-surface">${l.nombre}</td>
            <td class="py-3 px-4"><span class="${colorEstado(l.estado)} border text-label-sm px-2 py-0.5 rounded-full">${l.estado}</span></td>
            <td class="py-3 px-4 text-on-surface">${l.num_buses}</td>
            <td class="py-3 px-4 text-on-surface">${l.num_estaciones}</td>
            <td class="py-3 px-4 text-on-surface">${l.distancia_total} km</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }

  if (tab === 'flota') {
    const items = [
      { label: 'Activos', val: flota.activos, color: 'bg-primary', pct: Math.round(flota.activos/Math.max(flota.total,1)*100) },
      { label: 'Mantenimiento', val: flota.mantenimiento, color: 'bg-yellow-500', pct: Math.round(flota.mantenimiento/Math.max(flota.total,1)*100) },
      { label: 'Inactivos', val: flota.inactivos, color: 'bg-outline', pct: Math.round(flota.inactivos/Math.max(flota.total,1)*100) }
    ];
    return `
    <h3 class="text-headline-md text-on-surface mb-md">Estado de flota — ${flota.total} unidades</h3>
    <div class="flex flex-col gap-4">
      ${items.map(item=>`
      <div>
        <div class="flex justify-between mb-1">
          <span class="text-label-lg text-on-surface">${item.label}</span>
          <span class="text-label-lg font-bold text-on-surface">${item.val} (${item.pct}%)</span>
        </div>
        <div class="w-full h-6 bg-surface-variant rounded-full overflow-hidden">
          <div class="${item.color} h-full rounded-full transition-all" style="width:${item.pct}%"></div>
        </div>
      </div>`).join('')}
    </div>`;
  }
  return '';
}

function cambiarTabReporte(tab) {
  _reporteTab = tab;
  cargarReportes();
}

function exportarPDF() {
  window.print();
  toast('Imprimiendo/exportando como PDF...', 'info');
}
