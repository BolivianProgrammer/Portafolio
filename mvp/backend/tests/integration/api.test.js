// Pruebas de integración: API Express + PostgreSQL real.
// Requiere DATABASE_URL (por defecto postgres://postgres:postgres@localhost:5432/compaestudio).
const request = require("supertest");
const { createApp } = require("../../src/app");
const { crearPool, migrar } = require("../../src/db");

const pool = crearPool();
const app = createApp(pool);

const enDias = (d) => new Date(Date.now() + d * 86400000).toISOString();
const nueva = (extra = {}) => ({
  materia: "Bases de Datos",
  tema: "Normalización",
  lugar: "Lab 2",
  inicio: enDias(2),
  cupo: 3,
  creador: "Ana",
  ...extra,
});

async function crear(extra) {
  const res = await request(app).post("/api/sesiones").send(nueva(extra));
  expect(res.status).toBe(201);
  return res.body;
}

beforeAll(async () => {
  await migrar(pool);
});

beforeEach(async () => {
  await pool.query("TRUNCATE participantes, sesiones RESTART IDENTITY CASCADE");
});

afterAll(async () => {
  await pool.end();
});

test("GET /api/health responde ok con la base de datos conectada", async () => {
  const res = await request(app).get("/api/health");
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: "ok" });
});

test("POST /api/sesiones guarda la sesión e inscribe al creador", async () => {
  const sesion = await crear();
  expect(sesion).toMatchObject({ id: 1, materia: "Bases de Datos", participantes: ["Ana"], disponibles: 2 });

  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM participantes WHERE sesion_id = $1", [sesion.id]);
  expect(rows[0].n).toBe(1);
});

test("POST /api/sesiones con datos inválidos devuelve 400 y no guarda nada", async () => {
  const res = await request(app).post("/api/sesiones").send(nueva({ cupo: 50, inicio: enDias(-1) }));
  expect(res.status).toBe(400);
  expect(res.body.errores.length).toBe(2);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM sesiones");
  expect(rows[0].n).toBe(0);
});

test("GET /api/sesiones filtra por materia y oculta sesiones pasadas", async () => {
  await crear({ materia: "Física I" });
  await crear({ materia: "Bases de Datos" });
  await pool.query(
    "INSERT INTO sesiones (materia, lugar, inicio, cupo, creador) VALUES ('Física pasada', 'Aula', NOW() - INTERVAL '1 day', 3, 'X')"
  );

  const res = await request(app).get("/api/sesiones").query({ materia: "física" });
  expect(res.status).toBe(200);
  expect(res.body.map((s) => s.materia)).toEqual(["Física I"]);
});

test("POST /api/sesiones/:id/unirse agrega participantes y descuenta cupos", async () => {
  const { id } = await crear();
  const res = await request(app).post(`/api/sesiones/${id}/unirse`).send({ nombre: "Luis" });
  expect(res.status).toBe(200);
  expect(res.body.participantes).toEqual(["Ana", "Luis"]);
  expect(res.body.disponibles).toBe(1);
});

test("unirse dos veces con el mismo nombre devuelve 409", async () => {
  const { id } = await crear();
  await request(app).post(`/api/sesiones/${id}/unirse`).send({ nombre: "Luis" });
  const res = await request(app).post(`/api/sesiones/${id}/unirse`).send({ nombre: " luis " });
  expect(res.status).toBe(409);
  expect(res.body.codigo).toBe("DUPLICADO");
});

test("no permite superar el cupo, incluso con solicitudes simultáneas", async () => {
  const { id } = await crear({ cupo: 2 });
  const resultados = await Promise.all(
    ["Luis", "Eva", "Juan"].map((nombre) => request(app).post(`/api/sesiones/${id}/unirse`).send({ nombre }))
  );
  expect(resultados.filter((r) => r.status === 200)).toHaveLength(1);
  expect(resultados.filter((r) => r.status === 409)).toHaveLength(2);

  const detalle = await request(app).get(`/api/sesiones/${id}`);
  expect(detalle.body.participantes).toHaveLength(2);
});

test("DELETE participante lo quita; el creador no puede salir", async () => {
  const { id } = await crear();
  await request(app).post(`/api/sesiones/${id}/unirse`).send({ nombre: "Luis" });

  expect((await request(app).delete(`/api/sesiones/${id}/participantes/Luis`)).status).toBe(204);
  expect((await request(app).delete(`/api/sesiones/${id}/participantes/Ana`)).status).toBe(400);

  const detalle = await request(app).get(`/api/sesiones/${id}`);
  expect(detalle.body.participantes).toEqual(["Ana"]);
});

test("sesiones inexistentes o ids inválidos devuelven 404/400", async () => {
  expect((await request(app).get("/api/sesiones/999")).status).toBe(404);
  expect((await request(app).post("/api/sesiones/999/unirse").send({ nombre: "Luis" })).status).toBe(404);
  expect((await request(app).get("/api/sesiones/abc")).status).toBe(400);
});
