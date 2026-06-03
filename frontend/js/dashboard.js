// Módulo Dashboard — Panel principal con métricas y alertas recientes
async function cargarDashboard() {
  const el = document.getElementById('view-dashboard');
  el.innerHTML = `<div class="flex items-center justify-center h-48 text-on-surface-variant"><span class="material-symbols-outlined animate-spin mr-2">refresh</span>Cargando...</div>`;

  try {
    const d = await api('/api/dashboard');
    const m = d.metricas;

    el.innerHTML = `
    <div class="mb-lg">
      <h1 class="text-headline-lg text-on-surface mb-xs">Resumen Operativo</h1>
      <p class="text-body-md text-on-surface-variant">${new Date().toLocaleDateString('es-GT',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · monitoreo del sistema en tiempo real.</p>
    </div>

    <!-- Métricas -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-md mb-lg">
      <div class="glass-card rounded-xl p-md flex flex-col justify-between">
        <div class="flex justify-between items-start mb-sm">
          <span class="text-label-lg text-on-surface-variant">Buses activos</span>
          <span class="material-symbols-outlined text-primary bg-primary/10 rounded-full p-1" style="font-size:20px">directions_bus</span>
        </div>
        <div><span class="text-display-num text-on-surface">${m.buses_activos}</span><span class="text-body-lg text-on-surface-variant">/${m.total_buses}</span></div>
        <div class="mt-xs text-label-sm text-primary">${m.total_buses>0?Math.round(m.buses_activos/m.total_buses*100):0}% operatividad</div>
      </div>
      <div class="glass-card rounded-xl p-md flex flex-col justify-between">
        <div class="flex justify-between items-start mb-sm">
          <span class="text-label-lg text-on-surface-variant">Estaciones</span>
          <span class="material-symbols-outlined text-secondary bg-secondary-container/30 rounded-full p-1" style="font-size:20px">location_city</span>
        </div>
        <span class="text-display-num text-on-surface">${m.estaciones_operativas}</span>
        <div class="mt-xs text-label-sm text-primary">Operativas</div>
      </div>
      <div class="glass-card rounded-xl p-md flex flex-col justify-between">
        <div class="flex justify-between items-start mb-sm">
          <span class="text-label-lg text-on-surface-variant">Líneas activas</span>
          <span class="material-symbols-outlined text-secondary bg-secondary-container/30 rounded-full p-1" style="font-size:20px">route</span>
        </div>
        <span class="text-display-num text-on-surface">${m.lineas_activas}</span>
        <div class="mt-xs text-label-sm text-on-surface-variant">Servicio regular</div>
      </div>
      <div class="glass-card rounded-xl p-md flex flex-col justify-between ${m.alertas_pendientes>0?'bg-error-container/10 border-error/20':''}">
        <div class="flex justify-between items-start mb-sm">
          <span class="text-label-lg text-on-surface-variant">Alertas</span>
          <span class="material-symbols-outlined text-error bg-error-container/50 rounded-full p-1" style="font-size:20px">warning</span>
        </div>
        <span class="text-display-num ${m.alertas_pendientes>0?'text-error':'text-on-surface'}">${m.alertas_pendientes}</span>
        <div class="mt-xs text-label-sm ${m.alertas_pendientes>0?'text-error font-medium':'text-on-surface-variant'}">${m.alertas_pendientes>0?'Requieren atención':'Sin alertas'}</div>
      </div>
      <div class="glass-card rounded-xl p-md flex flex-col justify-between col-span-2 md:col-span-1">
        <div class="flex justify-between items-start mb-sm">
          <span class="text-label-lg text-on-surface-variant">Ocupación prom.</span>
          <span class="material-symbols-outlined text-primary bg-primary/10 rounded-full p-1" style="font-size:20px">groups</span>
        </div>
        <span class="text-display-num text-on-surface">${m.ocupacion_promedio}%</span>
        <div class="mt-xs w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
          <div class="h-full rounded-full ${m.ocupacion_promedio>=150?'bg-error':m.ocupacion_promedio>=80?'bg-yellow-500':'bg-primary'}" style="width:${Math.min(m.ocupacion_promedio,100)}%"></div>
        </div>
      </div>
    </div>

    <!-- Grid principal -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-lg">
      <!-- Alertas recientes -->
      <div class="lg:col-span-2 glass-card rounded-xl p-lg">
        <div class="flex justify-between items-center mb-md border-b border-outline-variant/30 pb-sm">
          <h3 class="text-headline-sm text-on-surface">Alertas recientes</h3>
          <button onclick="ir('alertas')" class="text-label-lg text-secondary hover:text-primary transition-colors">Ver todas</button>
        </div>
        <div class="flex flex-col gap-sm" id="alertasRecientes">
          ${d.alertas_recientes.length === 0
            ? '<p class="text-on-surface-variant text-body-md text-center py-4">Sin alertas pendientes ✓</p>'
            : d.alertas_recientes.map(a => `
            <div class="flex items-start gap-md p-sm ${a.tipo==='saturacion'?'bg-error-container/20 border border-error/20':'bg-yellow-50 border border-yellow-300/50'} rounded-lg">
              <div class="w-10 h-10 rounded-full ${a.tipo==='saturacion'?'bg-error':'bg-yellow-500'} flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-white" style="font-size:20px">${a.tipo==='saturacion'?'priority_high':'timer'}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start flex-wrap gap-1">
                  <h4 class="text-label-lg text-on-surface font-bold">${a.tipo==='saturacion'?'Saturación':'Baja ocupación'} · Bus ${a.bus_codigo}</h4>
                  <span class="text-label-sm text-on-surface-variant bg-surface px-2 py-0.5 rounded-full border border-outline-variant/50 shrink-0">${tiempoRelativo(a.fecha_hora)}</span>
                </div>
                <p class="text-body-md text-on-surface-variant mt-1">En ${a.estacion_nombre} · <strong>${a.porcentaje}%</strong></p>
                ${a.tipo==='saturacion'?`
                <div class="mt-2 flex gap-2 flex-wrap">
                  <button onclick="atenderAlerta(${a.id})" class="bg-primary text-white text-label-lg px-3 py-1 rounded-full text-xs">Atender</button>
                  <button onclick="apoyoAlerta(${a.id})" class="bg-error text-white text-label-lg px-3 py-1 rounded-full text-xs">Enviar apoyo</button>
                </div>`:''}
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Estado de líneas -->
      <div class="glass-card rounded-xl p-lg">
        <div class="flex justify-between items-center mb-md border-b border-outline-variant/30 pb-sm">
          <h3 class="text-headline-sm text-on-surface">Estado de líneas</h3>
          <span class="material-symbols-outlined text-secondary" style="font-size:20px">route</span>
        </div>
        <div class="flex flex-col gap-sm">
          ${d.lineas.map(l => `
          <div onclick="ir('lineas')" class="p-sm rounded-lg border border-outline-variant/40 bg-surface/50 hover:bg-surface-container-low transition-colors cursor-pointer">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full ${l.estado==='Saturada'?'bg-error':l.estado==='Activa'?'bg-primary':'bg-gray-400'}"></div>
                <span class="text-label-lg text-on-surface font-bold">${l.nombre}</span>
              </div>
              <span class="text-label-sm px-2 py-0.5 rounded ${colorEstado(l.estado)} border font-bold">${l.estado}</span>
            </div>
            <p class="text-body-md text-on-surface-variant">${l.num_buses} buses · ${l.num_estaciones} estaciones</p>
          </div>`).join('')}
        </div>
      </div>
    </div>`;

  } catch (err) {
    el.innerHTML = `<div class="glass-card rounded-xl p-lg text-error text-center"><span class="material-symbols-outlined">error</span><p>${err.message}</p></div>`;
  }
}

async function atenderAlerta(id) {
  try { await api.put(`/api/alertas/${id}/atender`); toast('Alerta atendida.'); cargarDashboard(); } catch(e){ toast(e.message,'error'); }
}
async function apoyoAlerta(id) {
  try { await api.put(`/api/alertas/${id}/apoyo`); toast('Apoyo enviado.'); cargarDashboard(); } catch(e){ toast(e.message,'error'); }
}
