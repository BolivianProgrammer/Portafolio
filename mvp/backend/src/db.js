const { Pool } = require("pg");

const DEFAULT_URL = "postgres://postgres:postgres@localhost:5432/compaestudio";

function crearPool(url = process.env.DATABASE_URL || DEFAULT_URL) {
  return new Pool({ connectionString: url });
}

async function migrar(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sesiones (
      id          SERIAL PRIMARY KEY,
      materia     TEXT NOT NULL,
      tema        TEXT NOT NULL DEFAULT '',
      lugar       TEXT NOT NULL,
      inicio      TIMESTAMPTZ NOT NULL,
      cupo        INTEGER NOT NULL CHECK (cupo BETWEEN 2 AND 20),
      creador     TEXT NOT NULL,
      creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS participantes (
      id         SERIAL PRIMARY KEY,
      sesion_id  INTEGER NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
      nombre     TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS participantes_unicos
      ON participantes (sesion_id, LOWER(nombre));
  `);
}

module.exports = { crearPool, migrar };
