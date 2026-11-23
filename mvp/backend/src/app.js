const express = require("express");
const { validarSesion, puedeUnirse, normalizarNombre, cuposDisponibles } = require("./domain");

const SELECT_SESIONES = `
  SELECT s.*,
         COALESCE(array_agg(p.nombre ORDER BY p.id) FILTER (WHERE p.id IS NOT NULL), '{}') AS participantes
  FROM sesiones s
  LEFT JOIN participantes p ON p.sesion_id = s.id`;

function mapSesion(r) {
  return {
    id: r.id,
    materia: r.materia,
    tema: r.tema,
    lugar: r.lugar,
    inicio: r.inicio,
    cupo: r.cupo,
    creador: r.creador,
    participantes: r.participantes,
    disponibles: cuposDisponibles(r.cupo, r.participantes.length),
  };
}

function idValido(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ errores: ["Id inválido"] });
    return null;
  }
  return id;
}

async function buscarSesion(db, id) {
  const { rows } = await db.query(`${SELECT_SESIONES} WHERE s.id = $1 GROUP BY s.id`, [id]);
  return rows[0] ? mapSesion(rows[0]) : null;
}

function createApp(pool) {
  const app = express();
  app.use(express.json());

  app.get("/api/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  });

  // Lista sesiones futuras, con filtro opcional por materia
  app.get("/api/sesiones", async (req, res) => {
    const materia = typeof req.query.materia === "string" ? req.query.materia.trim() : "";
    const params = [];
    let where = "WHERE s.inicio > NOW()";
    if (materia) {
      params.push(`%${materia}%`);
      where += " AND s.materia ILIKE $1";
    }
    const { rows } = await pool.query(`${SELECT_SESIONES} ${where} GROUP BY s.id ORDER BY s.inicio ASC`, params);
    res.json(rows.map(mapSesion));
  });

  app.get("/api/sesiones/:id", async (req, res) => {
    const id = idValido(req, res);
    if (!id) return;
    const sesion = await buscarSesion(pool, id);
    if (!sesion) return res.status(404).json({ errores: ["Sesión no encontrada"] });
    res.json(sesion);
  });

  // Crea una sesión; el creador queda inscrito automáticamente
  app.post("/api/sesiones", async (req, res) => {
    const errores = validarSesion(req.body);
    if (errores.length) return res.status(400).json({ errores });

    const { materia, tema, lugar, inicio, cupo } = req.body;
    const creador = normalizarNombre(req.body.creador);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO sesiones (materia, tema, lugar, inicio, cupo, creador)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [materia.trim(), (tema || "").trim(), lugar.trim(), new Date(inicio), Number(cupo), creador]
      );
      await client.query("INSERT INTO participantes (sesion_id, nombre) VALUES ($1, $2)", [rows[0].id, creador]);
      await client.query("COMMIT");
      res.status(201).json(await buscarSesion(pool, rows[0].id));
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  // Unirse a una sesión (con bloqueo de fila para evitar sobrecupo concurrente)
  app.post("/api/sesiones/:id/unirse", async (req, res) => {
    const id = idValido(req, res);
    if (!id) return;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const s = await client.query("SELECT * FROM sesiones WHERE id = $1 FOR UPDATE", [id]);
      if (!s.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(404).json({ errores: ["Sesión no encontrada"] });
      }
      const p = await client.query("SELECT nombre FROM participantes WHERE sesion_id = $1", [id]);
      const nombres = p.rows.map((r) => r.nombre);
      const resultado = puedeUnirse(s.rows[0], nombres, req.body?.nombre);
      if (!resultado.ok) {
        await client.query("ROLLBACK");
        const status = resultado.codigo === "NOMBRE_REQUERIDO" ? 400 : 409;
        return res.status(status).json({ errores: [resultado.motivo], codigo: resultado.codigo });
      }
      await client.query("INSERT INTO participantes (sesion_id, nombre) VALUES ($1, $2)", [
        id,
        normalizarNombre(req.body.nombre),
      ]);
      await client.query("COMMIT");
      res.json(await buscarSesion(pool, id));
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  // Salir de una sesión (el creador no puede abandonarla)
  app.delete("/api/sesiones/:id/participantes/:nombre", async (req, res) => {
    const id = idValido(req, res);
    if (!id) return;
    const sesion = await buscarSesion(pool, id);
    if (!sesion) return res.status(404).json({ errores: ["Sesión no encontrada"] });
    const nombre = normalizarNombre(req.params.nombre);
    if (nombre.toLowerCase() === sesion.creador.toLowerCase()) {
      return res.status(400).json({ errores: ["El creador no puede abandonar su propia sesión"] });
    }
    const { rowCount } = await pool.query(
      "DELETE FROM participantes WHERE sesion_id = $1 AND LOWER(nombre) = LOWER($2)",
      [id, nombre]
    );
    if (!rowCount) return res.status(404).json({ errores: ["Participante no encontrado"] });
    res.status(204).end();
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ errores: ["Error interno del servidor"] });
  });

  return app;
}

module.exports = { createApp };
