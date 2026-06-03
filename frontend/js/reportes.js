// Módulo Reportes — Estaciones, Líneas y buses asignados por línea
let _reporteTab = 'estaciones';

async function cargarReportes() {
  const el = document.getElementById('view-reportes');
  el.innerHTML = `<div class="flex items-center justify-center h-48 text-on-surface-variant"><span class="material-symbols-outlined mr-2">refresh</span>Cargando...</div>`;
  try {
    const [resumen, ocupacion, lineas, flota, busesPorLinea] = await Promise.all([
      api('/api/reportes/resumen'),
      api('/api/reportes/ocupacion-por-estacion'),
      api('/api/reportes/estado-lineas'),
      api('/api/reportes/estado-flota'),
      api('/api/reportes/buses-por-linea')
    ]);
    renderReportes(resumen, ocupacion, lineas, flota, busesPorLinea);
  } catch(e) { el.innerHTML = `<p class="text-error p-4">${e.message}</p>`; }
}

function renderReportes(resumen, ocupacion, lineas, flota, busesPorLinea) {
  const el = document.getElementById('view-reportes');
  el.innerHTML = `
  <div class="flex justify-between items-center mb-lg flex-wrap gap-3">
    <div>
      <h1 class="text-headline-lg text-on-surface mb-xs">Reportes Operativos</h1>
      <p class="text-body-lg text-on-surface-variant">Estaciones, líneas y buses asignados.</p>
    </div>
    <button onclick="exportarPDF()" class="bg-primary-container hover:bg-primary text-white text-label-lg px-6 py-3 rounded-full flex items-center gap-2 shadow-sm">
      <span class="material-symbols-outlined">picture_as_pdf</span>Exportar PDF
    </button>
  </div>

  <!-- Tabs -->
  <div class="flex border-b border-outline-variant/30 mb-lg overflow-x-auto">
    ${[['estaciones','Estaciones'],['lineas','Líneas'],['buses-linea','Buses por línea'],['flota','Flota']].map(([k,v])=>`
    <button onclick="cambiarTabReporte('${k}')" class="px-5 py-3 text-label-lg whitespace-nowrap border-b-2 transition-colors ${_reporteTab===k?'text-primary border-primary font-bold':'text-on-surface-variant border-transparent hover:bg-surface-container-high rounded-t-lg'}">${v}</button>`).join('')}
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

  <!-- Contenido del tab activo -->
  <div id="reporteContenido" class="glass-card p-lg rounded-xl">
    ${renderTabReporte(_reporteTab, ocupacion, lineas, flota, busesPorLinea)}
  </div>`;
}

function renderTabReporte(tab, ocupacion, lineas, flota, busesPorLinea) {

  // ── TAB ESTACIONES ──────────────────────────────────────────────
  if (tab === 'estaciones') {
    const max = Math.max(...ocupacion.map(e => e.porcentaje), 1);
    return `
    <div class="flex justify-between items-center mb-md flex-wrap gap-2">
      <h3 class="text-headline-md text-on-surface">Ocupación por estación</h3>
      <div class="flex gap-md flex-wrap text-label-sm">
        <div class="flex items-center gap-1"><div class="w-3 h-3 rounded-full bg-primary"></div>Normal (&lt;100%)</div>
        <div class="flex items-center gap-1"><div class="w-3 h-3 rounded-full bg-yellow-500"></div>Elevada</div>
        <div class="flex items-center gap-1"><div class="w-3 h-3 rounded-full bg-error"></div>Saturada (≥150%)</div>
      </div>
    </div>
    <!-- Gráfica de barras -->
    <div class="overflow-x-auto">
      <div class="flex items-end gap-2 h-48 pt-4 border-b border-outline-variant/30 pb-2" style="min-width:${ocupacion.length * 70}px">
        ${ocupacion.map(e => {
          const h = Math.round((e.porcentaje / Math.max(max,1)) * 100);
          const color = e.porcentaje >= 150 ? 'bg-error' : e.porcentaje >= 100 ? 'bg-yellow-500' : 'bg-primary';
          return `
          <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-[60px]">
            <span class="text-[10px] font-bold ${e.porcentaje>=150?'text-error':e.porcentaje>=100?'text-yellow-700':''}">${e.porcentaje.toFixed(0)}%</span>
            <div class="w-full ${color} rounded-t" style="height:${Math.max(h,3)}%"></div>
          </div>`;
        }).join('')}
      </div>
      <div class="flex mt-2" style="min-width:${ocupacion.length * 70}px">
        ${ocupacion.map(e=>`<div class="flex-1 text-center text-[10px] text-on-surface-variant min-w-[60px] px-1 truncate" title="${e.estacion}">${e.estacion.split(' ').slice(-1)[0]}</div>`).join('')}
      </div>
    </div>
    <!-- Tabla detallada -->
    <div class="mt-lg overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead><tr class="border-b border-outline-variant/30 bg-surface-container-low/50">
          <th class="py-2 px-3 text-on-surface-variant font-semibold">Estación</th>
          <th class="py-2 px-3 text-on-surface-variant font-semibold text-right">Pasajeros</th>
          <th class="py-2 px-3 text-on-surface-variant font-semibold text-right">Ocupación</th>
          <th class="py-2 px-3 text-on-surface-variant font-semibold text-right">Estado</th>
        </tr></thead>
        <tbody class="divide-y divide-outline-variant/20">
          ${ocupacion.map(e=>`
          <tr class="hover:bg-surface-container-highest/20">
            <td class="py-2 px-3 font-medium text-on-surface">${e.estacion}</td>
            <td class="py-2 px-3 text-right text-on-surface">${e.pasajeros}</td>
            <td class="py-2 px-3 text-right font-bold ${e.porcentaje>=150?'text-error':e.porcentaje>=100?'text-yellow-700':'text-primary'}">${e.porcentaje.toFixed(1)}%</td>
            <td class="py-2 px-3 text-right">
              <span class="px-2 py-0.5 rounded-full text-xs border ${e.porcentaje>=150?'bg-error/10 text-error border-error/20':e.porcentaje>=100?'bg-yellow-100 text-yellow-800 border-yellow-300/50':'bg-primary/10 text-primary border-primary/20'}">
                ${e.porcentaje>=150?'Saturada':e.porcentaje>=100?'Elevada':e.porcentaje>0?'Normal':'Sin datos'}
              </span>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }

  // ── TAB LÍNEAS ──────────────────────────────────────────────────
  if (tab === 'lineas') {
    return `
    <h3 class="text-headline-md text-on-surface mb-md">Estado de líneas</h3>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead><tr class="border-b border-outline-variant/30 bg-surface-container-low/50">
          <th class="py-3 px-4 text-on-surface-variant font-semibold">Código</th>
          <th class="py-3 px-4 text-on-surface-variant font-semibold">Línea</th>
          <th class="py-3 px-4 text-on-surface-variant font-semibold">Estado</th>
          <th class="py-3 px-4 text-on-surface-variant font-semibold text-center">Estaciones</th>
          <th class="py-3 px-4 text-on-surface-variant font-semibold text-center">Buses</th>
          <th class="py-3 px-4 text-on-surface-variant font-semibold text-right">Distancia</th>
        </tr></thead>
        <tbody class="divide-y divide-outline-variant/20">
          ${lineas.map(l=>`
          <tr class="hover:bg-surface-container-highest/20">
            <td class="py-3 px-4 font-mono font-bold text-secondary">${l.codigo}</td>
            <td class="py-3 px-4 font-semibold text-on-surface">${l.nombre}</td>
            <td class="py-3 px-4"><span class="${colorEstado(l.estado)} border text-xs px-2 py-0.5 rounded-full">${l.estado}</span></td>
            <td class="py-3 px-4 text-center text-on-surface">${l.num_estaciones}</td>
            <td class="py-3 px-4 text-center text-on-surface font-bold">${l.num_buses}</td>
            <td class="py-3 px-4 text-right text-on-surface">${l.distancia_total} km</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }

  // ── TAB BUSES POR LÍNEA (punto 15) ─────────────────────────────
  if (tab === 'buses-linea') {
    return `
    <h3 class="text-headline-md text-on-surface mb-xs">Buses asignados por línea</h3>
    <p class="text-body-md text-on-surface-variant mb-lg">Detalle completo de cada unidad por línea de servicio.</p>
    <div class="flex flex-col gap-lg">
      ${busesPorLinea.map(l => `
      <div>
        <!-- Encabezado de la línea -->
        <div class="flex items-center justify-between mb-3 pb-2 border-b-2 border-primary/20">
          <div class="flex items-center gap-3">
            <span class="font-mono font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full text-sm">${l.codigo}</span>
            <h4 class="text-headline-sm text-on-surface">${l.nombre}</h4>
            <span class="${colorEstado(l.estado)} border text-xs px-2 py-0.5 rounded-full">${l.estado}</span>
          </div>
          <div class="flex items-center gap-4 text-sm text-on-surface-variant">
            <span><strong class="text-on-surface">${l.total_estaciones}</strong> estaciones</span>
            <span><strong class="text-primary">${l.total_buses}</strong> buses</span>
            <span><strong class="text-on-surface">${l.distancia_total}</strong> km</span>
          </div>
        </div>
        <!-- Tabla de buses de esta línea -->
        ${l.buses.length > 0 ? `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm mb-2">
            <thead><tr class="bg-surface-container-low/70">
              <th class="py-2 px-3 text-on-surface-variant font-semibold">Código</th>
              <th class="py-2 px-3 text-on-surface-variant font-semibold">Placa</th>
              <th class="py-2 px-3 text-on-surface-variant font-semibold text-center">Capacidad</th>
              <th class="py-2 px-3 text-on-surface-variant font-semibold">Parqueo</th>
              <th class="py-2 px-3 text-on-surface-variant font-semibold">Piloto</th>
              <th class="py-2 px-3 text-on-surface-variant font-semibold text-center">Estado</th>
            </tr></thead>
            <tbody class="divide-y divide-outline-variant/20">
              ${l.buses.map(b=>`
              <tr class="hover:bg-surface-container-highest/20">
                <td class="py-2 px-3 font-bold text-on-surface">${b.codigo}</td>
                <td class="py-2 px-3 font-mono text-secondary text-xs">${b.placa}</td>
                <td class="py-2 px-3 text-center text-on-surface">${b.capacidad}</td>
                <td class="py-2 px-3 text-on-surface-variant text-xs">${b.parqueo||'—'}</td>
                <td class="py-2 px-3 text-on-surface-variant text-xs">${b.piloto||'<em>Sin piloto</em>'}</td>
                <td class="py-2 px-3 text-center">
                  <span class="${colorEstado(b.estado)} border text-xs px-2 py-0.5 rounded-full">${b.estado}</span>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : `<p class="text-on-surface-variant text-sm italic py-2">Sin buses asignados.</p>`}
      </div>`).join('')}
    </div>`;
  }

  // ── TAB FLOTA ───────────────────────────────────────────────────
  if (tab === 'flota') {
    const items = [
      { label:'Activos',        val:flota.activos,        color:'bg-primary',   pct:Math.round(flota.activos/Math.max(flota.total,1)*100) },
      { label:'Mantenimiento',  val:flota.mantenimiento,  color:'bg-yellow-500',pct:Math.round(flota.mantenimiento/Math.max(flota.total,1)*100) },
      { label:'Inactivos',      val:flota.inactivos,      color:'bg-outline',   pct:Math.round(flota.inactivos/Math.max(flota.total,1)*100) }
    ];
    return `
    <h3 class="text-headline-md text-on-surface mb-md">Estado general de la flota — ${flota.total} unidades totales</h3>
    <div class="flex flex-col gap-5">
      ${items.map(item=>`
      <div>
        <div class="flex justify-between mb-1">
          <span class="text-label-lg text-on-surface font-semibold">${item.label}</span>
          <span class="text-label-lg font-bold text-on-surface">${item.val} unidades (${item.pct}%)</span>
        </div>
        <div class="w-full h-7 bg-surface-variant rounded-full overflow-hidden">
          <div class="${item.color} h-full rounded-full transition-all flex items-center justify-end pr-3" style="width:${Math.max(item.pct,3)}%">
            ${item.pct > 8 ? `<span class="text-white text-xs font-bold">${item.pct}%</span>` : ''}
          </div>
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
  toast('Generando PDF...', 'info');
}
