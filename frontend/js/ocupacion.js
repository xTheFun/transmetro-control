// Módulo Registro de Ocupación — pantalla del operador (mobile-first)
// Dispara RN-06 y RN-07 en el backend al registrar
let _ocBuses = [], _ocEstaciones = [], _ocOperadores = [];
let _ocBusSeleccionado = null;
let _contadorPasajeros = 0;

async function cargarOcupacion() {
  const el = document.getElementById('view-ocupacion');
  el.innerHTML = `<div class="flex items-center justify-center h-48 text-on-surface-variant"><span class="material-symbols-outlined mr-2">refresh</span>Cargando...</div>`;
  try {
    [_ocBuses, _ocEstaciones, _ocOperadores] = await Promise.all([
      api('/api/buses'), api('/api/estaciones'), api('/api/ocupacion/operadores')
    ]);
    const busesActivos = _ocBuses.filter(b=>b.estado==='Activo');
    _ocBusSeleccionado = busesActivos[0] || null;
    _contadorPasajeros = 0;
    renderOcupacion();
  } catch(e) { el.innerHTML = `<p class="text-error p-4">${e.message}</p>`; }
}

function renderOcupacion() {
  const el = document.getElementById('view-ocupacion');
  const busesActivos = _ocBuses.filter(b=>b.estado==='Activo');
  const bus = _ocBusSeleccionado;
  const porcentaje = bus ? (_contadorPasajeros / bus.capacidad) * 100 : 0;
  const esSaturacion = porcentaje >= 150;
  const esBaja = porcentaje > 0 && porcentaje < 25;
  const barWidth = Math.min(porcentaje, 100);
  const barColor = esSaturacion ? 'bg-error' : esBaja ? 'bg-yellow-500' : 'bg-primary';

  el.innerHTML = `
  <div class="mb-lg">
    <h1 class="text-headline-lg text-on-surface mb-xs">Registro de Ocupación</h1>
    <p class="text-body-md text-on-surface-variant">Pantalla del operador de estación.</p>
  </div>

  <div class="max-w-2xl mx-auto flex flex-col gap-6">
    <!-- Selector de operador y estación -->
    <div class="glass-card rounded-xl p-md">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-label-sm text-on-surface-variant mb-1">Operador</label>
          <select id="selOperador" onchange="actualizarInfoOperador()" class="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
            ${_ocOperadores.map(op=>`<option value="${op.id}" data-estacion="${op.id_estacion}" data-turno="${op.hora_inicio||''}-${op.hora_fin||''}">${op.nombre}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-label-sm text-on-surface-variant mb-1">Estación</label>
          <select id="selEstacion" class="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
            ${_ocEstaciones.map(e=>`<option value="${e.id}">${e.nombre}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- Info del bus -->
    <div class="glass-card rounded-xl p-md flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <span class="text-label-sm text-on-surface-variant uppercase tracking-wider">Bus en estación</span>
        <select id="selBus" onchange="cambiarBus()" class="border border-outline-variant rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary bg-surface">
          ${busesActivos.map(b=>`<option value="${b.id}" data-capacidad="${b.capacidad}" data-codigo="${b.codigo}" data-linea="${b.linea_nombre||''}">${b.codigo} — ${b.linea_nombre||'Sin línea'}</option>`).join('')}
        </select>
      </div>
      ${bus ? `
      <div class="flex justify-between items-center bg-surface-container rounded-lg p-3">
        <div>
          <span class="block text-label-sm text-on-surface-variant mb-0.5">Bus seleccionado</span>
          <div class="text-headline-sm text-on-surface flex items-center gap-sm">
            <span class="material-symbols-outlined text-primary">directions_bus</span>${bus.codigo} — ${bus.linea_nombre||'Sin línea'}
          </div>
        </div>
        <div class="text-right">
          <span class="block text-label-sm text-on-surface-variant mb-0.5">Capacidad</span>
          <span class="text-body-lg text-on-surface font-semibold">${bus.capacidad}</span>
        </div>
      </div>` : '<p class="text-on-surface-variant text-center text-sm">No hay buses activos disponibles.</p>'}
    </div>

    <!-- Contador de pasajeros (grande para móvil) -->
    <div class="glass-card rounded-xl p-lg flex flex-col items-center gap-6">
      <span class="text-label-lg text-on-surface-variant">Pasajeros a bordo</span>
      <div class="flex items-center gap-8 md:gap-lg">
        <button onclick="decrementar()"
          class="w-20 h-20 md:w-[72px] md:h-[72px] rounded-full bg-surface-container-high border-2 border-outline-variant text-on-surface hover:bg-surface-variant active:scale-95 transition-all flex items-center justify-center touch-manipulation">
          <span class="material-symbols-outlined" style="font-size:40px">remove</span>
        </button>
        <div class="w-36 md:w-[140px] text-center">
          <span id="contadorDisplay" class="text-display-num ${esSaturacion?'text-error':esBaja?'text-yellow-600':'text-on-surface'}">${_contadorPasajeros}</span>
          ${bus?`<p class="text-sm text-on-surface-variant mt-1">${porcentaje.toFixed(0)}% de ${bus.capacidad}</p>`:''}
        </div>
        <button onclick="incrementar()"
          class="w-20 h-20 md:w-[72px] md:h-[72px] rounded-full bg-primary border-2 border-primary text-white hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center shadow-sm touch-manipulation">
          <span class="material-symbols-outlined" style="font-size:40px">add</span>
        </button>
      </div>

      <!-- Barra de progreso -->
      <div class="w-full">
        <div class="w-full h-4 bg-surface-variant rounded-full overflow-hidden">
          <div id="barraOcupacion" class="h-full ${barColor} rounded-full transition-all" style="width:${barWidth}%"></div>
        </div>
        <div class="flex justify-between mt-2 text-label-sm text-on-surface-variant">
          <span>0%</span><span>50%</span><span>100%</span><span class="${esSaturacion?'text-error font-bold':''}">150%+</span>
        </div>
      </div>

      <!-- Aviso de alerta -->
      ${esSaturacion ? `
      <div class="w-full bg-error-container/20 border border-error-container rounded-lg p-md flex items-start gap-sm">
        <span class="material-symbols-outlined text-error" style="font-variation-settings:'FILL' 1">warning</span>
        <p class="text-body-md text-on-error-container"><strong>⚠️ Supera el 150% de la capacidad.</strong><br>Se generará una alerta de saturación automáticamente al registrar.</p>
      </div>` : esBaja ? `
      <div class="w-full bg-yellow-50 border border-yellow-300 rounded-lg p-md flex items-start gap-sm">
        <span class="material-symbols-outlined text-yellow-600" style="font-variation-settings:'FILL' 1">timer</span>
        <p class="text-body-md text-yellow-800"><strong>Baja ocupación (${porcentaje.toFixed(0)}%).</strong><br>Se registrará una alerta de baja ocupación. Espera de 5 min activa.</p>
      </div>` : ''}

      <!-- Botones de acción -->
      <div class="flex flex-col gap-3 w-full">
        <button onclick="registrarOcupacion()" ${!bus?'disabled':''}
          class="w-full py-4 ${esSaturacion?'bg-error hover:opacity-90':'bg-primary hover:bg-primary-container'} text-white rounded-xl text-headline-sm flex items-center justify-center gap-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation">
          <span class="material-symbols-outlined">${esSaturacion?'notification_important':'save'}</span>
          ${esSaturacion?'Registrar y generar alerta':'Registrar ocupación'}
        </button>
        <button onclick="resetContador()" class="w-full py-3 text-primary text-label-lg hover:bg-surface-variant rounded-xl transition-colors">
          Resetear contador
        </button>
      </div>
    </div>

    <!-- Historial reciente -->
    <div class="glass-card rounded-xl p-md">
      <h3 class="text-headline-sm text-on-surface mb-3">Registros recientes</h3>
      <div id="historialOcupacion"><p class="text-on-surface-variant text-sm text-center py-2">Cargando...</p></div>
    </div>
  </div>`;

  cargarHistorialOcupacion();
}

function cambiarBus() {
  const sel = document.getElementById('selBus');
  const opt = sel.options[sel.selectedIndex];
  _ocBusSeleccionado = {
    id: parseInt(sel.value),
    capacidad: parseInt(opt.dataset.capacidad),
    codigo: opt.dataset.codigo,
    linea_nombre: opt.dataset.linea
  };
  _contadorPasajeros = 0;
  renderOcupacion();
}

function incrementar() {
  _contadorPasajeros++;
  actualizarContador();
}
function decrementar() {
  if (_contadorPasajeros > 0) { _contadorPasajeros--; actualizarContador(); }
}
function resetContador() { _contadorPasajeros = 0; actualizarContador(); }

function actualizarContador() {
  // Re-render solo la parte del contador para no perder los selectores
  const bus = _ocBusSeleccionado;
  const porcentaje = bus ? (_contadorPasajeros / bus.capacidad) * 100 : 0;
  const esSaturacion = porcentaje >= 150;
  const esBaja = porcentaje > 0 && porcentaje < 25;

  const disp = document.getElementById('contadorDisplay');
  if (disp) {
    disp.textContent = _contadorPasajeros;
    disp.className = `text-display-num ${esSaturacion?'text-error':esBaja?'text-yellow-600':'text-on-surface'}`;
  }
  const barra = document.getElementById('barraOcupacion');
  if (barra) {
    barra.style.width = Math.min(porcentaje, 100) + '%';
    barra.className = `h-full rounded-full transition-all ${esSaturacion?'bg-error':esBaja?'bg-yellow-500':'bg-primary'}`;
  }
}

async function registrarOcupacion() {
  const bus = _ocBusSeleccionado;
  if (!bus) return toast('Selecciona un bus.', 'error');

  const selEst = document.getElementById('selEstacion');
  const selOp  = document.getElementById('selOperador');
  const id_estacion = selEst ? parseInt(selEst.value) : null;
  const id_operador = selOp ? parseInt(selOp.value) : null;

  try {
    const res = await api.post('/api/ocupacion', {
      id_bus: bus.id,
      id_estacion,
      id_operador,
      cantidad_pasajeros: _contadorPasajeros
    });

    if (res.alerta?.alertaGenerada) {
      toast(`⚠️ ${res.alerta.mensaje}`, 'error');
    } else {
      toast(`Ocupación registrada: ${res.porcentaje}%`);
    }
    _contadorPasajeros = 0;
    actualizarContador();
    cargarHistorialOcupacion();
    actualizarBadgeAlertas();
  } catch(e) { toast(e.message, 'error'); }
}

async function cargarHistorialOcupacion() {
  const el = document.getElementById('historialOcupacion');
  if (!el) return;
  try {
    const regs = await api('/api/ocupacion');
    const ultimos = regs.slice(0, 5);
    el.innerHTML = ultimos.length ? ultimos.map(r=>`
    <div class="flex items-center justify-between py-2 border-b border-outline-variant/20 last:border-0">
      <div>
        <span class="font-semibold text-sm text-on-surface">${r.bus_codigo}</span>
        <span class="text-xs text-on-surface-variant ml-2">${r.estacion_nombre}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm font-semibold ${Number(r.porcentaje)>=150?'text-error':Number(r.porcentaje)<25?'text-yellow-600':'text-primary'}">${Number(r.porcentaje).toFixed(0)}%</span>
        <span class="text-xs text-on-surface-variant">${tiempoRelativo(r.fecha_hora)}</span>
      </div>
    </div>`).join('') : '<p class="text-on-surface-variant text-sm text-center py-2">Sin registros aún.</p>';
  } catch(e) { el.innerHTML = `<p class="text-xs text-error">${e.message}</p>`; }
}

function actualizarInfoOperador() {
  // Sincronizar la estación con el operador seleccionado
  const sel = document.getElementById('selOperador');
  const opt = sel?.options[sel.selectedIndex];
  const idEst = opt?.dataset?.estacion;
  if (idEst && document.getElementById('selEstacion')) {
    document.getElementById('selEstacion').value = idEst;
  }
}
