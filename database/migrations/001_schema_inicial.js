// MigraciÃ³n inicial â€” crea las 17 tablas del sistema Transmetro
// Ejecutar con: npx knex migrate:latest --knexfile database/knexfile.js

exports.up = async function(knex) {

  // 1. municipalidad
  await knex.schema.createTable('municipalidad', t => {
    t.increments('id');
    t.string('nombre', 100).notNullable();
    t.string('departamento', 100).notNullable();
  });

  // 2. linea
  await knex.schema.createTable('linea', t => {
    t.increments('id');
    t.string('nombre', 100).notNullable();
    t.string('codigo', 20).notNullable().unique();
    t.decimal('distancia_total', 8, 2).defaultTo(0);
    t.enu('estado', ['Activa', 'Inactiva', 'Saturada']).defaultTo('Activa');
    t.integer('id_municipalidad').references('id').inTable('municipalidad').onDelete('SET NULL');
  });

  // 3. estacion
  await knex.schema.createTable('estacion', t => {
    t.increments('id');
    t.string('nombre', 100).notNullable();
    t.string('ubicacion', 200);
    t.enu('estado', ['Activa', 'Inactiva', 'Mantenimiento']).defaultTo('Activa');
    t.integer('id_municipalidad').references('id').inTable('municipalidad').onDelete('SET NULL');
  });

  // 4. linea_estacion (recorrido ordenado)
  await knex.schema.createTable('linea_estacion', t => {
    t.increments('id');
    t.integer('id_linea').notNullable().references('id').inTable('linea').onDelete('CASCADE');
    t.integer('id_estacion').notNullable().references('id').inTable('estacion').onDelete('CASCADE');
    t.integer('orden').notNullable();
    t.decimal('distancia_tramo', 8, 2).defaultTo(0);
  });

  // 5. acceso
  await knex.schema.createTable('acceso', t => {
    t.increments('id');
    t.integer('id_estacion').notNullable().references('id').inTable('estacion').onDelete('CASCADE');
    t.string('nombre', 100).notNullable();
  });

  // 6. guardia (RN-05: cada acceso tiene mÃ­nimo 1 guardia)
  await knex.schema.createTable('guardia', t => {
    t.increments('id');
    t.integer('id_acceso').notNullable().references('id').inTable('acceso').onDelete('CASCADE');
    t.string('nombre', 100).notNullable();
    t.string('turno', 50);
  });

  // 7. parqueo (RN-04: bus siempre tiene parqueo)
  await knex.schema.createTable('parqueo', t => {
    t.increments('id');
    t.string('nombre', 100).notNullable();
    t.integer('id_estacion').references('id').inTable('estacion').onDelete('SET NULL');
    t.integer('capacidad').defaultTo(0);
  });

  // 8. bus (RN-04: id_parqueo NOT NULL)
  await knex.schema.createTable('bus', t => {
    t.increments('id');
    t.string('codigo', 20).notNullable().unique();
    t.string('placa', 20).notNullable().unique();
    t.integer('capacidad').notNullable();
    t.enu('estado', ['Activo', 'Mantenimiento', 'Inactivo']).defaultTo('Activo');
    t.integer('id_linea').references('id').inTable('linea').onDelete('SET NULL');
    // RN-04: parqueo obligatorio
    t.integer('id_parqueo').notNullable().references('id').inTable('parqueo');
  });

  // 9. piloto
  await knex.schema.createTable('piloto', t => {
    t.increments('id');
    t.string('nombre', 100).notNullable();
    t.string('dpi', 20).notNullable().unique();
    t.string('residencia', 150);
    t.integer('id_bus').references('id').inTable('bus').onDelete('SET NULL');
  });

  // 10. historial_educativo
  await knex.schema.createTable('historial_educativo', t => {
    t.increments('id');
    t.integer('id_piloto').notNullable().references('id').inTable('piloto').onDelete('CASCADE');
    t.string('tipo_licencia', 50);
    t.string('curso', 150);
    t.date('fecha');
  });

  // 11. operador
  await knex.schema.createTable('operador', t => {
    t.increments('id');
    t.string('nombre', 100).notNullable();
    t.integer('id_estacion').references('id').inTable('estacion').onDelete('SET NULL');
  });

  // 12. turno_operador
  await knex.schema.createTable('turno_operador', t => {
    t.increments('id');
    t.integer('id_operador').notNullable().references('id').inTable('operador').onDelete('CASCADE');
    t.string('hora_inicio', 10);
    t.string('hora_fin', 10);
  });

  // 13. registro_ocupacion â€” corazÃ³n del sistema
  await knex.schema.createTable('registro_ocupacion', t => {
    t.increments('id');
    t.integer('id_bus').notNullable().references('id').inTable('bus');
    t.integer('id_estacion').notNullable().references('id').inTable('estacion');
    t.integer('id_operador').references('id').inTable('operador');
    t.integer('cantidad_pasajeros').notNullable();
    t.decimal('porcentaje', 6, 2).notNullable();
    t.timestamp('fecha_hora').defaultTo(knex.fn.now());
  });

  // 14. alerta â€” generada por RN-06 y RN-07
  await knex.schema.createTable('alerta', t => {
    t.increments('id');
    t.integer('id_bus').references('id').inTable('bus');
    t.integer('id_estacion').references('id').inTable('estacion');
    t.enu('tipo', ['saturacion', 'baja_ocupacion']).notNullable();
    t.decimal('porcentaje', 6, 2);
    t.enu('estado', ['pendiente', 'atendida']).defaultTo('pendiente');
    t.timestamp('fecha_hora').defaultTo(knex.fn.now());
  });

  // 15. visita_bus
  await knex.schema.createTable('visita_bus', t => {
    t.increments('id');
    t.integer('id_bus').notNullable().references('id').inTable('bus');
    t.integer('id_estacion').notNullable().references('id').inTable('estacion');
    t.timestamp('fecha_hora').defaultTo(knex.fn.now());
  });

  // 16. usuario â€” contraseÃ±as siempre hasheadas con bcrypt
  await knex.schema.createTable('usuario', t => {
    t.increments('id');
    t.string('nombre', 100).notNullable();
    t.string('usuario', 50).notNullable().unique();
    t.string('password_hash', 100).notNullable();
    t.enu('rol', ['administrador', 'supervisor', 'operador', 'consulta']).defaultTo('consulta');
  });

  // 17. historial_asignacion_bus
  await knex.schema.createTable('historial_asignacion_bus', t => {
    t.increments('id');
    t.integer('id_bus').notNullable().references('id').inTable('bus');
    t.integer('id_linea').notNullable().references('id').inTable('linea');
    t.date('fecha_inicio');
    t.date('fecha_fin');
  });
};

exports.down = async function(knex) {
  const tablas = [
    'historial_asignacion_bus','usuario','visita_bus','alerta',
    'registro_ocupacion','turno_operador','operador','historial_educativo',
    'piloto','bus','parqueo','guardia','acceso','linea_estacion',
    'estacion','linea','municipalidad'
  ];
  for (const t of tablas) await knex.schema.dropTableIfExists(t);
};

