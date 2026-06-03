// Seed con datos REALES del sistema Transmetro Guatemala
// Líneas: 1, 2, 6, 7, 12, 13, 18
// Estaciones de transferencia: Plaza Barrios, El Trébol, Centra Sur, Centra Atlántida, San Sebastián
// Ejecutar: npm run seed

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const path    = require('path');
const knex    = require('knex')(require('../knexfile'));
const bcrypt  = require('bcryptjs');

async function seed() {
  // Aplicar migraciones primero (idempotente si ya existen)
  await knex.migrate.latest({ directory: path.join(__dirname, '../migrations') });
  console.log('🌱 Iniciando seed con datos reales de Transmetro Guatemala...');

  // Limpiar en orden inverso de dependencias
  const tablas = [
    'historial_asignacion_bus','visita_bus','alerta','registro_ocupacion',
    'turno_operador','operador','historial_educativo','piloto','bus',
    'parqueo','guardia','acceso','linea_estacion','estacion','linea',
    'municipalidad','usuario'
  ];
  for (const t of tablas) await knex(t).del().catch(() => {});

  // ── 1. MUNICIPALIDADES ────────────────────────────────────────
  const [idGuat]  = await knex('municipalidad').insert({ nombre: 'Guatemala',   departamento: 'Guatemala' });
  const [idMixco] = await knex('municipalidad').insert({ nombre: 'Mixco',       departamento: 'Guatemala' });
  const [idVN]    = await knex('municipalidad').insert({ nombre: 'Villa Nueva',  departamento: 'Guatemala' });

  // ── 2. LÍNEAS ─────────────────────────────────────────────────
  const [idL1]  = await knex('linea').insert({ nombre: 'Línea 1 — Centro Histórico',             codigo: 'L-01', distancia_total: 8.2,  estado: 'Activa',   id_municipalidad: idGuat  });
  const [idL2]  = await knex('linea').insert({ nombre: 'Línea 2 — Centro Histórico–Hipódromo',   codigo: 'L-02', distancia_total: 5.4,  estado: 'Activa',   id_municipalidad: idGuat  });
  const [idL6]  = await knex('linea').insert({ nombre: 'Línea 6 — Zona 6',                       codigo: 'L-06', distancia_total: 9.1,  estado: 'Activa',   id_municipalidad: idGuat  });
  const [idL7]  = await knex('linea').insert({ nombre: 'Línea 7 — Anillo Periférico',            codigo: 'L-07', distancia_total: 14.3, estado: 'Activa',   id_municipalidad: idGuat  });
  const [idL12] = await knex('linea').insert({ nombre: 'Línea 12 — Eje Sur (Aguilar Batres)',    codigo: 'L-12', distancia_total: 11.8, estado: 'Saturada', id_municipalidad: idVN    });
  const [idL13] = await knex('linea').insert({ nombre: 'Línea 13 — Eje Central',                 codigo: 'L-13', distancia_total: 12.6, estado: 'Activa',   id_municipalidad: idGuat  });
  const [idL18] = await knex('linea').insert({ nombre: 'Línea 18 — Eje Norte',                   codigo: 'L-18', distancia_total: 10.5, estado: 'Activa',   id_municipalidad: idGuat  });

  // ── 3. ESTACIONES (catálogo unificado — sin duplicar las de transferencia) ──
  // Estaciones de transferencia (compartidas entre líneas)
  const [idPlazaBarrios]   = await knex('estacion').insert({ nombre: 'Plaza Barrios',          ubicacion: 'Zona 1, Ciudad de Guatemala',       estado: 'Activa', id_municipalidad: idGuat });
  const [idElTrebol]       = await knex('estacion').insert({ nombre: 'El Trébol',              ubicacion: 'Zona 3, Ciudad de Guatemala',       estado: 'Activa', id_municipalidad: idGuat });
  const [idCentraSur]      = await knex('estacion').insert({ nombre: 'Terminal Centra Sur',    ubicacion: 'Zona 12, Ciudad de Guatemala',      estado: 'Activa', id_municipalidad: idGuat });
  const [idCentraAtlantida]= await knex('estacion').insert({ nombre: 'Terminal Centra Atlántida', ubicacion: 'Zona 17, Ciudad de Guatemala',  estado: 'Activa', id_municipalidad: idGuat });
  const [idSanSebastian]   = await knex('estacion').insert({ nombre: 'San Sebastián',          ubicacion: 'Zona 1, Ciudad de Guatemala',       estado: 'Activa', id_municipalidad: idGuat });

  // Línea 1 — estaciones exclusivas
  const [idElCalvario]     = await knex('estacion').insert({ nombre: 'El Calvario',            ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });
  const [idSanAgustin]     = await knex('estacion').insert({ nombre: 'San Agustín',            ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });
  const [idGomezCarrillo]  = await knex('estacion').insert({ nombre: 'Gómez Carrillo',         ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });
  const [idParqueCentena]  = await knex('estacion').insert({ nombre: 'Parque Centenario',      ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });
  const [idMercadoCentral] = await knex('estacion').insert({ nombre: 'Mercado Central',        ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });
  const [idCerritoCarmen]  = await knex('estacion').insert({ nombre: 'Cerrito del Carmen',     ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });
  const [idBeatriz]        = await knex('estacion').insert({ nombre: 'Beatriz',                ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });
  const [idCapuchinas]     = await knex('estacion').insert({ nombre: 'Capuchinas',             ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });
  const [idSeisNoviembre]  = await knex('estacion').insert({ nombre: 'Seis de Noviembre',      ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });
  const [idCentroCivico]   = await knex('estacion').insert({ nombre: 'Centro Cívico',          ubicacion: 'Zona 4',  estado: 'Activa', id_municipalidad: idGuat });

  // Línea 2 — exclusivas
  const [idJocotenango]    = await knex('estacion').insert({ nombre: 'Jocotenango',            ubicacion: 'Zona 2',  estado: 'Activa', id_municipalidad: idGuat });
  const [idSimeonCanas]    = await knex('estacion').insert({ nombre: 'Simeón Cañas',           ubicacion: 'Zona 2',  estado: 'Activa', id_municipalidad: idGuat });
  const [idHipodromo]      = await knex('estacion').insert({ nombre: 'Hipódromo del Norte',    ubicacion: 'Zona 2',  estado: 'Activa', id_municipalidad: idGuat });
  const [idCiudadNueva]    = await knex('estacion').insert({ nombre: 'Ciudad Nueva',           ubicacion: 'Zona 2',  estado: 'Activa', id_municipalidad: idGuat });

  // Línea 6 — exclusivas (comparte Plaza Barrios y Fegua/Parroquia con L18)
  const [idFegua]          = await knex('estacion').insert({ nombre: 'Fegua',                  ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });
  const [idParroquia]      = await knex('estacion').insert({ nombre: 'Parroquia',              ubicacion: 'Zona 6',  estado: 'Activa', id_municipalidad: idGuat });
  const [idQuintanal]      = await knex('estacion').insert({ nombre: 'Quintanal',              ubicacion: 'Zona 6',  estado: 'Activa', id_municipalidad: idGuat });
  const [idCorpusChristi]  = await knex('estacion').insert({ nombre: 'Corpus Christi',         ubicacion: 'Zona 6',  estado: 'Activa', id_municipalidad: idGuat });
  const [idCipresales]     = await knex('estacion').insert({ nombre: 'Cipresales',             ubicacion: 'Zona 6',  estado: 'Activa', id_municipalidad: idGuat });
  const [idProyectos]      = await knex('estacion').insert({ nombre: 'Proyectos',              ubicacion: 'Zona 6',  estado: 'Activa', id_municipalidad: idGuat });
  const [idValleNorte]     = await knex('estacion').insert({ nombre: 'Valle del Norte',        ubicacion: 'Zona 6',  estado: 'Activa', id_municipalidad: idGuat });
  const [idEstadioPedrera] = await knex('estacion').insert({ nombre: 'Estadio Pedrera',        ubicacion: 'Zona 6',  estado: 'Activa', id_municipalidad: idGuat });
  const [idReinita]        = await knex('estacion').insert({ nombre: 'Reinita',                ubicacion: 'Zona 6',  estado: 'Activa', id_municipalidad: idGuat });

  // Línea 7 — exclusivas
  const [idUSAC]           = await knex('estacion').insert({ nombre: 'Universidad de San Carlos (USAC)', ubicacion: 'Zona 12', estado: 'Activa', id_municipalidad: idGuat });
  const [idCejusa]         = await knex('estacion').insert({ nombre: 'Cejusa',                 ubicacion: 'Zona 12', estado: 'Activa', id_municipalidad: idGuat });
  const [idCarabanchel]    = await knex('estacion').insert({ nombre: 'Carabanchel',            ubicacion: 'Zona 8',  estado: 'Activa', id_municipalidad: idGuat });
  const [idGranai]         = await knex('estacion').insert({ nombre: 'Granai',                 ubicacion: 'Zona 7',  estado: 'Activa', id_municipalidad: idGuat });
  const [idSanJuan]        = await knex('estacion').insert({ nombre: 'San Juan',               ubicacion: 'Zona 7',  estado: 'Activa', id_municipalidad: idGuat });
  const [idKaminaljuyu]    = await knex('estacion').insert({ nombre: 'Kaminaljuyú',            ubicacion: 'Zona 7',  estado: 'Activa', id_municipalidad: idMixco });
  const [idVillaLinda]     = await knex('estacion').insert({ nombre: 'Villa Linda',            ubicacion: 'Zona 7',  estado: 'Activa', id_municipalidad: idMixco });
  const [idTikalFutura]    = await knex('estacion').insert({ nombre: 'Tikal Futura',           ubicacion: 'Zona 11', estado: 'Activa', id_municipalidad: idGuat });
  const [idBetania]        = await knex('estacion').insert({ nombre: 'Betania',                ubicacion: 'Zona 7',  estado: 'Activa', id_municipalidad: idGuat });
  const [idLoDeBran]       = await knex('estacion').insert({ nombre: 'Lo de Bran',             ubicacion: 'Zona 7',  estado: 'Activa', id_municipalidad: idMixco });
  const [idColgate]        = await knex('estacion').insert({ nombre: 'Colgate',                ubicacion: 'Zona 7',  estado: 'Activa', id_municipalidad: idGuat });
  const [idSanMartin]      = await knex('estacion').insert({ nombre: 'San Martín',             ubicacion: 'Zona 6',  estado: 'Activa', id_municipalidad: idGuat });
  const [idCruzRoja]       = await knex('estacion').insert({ nombre: 'Cruz Roja',              ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });
  const [idParqueColon]    = await knex('estacion').insert({ nombre: 'Parque Colón',           ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });

  // Línea 12 — exclusivas
  const [idMonteMaria]     = await knex('estacion').insert({ nombre: 'Monte María',            ubicacion: 'Zona 12', estado: 'Activa', id_municipalidad: idVN   });
  const [idJavier]         = await knex('estacion').insert({ nombre: 'Javier',                 ubicacion: 'Zona 12', estado: 'Activa', id_municipalidad: idVN   });
  const [idLasCharcas]     = await knex('estacion').insert({ nombre: 'Las Charcas',            ubicacion: 'Zona 12', estado: 'Activa', id_municipalidad: idGuat });
  const [idElCarmen]       = await knex('estacion').insert({ nombre: 'El Carmen',              ubicacion: 'Zona 12', estado: 'Activa', id_municipalidad: idGuat });
  const [idMariscal]       = await knex('estacion').insert({ nombre: 'Mariscal',               ubicacion: 'Zona 12', estado: 'Activa', id_municipalidad: idGuat });
  const [idReformita]      = await knex('estacion').insert({ nombre: 'Reformita',              ubicacion: 'Zona 12', estado: 'Activa', id_municipalidad: idGuat });
  const [idNovicentro]     = await knex('estacion').insert({ nombre: 'Novicentro',             ubicacion: 'Zona 12', estado: 'Activa', id_municipalidad: idGuat });
  const [idSantaCecilia]   = await knex('estacion').insert({ nombre: 'Santa Cecilia',          ubicacion: 'Zona 3',  estado: 'Activa', id_municipalidad: idGuat });
  const [idBolivar]        = await knex('estacion').insert({ nombre: 'Bolívar',                ubicacion: 'Zona 3',  estado: 'Activa', id_municipalidad: idGuat });
  const [idDonBosco]       = await knex('estacion').insert({ nombre: 'Don Bosco',              ubicacion: 'Zona 3',  estado: 'Activa', id_municipalidad: idGuat });
  const [idPlazaElAmate]   = await knex('estacion').insert({ nombre: 'Plaza El Amate',         ubicacion: 'Zona 3',  estado: 'Activa', id_municipalidad: idGuat });

  // Línea 13 — exclusivas
  const [idTipografia]     = await knex('estacion').insert({ nombre: 'Tipografía',             ubicacion: 'Zona 1',  estado: 'Activa', id_municipalidad: idGuat });
  const [idExposicion]     = await knex('estacion').insert({ nombre: 'Exposición',             ubicacion: 'Zona 4',  estado: 'Activa', id_municipalidad: idGuat });
  const [idTerminal]       = await knex('estacion').insert({ nombre: 'Terminal',               ubicacion: 'Zona 4',  estado: 'Activa', id_municipalidad: idGuat });
  const [idIndustria]      = await knex('estacion').insert({ nombre: 'Industria',              ubicacion: 'Zona 4',  estado: 'Activa', id_municipalidad: idGuat });
  const [idPlazaEspana]    = await knex('estacion').insert({ nombre: 'Plaza España',           ubicacion: 'Zona 9',  estado: 'Activa', id_municipalidad: idGuat });
  const [idAcueducto]      = await knex('estacion').insert({ nombre: 'Acueducto',              ubicacion: 'Zona 9',  estado: 'Activa', id_municipalidad: idGuat });
  const [idFuerzaAerea]    = await knex('estacion').insert({ nombre: 'Fuerza Aérea',           ubicacion: 'Zona 13', estado: 'Activa', id_municipalidad: idGuat });
  const [idAeropuerto]     = await knex('estacion').insert({ nombre: 'Aeropuerto',             ubicacion: 'Zona 13', estado: 'Activa', id_municipalidad: idGuat });
  const [idHangares]       = await knex('estacion').insert({ nombre: 'Hangares',               ubicacion: 'Zona 13', estado: 'Activa', id_municipalidad: idGuat });
  const [idPlazaAtanasio]  = await knex('estacion').insert({ nombre: 'Plaza Atanasio Tzul',    ubicacion: 'Zona 13', estado: 'Activa', id_municipalidad: idGuat });
  const [idSantaFe]        = await knex('estacion').insert({ nombre: 'Santa Fe',               ubicacion: 'Zona 13', estado: 'Activa', id_municipalidad: idGuat });
  const [idLasPamplonas]   = await knex('estacion').insert({ nombre: 'Las Pamplonas',          ubicacion: 'Zona 13', estado: 'Activa', id_municipalidad: idGuat });
  const [idCUM]            = await knex('estacion').insert({ nombre: 'CUM (Centro Universitario Metropolitano)', ubicacion: 'Zona 11', estado: 'Activa', id_municipalidad: idGuat });
  const [idTecunUman]      = await knex('estacion').insert({ nombre: 'Tecún Umán',             ubicacion: 'Zona 11', estado: 'Activa', id_municipalidad: idGuat });

  // Línea 18 — exclusivas (comparte Fegua y Parroquia con L6)
  const [idCruceRafael]    = await knex('estacion').insert({ nombre: 'Cruce a San Rafael',     ubicacion: 'Zona 6',  estado: 'Activa', id_municipalidad: idGuat });
  const [idAlameda]        = await knex('estacion').insert({ nombre: 'Alameda',                ubicacion: 'Zona 17', estado: 'Activa', id_municipalidad: idGuat });
  const [idElLimon]        = await knex('estacion').insert({ nombre: 'El Limón',               ubicacion: 'Zona 17', estado: 'Activa', id_municipalidad: idGuat });
  const [idParaiso]        = await knex('estacion').insert({ nombre: 'Paraíso',                ubicacion: 'Zona 17', estado: 'Activa', id_municipalidad: idGuat });
  const [idSantaElena]     = await knex('estacion').insert({ nombre: 'Santa Elena',            ubicacion: 'Zona 18', estado: 'Activa', id_municipalidad: idGuat });
  const [idSanJose18]      = await knex('estacion').insert({ nombre: 'San José',               ubicacion: 'Zona 18', estado: 'Activa', id_municipalidad: idGuat });

  // ── 4. RECORRIDOS (linea_estacion) ────────────────────────────
  // Línea 1 — circuito Centro Histórico
  await knex('linea_estacion').insert([
    { id_linea:idL1, id_estacion:idPlazaBarrios,   orden:1,  distancia_tramo:0    },
    { id_linea:idL1, id_estacion:idElCalvario,     orden:2,  distancia_tramo:0.5  },
    { id_linea:idL1, id_estacion:idSanAgustin,     orden:3,  distancia_tramo:0.4  },
    { id_linea:idL1, id_estacion:idGomezCarrillo,  orden:4,  distancia_tramo:0.5  },
    { id_linea:idL1, id_estacion:idParqueCentena,  orden:5,  distancia_tramo:0.6  },
    { id_linea:idL1, id_estacion:idSanSebastian,   orden:6,  distancia_tramo:0.4  },
    { id_linea:idL1, id_estacion:idMercadoCentral, orden:7,  distancia_tramo:0.5  },
    { id_linea:idL1, id_estacion:idCerritoCarmen,  orden:8,  distancia_tramo:0.7  },
    { id_linea:idL1, id_estacion:idBeatriz,        orden:9,  distancia_tramo:0.6  },
    { id_linea:idL1, id_estacion:idCapuchinas,     orden:10, distancia_tramo:0.5  },
    { id_linea:idL1, id_estacion:idSeisNoviembre,  orden:11, distancia_tramo:0.5  },
    { id_linea:idL1, id_estacion:idCentroCivico,   orden:12, distancia_tramo:0.7  },
  ]);

  // Línea 2 — Centro Histórico–Hipódromo
  await knex('linea_estacion').insert([
    { id_linea:idL2, id_estacion:idSanSebastian,  orden:1, distancia_tramo:0    },
    { id_linea:idL2, id_estacion:idJocotenango,   orden:2, distancia_tramo:1.2  },
    { id_linea:idL2, id_estacion:idSimeonCanas,   orden:3, distancia_tramo:1.0  },
    { id_linea:idL2, id_estacion:idHipodromo,     orden:4, distancia_tramo:1.8  },
    { id_linea:idL2, id_estacion:idCiudadNueva,   orden:5, distancia_tramo:1.4  },
  ]);

  // Línea 6 — Zona 6
  await knex('linea_estacion').insert([
    { id_linea:idL6, id_estacion:idPlazaBarrios,   orden:1,  distancia_tramo:0    },
    { id_linea:idL6, id_estacion:idFegua,          orden:2,  distancia_tramo:0.8  },
    { id_linea:idL6, id_estacion:idParroquia,      orden:3,  distancia_tramo:0.9  },
    { id_linea:idL6, id_estacion:idQuintanal,      orden:4,  distancia_tramo:1.0  },
    { id_linea:idL6, id_estacion:idCorpusChristi,  orden:5,  distancia_tramo:0.9  },
    { id_linea:idL6, id_estacion:idCipresales,     orden:6,  distancia_tramo:1.1  },
    { id_linea:idL6, id_estacion:idProyectos,      orden:7,  distancia_tramo:1.0  },
    { id_linea:idL6, id_estacion:idValleNorte,     orden:8,  distancia_tramo:1.2  },
    { id_linea:idL6, id_estacion:idEstadioPedrera, orden:9,  distancia_tramo:1.1  },
    { id_linea:idL6, id_estacion:idReinita,        orden:10, distancia_tramo:0.9  },
  ]);

  // Línea 7 — Anillo Periférico
  await knex('linea_estacion').insert([
    { id_linea:idL7, id_estacion:idUSAC,          orden:1,  distancia_tramo:0    },
    { id_linea:idL7, id_estacion:idCejusa,         orden:2,  distancia_tramo:0.8  },
    { id_linea:idL7, id_estacion:idElTrebol,       orden:3,  distancia_tramo:1.0  },
    { id_linea:idL7, id_estacion:idCarabanchel,    orden:4,  distancia_tramo:0.9  },
    { id_linea:idL7, id_estacion:idGranai,         orden:5,  distancia_tramo:1.2  },
    { id_linea:idL7, id_estacion:idSanJuan,        orden:6,  distancia_tramo:0.8  },
    { id_linea:idL7, id_estacion:idKaminaljuyu,    orden:7,  distancia_tramo:1.0  },
    { id_linea:idL7, id_estacion:idVillaLinda,     orden:8,  distancia_tramo:0.9  },
    { id_linea:idL7, id_estacion:idTikalFutura,    orden:9,  distancia_tramo:1.3  },
    { id_linea:idL7, id_estacion:idBetania,        orden:10, distancia_tramo:0.8  },
    { id_linea:idL7, id_estacion:idLoDeBran,       orden:11, distancia_tramo:1.1  },
    { id_linea:idL7, id_estacion:idColgate,        orden:12, distancia_tramo:0.9  },
    { id_linea:idL7, id_estacion:idSanMartin,      orden:13, distancia_tramo:1.0  },
    { id_linea:idL7, id_estacion:idCruzRoja,       orden:14, distancia_tramo:1.2  },
    { id_linea:idL7, id_estacion:idParqueColon,    orden:15, distancia_tramo:0.8  },
  ]);

  // Línea 12 — Eje Sur (mayor afluencia)
  await knex('linea_estacion').insert([
    { id_linea:idL12, id_estacion:idCentraSur,      orden:1,  distancia_tramo:0    },
    { id_linea:idL12, id_estacion:idMonteMaria,     orden:2,  distancia_tramo:0.9  },
    { id_linea:idL12, id_estacion:idJavier,         orden:3,  distancia_tramo:0.8  },
    { id_linea:idL12, id_estacion:idLasCharcas,     orden:4,  distancia_tramo:0.7  },
    { id_linea:idL12, id_estacion:idElCarmen,       orden:5,  distancia_tramo:0.6  },
    { id_linea:idL12, id_estacion:idMariscal,       orden:6,  distancia_tramo:0.7  },
    { id_linea:idL12, id_estacion:idReformita,      orden:7,  distancia_tramo:0.8  },
    { id_linea:idL12, id_estacion:idNovicentro,     orden:8,  distancia_tramo:0.9  },
    { id_linea:idL12, id_estacion:idElTrebol,       orden:9,  distancia_tramo:1.2  },
    { id_linea:idL12, id_estacion:idSantaCecilia,   orden:10, distancia_tramo:0.8  },
    { id_linea:idL12, id_estacion:idBolivar,        orden:11, distancia_tramo:0.7  },
    { id_linea:idL12, id_estacion:idDonBosco,       orden:12, distancia_tramo:0.6  },
    { id_linea:idL12, id_estacion:idPlazaElAmate,   orden:13, distancia_tramo:0.8  },
    { id_linea:idL12, id_estacion:idPlazaBarrios,   orden:14, distancia_tramo:1.1  },
  ]);

  // Línea 13 — Eje Central
  await knex('linea_estacion').insert([
    { id_linea:idL13, id_estacion:idPlazaBarrios,   orden:1,  distancia_tramo:0    },
    { id_linea:idL13, id_estacion:idTipografia,     orden:2,  distancia_tramo:0.6  },
    { id_linea:idL13, id_estacion:idElCalvario,     orden:3,  distancia_tramo:0.5  },
    { id_linea:idL13, id_estacion:idExposicion,     orden:4,  distancia_tramo:0.7  },
    { id_linea:idL13, id_estacion:idTerminal,       orden:5,  distancia_tramo:0.6  },
    { id_linea:idL13, id_estacion:idIndustria,      orden:6,  distancia_tramo:0.5  },
    { id_linea:idL13, id_estacion:idPlazaEspana,    orden:7,  distancia_tramo:0.9  },
    { id_linea:idL13, id_estacion:idAcueducto,      orden:8,  distancia_tramo:0.8  },
    { id_linea:idL13, id_estacion:idFuerzaAerea,    orden:9,  distancia_tramo:1.0  },
    { id_linea:idL13, id_estacion:idAeropuerto,     orden:10, distancia_tramo:1.2  },
    { id_linea:idL13, id_estacion:idHangares,       orden:11, distancia_tramo:0.8  },
    { id_linea:idL13, id_estacion:idPlazaAtanasio,  orden:12, distancia_tramo:1.0  },
    { id_linea:idL13, id_estacion:idSantaFe,        orden:13, distancia_tramo:0.9  },
    { id_linea:idL13, id_estacion:idLasPamplonas,   orden:14, distancia_tramo:0.8  },
    { id_linea:idL13, id_estacion:idCUM,            orden:15, distancia_tramo:0.9  },
    { id_linea:idL13, id_estacion:idTecunUman,      orden:16, distancia_tramo:0.7  },
  ]);

  // Línea 18 — Eje Norte
  await knex('linea_estacion').insert([
    { id_linea:idL18, id_estacion:idPlazaBarrios,    orden:1, distancia_tramo:0    },
    { id_linea:idL18, id_estacion:idFegua,           orden:2, distancia_tramo:0.8  },
    { id_linea:idL18, id_estacion:idParroquia,       orden:3, distancia_tramo:0.9  },
    { id_linea:idL18, id_estacion:idCruceRafael,     orden:4, distancia_tramo:1.1  },
    { id_linea:idL18, id_estacion:idCentraAtlantida, orden:5, distancia_tramo:1.4  },
    { id_linea:idL18, id_estacion:idAlameda,         orden:6, distancia_tramo:1.0  },
    { id_linea:idL18, id_estacion:idElLimon,         orden:7, distancia_tramo:0.9  },
    { id_linea:idL18, id_estacion:idParaiso,         orden:8, distancia_tramo:0.8  },
    { id_linea:idL18, id_estacion:idSantaElena,      orden:9, distancia_tramo:1.0  },
    { id_linea:idL18, id_estacion:idSanJose18,       orden:10, distancia_tramo:0.9 },
  ]);

  // ── 5. ACCESOS ────────────────────────────────────────────────
  // Estaciones de transferencia con más accesos (son las más concurridas)
  const accesos = [
    // Plaza Barrios — 4 accesos (nodo principal, 4 líneas)
    { id_estacion: idPlazaBarrios,    nombre: 'Acceso Norte' },
    { id_estacion: idPlazaBarrios,    nombre: 'Acceso Sur' },
    { id_estacion: idPlazaBarrios,    nombre: 'Acceso Este' },
    { id_estacion: idPlazaBarrios,    nombre: 'Acceso Oeste' },
    // El Trébol — 3 accesos (L7 y L12)
    { id_estacion: idElTrebol,        nombre: 'Acceso Norte' },
    { id_estacion: idElTrebol,        nombre: 'Acceso Sur' },
    { id_estacion: idElTrebol,        nombre: 'Acceso Este' },
    // Centra Sur — 3 accesos
    { id_estacion: idCentraSur,       nombre: 'Acceso Principal' },
    { id_estacion: idCentraSur,       nombre: 'Acceso Secundario Norte' },
    { id_estacion: idCentraSur,       nombre: 'Acceso Secundario Sur' },
    // Centra Atlántida — 2 accesos
    { id_estacion: idCentraAtlantida, nombre: 'Acceso Principal' },
    { id_estacion: idCentraAtlantida, nombre: 'Acceso Norte' },
    // San Sebastián — 2 accesos (L1 y L2)
    { id_estacion: idSanSebastian,    nombre: 'Acceso Norte' },
    { id_estacion: idSanSebastian,    nombre: 'Acceso Sur' },
    // Resto de estaciones — 1 acceso c/u
    { id_estacion: idCentroCivico,    nombre: 'Acceso Principal' },
    { id_estacion: idUSAC,            nombre: 'Acceso Principal' },
    { id_estacion: idAeropuerto,      nombre: 'Acceso Principal' },
    { id_estacion: idHipodromo,       nombre: 'Acceso Principal' },
    { id_estacion: idElCalvario,      nombre: 'Acceso Principal' },
    { id_estacion: idMercadoCentral,  nombre: 'Acceso Principal' },
    { id_estacion: idFegua,           nombre: 'Acceso Principal' },
    { id_estacion: idTikalFutura,     nombre: 'Acceso Principal' },
    { id_estacion: idPlazaEspana,     nombre: 'Acceso Principal' },
    { id_estacion: idCUM,             nombre: 'Acceso Principal' },
  ];

  const accesosInsertados = [];
  for (const a of accesos) {
    const [id] = await knex('acceso').insert(a);
    accesosInsertados.push({ id, id_estacion: a.id_estacion, nombre: a.nombre });
  }

  // ── 6. GUARDIAS (RN-05: mínimo 1 por acceso) ─────────────────
  const turnos = ['Mañana', 'Tarde', 'Noche'];
  const nombresGuardias = [
    'Roberto Paz','Elena Fuentes','Mario Castro','Diana López','Carlos Ríos',
    'Fernanda Gil','Hugo Castillo','Patricia Moreno','Gustavo Lemus','Rosa Juárez',
    'Andrés Méndez','Lucía Torres','Francisco Vásquez','Gloria Salinas','José Rodas',
    'Carmen Ajú','Raúl Pérez','Silvia Morales','Oscar Chávez','Norma Estrada',
    'Erick Aguilar','Marina López','Rubén Fuentes','Carmen Toledo','Jorge Monzón',
    'Sandra Orellana','Pablo Leiva','Iris Castillo','Hector Girón','Yolanda Ramos',
  ];
  let gIdx = 0;
  for (const acc of accesosInsertados) {
    // Estaciones de transferencia tienen 2 guardias por acceso
    const esTransferencia = [idPlazaBarrios, idElTrebol, idCentraSur, idCentraAtlantida].includes(acc.id_estacion);
    const numGuardias = esTransferencia ? 2 : 1;
    for (let i = 0; i < numGuardias; i++) {
      await knex('guardia').insert({
        id_acceso: acc.id,
        nombre: nombresGuardias[gIdx % nombresGuardias.length],
        turno: turnos[(gIdx + i) % 3]
      });
      gIdx++;
    }
  }

  // ── 7. PARQUEOS ───────────────────────────────────────────────
  const [idPCentraSur]  = await knex('parqueo').insert({ nombre: 'Parqueo Centra Sur',       id_estacion: idCentraSur,       capacidad: 50 });
  const [idPAtlantida]  = await knex('parqueo').insert({ nombre: 'Parqueo Centra Atlántida', id_estacion: idCentraAtlantida, capacidad: 40 });
  const [idPBarrios]    = await knex('parqueo').insert({ nombre: 'Parqueo Plaza Barrios',    id_estacion: idPlazaBarrios,    capacidad: 30 });
  const [idPTrebol]     = await knex('parqueo').insert({ nombre: 'Parqueo El Trébol',        id_estacion: idElTrebol,        capacidad: 25 });
  const [idPUSAC]       = await knex('parqueo').insert({ nombre: 'Parqueo USAC',             id_estacion: idUSAC,            capacidad: 35 });
  const [idPPeriférico] = await knex('parqueo').insert({ nombre: 'Parqueo Periférico Norte', id_estacion: null,              capacidad: 20 });
  const [idPZona13]     = await knex('parqueo').insert({ nombre: 'Parqueo Zona 13',          id_estacion: null,              capacidad: 20 });

  // ── 8. BUSES (RN-04: todos con id_parqueo) ────────────────────
  // Línea 12 tiene mayor flota por ser la de mayor afluencia (14 estaciones → 14-28 buses)
  const buses = [
    // Línea 1
    { codigo:'TM-101', placa:'P-101BTM', capacidad:100, estado:'Activo',        id_linea:idL1,  id_parqueo:idPBarrios   },
    { codigo:'TM-102', placa:'P-102BTM', capacidad:100, estado:'Activo',        id_linea:idL1,  id_parqueo:idPBarrios   },
    { codigo:'TM-103', placa:'P-103BTM', capacidad:100, estado:'Activo',        id_linea:idL1,  id_parqueo:idPBarrios   },
    { codigo:'TM-104', placa:'P-104BTM', capacidad:120, estado:'Activo',        id_linea:idL1,  id_parqueo:idPBarrios   },
    { codigo:'TM-105', placa:'P-105BTM', capacidad:100, estado:'Activo',        id_linea:idL1,  id_parqueo:idPBarrios   },
    { codigo:'TM-106', placa:'P-106BTM', capacidad:100, estado:'Activo',        id_linea:idL1,  id_parqueo:idPBarrios   },
    { codigo:'TM-107', placa:'P-107BTM', capacidad:100, estado:'Activo',        id_linea:idL1,  id_parqueo:idPBarrios   },
    { codigo:'TM-108', placa:'P-108BTM', capacidad:120, estado:'Activo',        id_linea:idL1,  id_parqueo:idPBarrios   },
    { codigo:'TM-109', placa:'P-109BTM', capacidad:100, estado:'Activo',        id_linea:idL1,  id_parqueo:idPBarrios   },
    { codigo:'TM-110', placa:'P-110BTM', capacidad:100, estado:'Activo',        id_linea:idL1,  id_parqueo:idPBarrios   },
    { codigo:'TM-111', placa:'P-111BTM', capacidad:100, estado:'Activo',        id_linea:idL1,  id_parqueo:idPBarrios   },
    { codigo:'TM-112', placa:'P-112BTM', capacidad:100, estado:'Mantenimiento', id_linea:idL1,  id_parqueo:idPBarrios   },
    // Línea 2
    { codigo:'TM-201', placa:'P-201BTM', capacidad:100, estado:'Activo',        id_linea:idL2,  id_parqueo:idPBarrios   },
    { codigo:'TM-202', placa:'P-202BTM', capacidad:100, estado:'Activo',        id_linea:idL2,  id_parqueo:idPBarrios   },
    { codigo:'TM-203', placa:'P-203BTM', capacidad:100, estado:'Activo',        id_linea:idL2,  id_parqueo:idPBarrios   },
    { codigo:'TM-204', placa:'P-204BTM', capacidad:120, estado:'Activo',        id_linea:idL2,  id_parqueo:idPBarrios   },
    { codigo:'TM-205', placa:'P-205BTM', capacidad:100, estado:'Activo',        id_linea:idL2,  id_parqueo:idPBarrios   },
    // Línea 6
    { codigo:'TM-601', placa:'P-601BTM', capacidad:100, estado:'Activo',        id_linea:idL6,  id_parqueo:idPBarrios   },
    { codigo:'TM-602', placa:'P-602BTM', capacidad:100, estado:'Activo',        id_linea:idL6,  id_parqueo:idPBarrios   },
    { codigo:'TM-603', placa:'P-603BTM', capacidad:120, estado:'Activo',        id_linea:idL6,  id_parqueo:idPBarrios   },
    { codigo:'TM-604', placa:'P-604BTM', capacidad:100, estado:'Activo',        id_linea:idL6,  id_parqueo:idPBarrios   },
    { codigo:'TM-605', placa:'P-605BTM', capacidad:100, estado:'Activo',        id_linea:idL6,  id_parqueo:idPBarrios   },
    { codigo:'TM-606', placa:'P-606BTM', capacidad:100, estado:'Activo',        id_linea:idL6,  id_parqueo:idPBarrios   },
    { codigo:'TM-607', placa:'P-607BTM', capacidad:100, estado:'Activo',        id_linea:idL6,  id_parqueo:idPBarrios   },
    { codigo:'TM-608', placa:'P-608BTM', capacidad:100, estado:'Activo',        id_linea:idL6,  id_parqueo:idPBarrios   },
    { codigo:'TM-609', placa:'P-609BTM', capacidad:100, estado:'Activo',        id_linea:idL6,  id_parqueo:idPBarrios   },
    { codigo:'TM-610', placa:'P-610BTM', capacidad:100, estado:'Activo',        id_linea:idL6,  id_parqueo:idPBarrios   },
    // Línea 7 — Periférico
    { codigo:'TM-701', placa:'P-701BTM', capacidad:120, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-702', placa:'P-702BTM', capacidad:120, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-703', placa:'P-703BTM', capacidad:100, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-704', placa:'P-704BTM', capacidad:120, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-705', placa:'P-705BTM', capacidad:100, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-706', placa:'P-706BTM', capacidad:100, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-707', placa:'P-707BTM', capacidad:120, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-708', placa:'P-708BTM', capacidad:100, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-709', placa:'P-709BTM', capacidad:100, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-710', placa:'P-710BTM', capacidad:100, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-711', placa:'P-711BTM', capacidad:100, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-712', placa:'P-712BTM', capacidad:100, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-713', placa:'P-713BTM', capacidad:120, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-714', placa:'P-714BTM', capacidad:100, estado:'Activo',        id_linea:idL7,  id_parqueo:idPPeriférico },
    { codigo:'TM-715', placa:'P-715BTM', capacidad:100, estado:'Mantenimiento', id_linea:idL7,  id_parqueo:idPPeriférico },
    // Línea 12 — mayor flota (14 estaciones → mín 14 buses)
    { codigo:'TM-121', placa:'P-121BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-122', placa:'P-122BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-123', placa:'P-123BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-124', placa:'P-124BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-125', placa:'P-125BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-126', placa:'P-126BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-127', placa:'P-127BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-128', placa:'P-128BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-129', placa:'P-129BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-130', placa:'P-130BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-131', placa:'P-131BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-132', placa:'P-132BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-133', placa:'P-133BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-134', placa:'P-134BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-135', placa:'P-135BTM', capacidad:120, estado:'Mantenimiento', id_linea:idL12, id_parqueo:idPCentraSur  },
    { codigo:'TM-136', placa:'P-136BTM', capacidad:120, estado:'Activo',        id_linea:idL12, id_parqueo:idPCentraSur  },
    // Línea 13 — Eje Central
    { codigo:'TM-131A', placa:'P-131ATM', capacidad:100, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-132A', placa:'P-132ATM', capacidad:120, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-133A', placa:'P-133ATM', capacidad:100, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-134A', placa:'P-134ATM', capacidad:120, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-135A', placa:'P-135ATM', capacidad:100, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-136A', placa:'P-136ATM', capacidad:100, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-137A', placa:'P-137ATM', capacidad:120, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-138A', placa:'P-138ATM', capacidad:100, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-139A', placa:'P-139ATM', capacidad:100, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-140A', placa:'P-140ATM', capacidad:120, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-141A', placa:'P-141ATM', capacidad:100, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-142A', placa:'P-142ATM', capacidad:100, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-143A', placa:'P-143ATM', capacidad:100, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-144A', placa:'P-144ATM', capacidad:120, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-145A', placa:'P-145ATM', capacidad:100, estado:'Activo',       id_linea:idL13, id_parqueo:idPZona13     },
    { codigo:'TM-146A', placa:'P-146ATM', capacidad:100, estado:'Inactivo',     id_linea:idL13, id_parqueo:idPZona13     },
    // Línea 18 — Eje Norte
    { codigo:'TM-181', placa:'P-181BTM', capacidad:100, estado:'Activo',        id_linea:idL18, id_parqueo:idPAtlantida  },
    { codigo:'TM-182', placa:'P-182BTM', capacidad:100, estado:'Activo',        id_linea:idL18, id_parqueo:idPAtlantida  },
    { codigo:'TM-183', placa:'P-183BTM', capacidad:100, estado:'Activo',        id_linea:idL18, id_parqueo:idPAtlantida  },
    { codigo:'TM-184', placa:'P-184BTM', capacidad:120, estado:'Activo',        id_linea:idL18, id_parqueo:idPAtlantida  },
    { codigo:'TM-185', placa:'P-185BTM', capacidad:100, estado:'Activo',        id_linea:idL18, id_parqueo:idPAtlantida  },
    { codigo:'TM-186', placa:'P-186BTM', capacidad:100, estado:'Activo',        id_linea:idL18, id_parqueo:idPAtlantida  },
    { codigo:'TM-187', placa:'P-187BTM', capacidad:100, estado:'Activo',        id_linea:idL18, id_parqueo:idPAtlantida  },
    { codigo:'TM-188', placa:'P-188BTM', capacidad:100, estado:'Activo',        id_linea:idL18, id_parqueo:idPAtlantida  },
    { codigo:'TM-189', placa:'P-189BTM', capacidad:100, estado:'Activo',        id_linea:idL18, id_parqueo:idPAtlantida  },
    { codigo:'TM-190', placa:'P-190BTM', capacidad:100, estado:'Activo',        id_linea:idL18, id_parqueo:idPAtlantida  },
    // Buses sin línea asignada (reserva)
    { codigo:'TM-001', placa:'P-001RSV', capacidad:100, estado:'Inactivo',      id_linea:null,  id_parqueo:idPCentraSur  },
    { codigo:'TM-002', placa:'P-002RSV', capacidad:120, estado:'Inactivo',      id_linea:null,  id_parqueo:idPAtlantida  },
  ];

  const busIds = [];
  for (const b of buses) {
    const [id] = await knex('bus').insert(b);
    busIds.push(id);
  }

  // ── 9. PILOTOS ────────────────────────────────────────────────
  const pilotos = [
    { nombre: 'Carlos Méndez',    dpi: '2547889910101', residencia: 'Villa Nueva',          id_bus: busIds[0]  },
    { nombre: 'Luis García',      dpi: '1985442100108', residencia: 'Mixco',                id_bus: busIds[1]  },
    { nombre: 'Ana Morales',      dpi: '2103776540103', residencia: 'Guatemala, zona 7',    id_bus: busIds[2]  },
    { nombre: 'José Ramírez',     dpi: '1779332100101', residencia: 'San Miguel Petapa',    id_bus: busIds[3]  },
    { nombre: 'Pedro Solís',      dpi: '2288114450101', residencia: 'Guatemala, zona 11',   id_bus: busIds[4]  },
    { nombre: 'María Ortiz',      dpi: '1892563700212', residencia: 'Guatemala, zona 6',    id_bus: busIds[5]  },
    { nombre: 'Roberto Cifuentes',dpi: '2001447800303', residencia: 'Guatemala, zona 18',   id_bus: busIds[6]  },
    { nombre: 'Sandra Lemus',     dpi: '1756324900404', residencia: 'Guatemala, zona 2',    id_bus: busIds[7]  },
    { nombre: 'Ernesto Pérez',    dpi: '2230118500505', residencia: 'Mixco',                id_bus: busIds[8]  },
    { nombre: 'Gloria Tepaz',     dpi: '1688994100606', residencia: 'Guatemala, zona 12',   id_bus: busIds[12] },
    { nombre: 'Héctor Juárez',    dpi: '2145677200707', residencia: 'Guatemala, zona 13',   id_bus: busIds[17] },
    { nombre: 'Irma Cárdenas',    dpi: '1923410800808', residencia: 'Guatemala, zona 7',    id_bus: busIds[27] },
    { nombre: 'Jorge Aguilar',    dpi: '2067831400909', residencia: 'Villa Nueva',          id_bus: busIds[44] },
    { nombre: 'Karen Soto',       dpi: '1801254501010', residencia: 'Guatemala, zona 17',   id_bus: busIds[66] },
    { nombre: 'Luis Monterroso',  dpi: '2312099601111', residencia: 'Guatemala, zona 6',    id_bus: busIds[67] },
  ];

  const pilotoIds = [];
  for (const p of pilotos) {
    const [id] = await knex('piloto').insert(p);
    pilotoIds.push(id);
  }

  // ── 10. HISTORIAL EDUCATIVO ───────────────────────────────────
  const cursos = ['Manejo defensivo avanzado','Primeros auxilios','Conducción eficiente','Seguridad vial','Manejo de emergencias'];
  for (let i = 0; i < pilotoIds.length; i++) {
    const numCursos = (i % 3) + 1;
    for (let c = 0; c < numCursos; c++) {
      await knex('historial_educativo').insert({
        id_piloto: pilotoIds[i],
        tipo_licencia: 'Tipo C',
        curso: cursos[(i + c) % cursos.length],
        fecha: `202${(i%4)+1}-0${(c+1)}-15`
      });
    }
  }

  // ── 11. OPERADORES ────────────────────────────────────────────
  const estacionesOp = [idPlazaBarrios, idElTrebol, idCentraSur, idCentraAtlantida, idUSAC, idCentroCivico];
  const nombresOp = ['María López','Juan Pérez','Laura Gómez','Miguel Santos','Rosa Interiano','Diego Alvarado'];
  const opIds = [];
  for (let i = 0; i < estacionesOp.length; i++) {
    const [id] = await knex('operador').insert({ nombre: nombresOp[i], id_estacion: estacionesOp[i] });
    opIds.push(id);
    await knex('turno_operador').insert({ id_operador: id, hora_inicio: i%2===0?'06:00':'14:00', hora_fin: i%2===0?'14:00':'22:00' });
  }

  // ── 12. USUARIOS (contraseñas hasheadas con bcrypt) ───────────
  const hash = async pwd => bcrypt.hash(pwd, 10);
  await knex('usuario').insert([
    { nombre: 'Administrador Sistema', usuario: 'admin',    password_hash: await hash('Admin2026'),  rol: 'administrador' },
    { nombre: 'Walter Vicente',        usuario: 'wvicente', password_hash: await hash('Super2026'),  rol: 'supervisor'    },
    { nombre: 'María López',           usuario: 'mlopez',   password_hash: await hash('Oper2026'),   rol: 'operador'      },
    { nombre: 'Consulta General',      usuario: 'consulta', password_hash: await hash('Cons2026'),   rol: 'consulta'      },
  ]);

  // ── 13. REGISTROS DE OCUPACIÓN INICIALES ─────────────────────
  const ahora = new Date();
  const hace = mins => new Date(ahora - mins*60000).toISOString();

  // Línea 12 en hora pico — saturación (RN-06 simulada en seed)
  await knex('registro_ocupacion').insert([
    { id_bus: busIds[44], id_estacion: idElTrebol,      id_operador: opIds[1], cantidad_pasajeros: 185, porcentaje: 154.2, fecha_hora: hace(3)  },
    { id_bus: busIds[45], id_estacion: idCentraSur,     id_operador: opIds[2], cantidad_pasajeros: 18,  porcentaje: 15.0,  fecha_hora: hace(8)  },
    { id_bus: busIds[46], id_estacion: idPlazaBarrios,  id_operador: opIds[0], cantidad_pasajeros: 195, porcentaje: 162.5, fecha_hora: hace(12) },
    { id_bus: busIds[0],  id_estacion: idPlazaBarrios,  id_operador: opIds[0], cantidad_pasajeros: 72,  porcentaje: 72.0,  fecha_hora: hace(20) },
    { id_bus: busIds[27], id_estacion: idUSAC,          id_operador: opIds[4], cantidad_pasajeros: 90,  porcentaje: 75.0,  fecha_hora: hace(30) },
  ]);

  // Alertas correspondientes
  await knex('alerta').insert([
    { id_bus: busIds[44], id_estacion: idElTrebol,     tipo: 'saturacion',    porcentaje: 154.2, estado: 'pendiente', fecha_hora: hace(3)  },
    { id_bus: busIds[45], id_estacion: idCentraSur,    tipo: 'baja_ocupacion',porcentaje: 15.0,  estado: 'pendiente', fecha_hora: hace(8)  },
    { id_bus: busIds[46], id_estacion: idPlazaBarrios, tipo: 'saturacion',    porcentaje: 162.5, estado: 'pendiente', fecha_hora: hace(12) },
  ]);

  // ── 14. HISTORIAL DE ASIGNACIÓN ───────────────────────────────
  const asignaciones = [
    { id_bus: busIds[0],  id_linea: idL1,  fecha_inicio: '2024-01-01', fecha_fin: null },
    { id_bus: busIds[12], id_linea: idL2,  fecha_inicio: '2024-01-01', fecha_fin: null },
    { id_bus: busIds[17], id_linea: idL6,  fecha_inicio: '2024-02-01', fecha_fin: null },
    { id_bus: busIds[27], id_linea: idL7,  fecha_inicio: '2024-03-01', fecha_fin: null },
    { id_bus: busIds[44], id_linea: idL12, fecha_inicio: '2024-01-01', fecha_fin: null },
    { id_bus: busIds[60], id_linea: idL13, fecha_inicio: '2024-04-01', fecha_fin: null },
    { id_bus: busIds[76], id_linea: idL18, fecha_inicio: '2024-05-01', fecha_fin: null },
  ];
  for (const a of asignaciones) await knex('historial_asignacion_bus').insert(a);

  const totalBuses = await knex('bus').count('id as t').first();
  const totalEst   = await knex('estacion').count('id as t').first();
  console.log(`✅ Seed completado:`);
  console.log(`   ${totalBuses.t} buses | ${totalEst.t} estaciones | 7 líneas reales de Transmetro`);
  console.log(`   Estaciones de transferencia: Plaza Barrios, El Trébol, Centra Sur, Centra Atlántida`);
  console.log(`   Usuarios: admin/Admin2026  wvicente/Super2026  mlopez/Oper2026`);

  await knex.destroy();
}

seed().catch(err => { console.error('❌ Error en seed:', err.message); process.exit(1); });
