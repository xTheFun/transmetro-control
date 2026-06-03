// Helper centralizado para todas las llamadas a la API REST
// Incluye el token JWT en cada petición automáticamente

function getToken() {
  return localStorage.getItem('tm_token') || sessionStorage.getItem('tm_token');
}

async function api(url, opciones = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opciones.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch(url, { ...opciones, headers });

  // Si el token expiró, redirigir al login
  if (resp.status === 401 || resp.status === 403) {
    localStorage.removeItem('tm_token');
    sessionStorage.removeItem('tm_token');
    window.location.href = '/';
    return;
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
  return data;
}

// Shorthand para POST/PUT/DELETE
api.post   = (url, body) => api(url, { method: 'POST',   body: JSON.stringify(body) });
api.put    = (url, body) => api(url, { method: 'PUT',    body: JSON.stringify(body) });
api.delete = (url)       => api(url, { method: 'DELETE' });

// Formatear fecha/hora en español
function formatFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' });
}

// Hace X tiempo
function tiempoRelativo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)  return 'Ahora mismo';
  if (diff < 60) return `Hace ${diff} min`;
  if (diff < 1440) return `Hace ${Math.floor(diff/60)} h`;
  return `Hace ${Math.floor(diff/1440)} días`;
}

// Obtener iniciales de un nombre
function iniciales(nombre) {
  return (nombre || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Color de estado de bus/estación
function colorEstado(estado) {
  const m = {
    'Activo':'bg-primary/10 text-primary border-primary/20',
    'Activa':'bg-primary/10 text-primary border-primary/20',
    'Inactivo':'bg-surface-container-highest text-outline border-outline-variant/30',
    'Inactiva':'bg-surface-container-highest text-outline border-outline-variant/30',
    'Mantenimiento':'bg-yellow-100 text-yellow-800 border-yellow-300/50',
    'Saturada':'bg-red-100 text-red-700 border-red-300/50',
    'Normal':'bg-primary/10 text-primary border-primary/20'
  };
  return m[estado] || 'bg-gray-100 text-gray-600 border-gray-200';
}
