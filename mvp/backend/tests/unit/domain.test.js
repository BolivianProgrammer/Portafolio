const {
  validarSesion,
  puedeUnirse,
  cuposDisponibles,
  normalizarNombre,
} = require("../../src/domain");

const AHORA = new Date("2026-11-23T12:00:00Z");
const MANANA = "2026-11-24T15:00:00Z";
const AYER = "2026-11-22T15:00:00Z";

const sesionValida = () => ({
  materia: "Cálculo II",
  tema: "Integrales",
  lugar: "Biblioteca",
  inicio: MANANA,
  cupo: 4,
  creador: "Ana",
});

describe("validarSesion", () => {
  test("acepta una sesión válida sin errores", () => {
    expect(validarSesion(sesionValida(), AHORA)).toEqual([]);
  });

  test("rechaza materias de menos de 3 caracteres", () => {
    const errores = validarSesion({ ...sesionValida(), materia: "  C " }, AHORA);
    expect(errores).toContain("La materia debe tener al menos 3 caracteres");
  });

  test("rechaza cupos fuera del rango 2-20 o no enteros", () => {
    for (const cupo of [1, 21, 3.5, "abc"]) {
      expect(validarSesion({ ...sesionValida(), cupo }, AHORA)).toContain(
        "El cupo debe ser un número entero entre 2 y 20"
      );
    }
  });

  test("rechaza sesiones en el pasado", () => {
    expect(validarSesion({ ...sesionValida(), inicio: AYER }, AHORA)).toContain(
      "La sesión debe programarse en el futuro"
    );
  });

  test("rechaza fechas inválidas y campos obligatorios vacíos", () => {
    const errores = validarSesion({ ...sesionValida(), inicio: "no-es-fecha", lugar: "", creador: " " }, AHORA);
    expect(errores).toEqual(
      expect.arrayContaining(["La fecha de inicio es inválida", "El lugar es obligatorio", "Tu nombre es obligatorio"])
    );
  });

  test("rechaza datos que no son un objeto", () => {
    expect(validarSesion(null, AHORA)).toEqual(["Datos inválidos"]);
  });
});

describe("puedeUnirse", () => {
  const sesion = { inicio: MANANA, cupo: 3 };

  test("permite unirse si hay cupo y no está inscrito", () => {
    expect(puedeUnirse(sesion, ["Ana"], "Luis", AHORA)).toEqual({ ok: true });
  });

  test("detecta inscripciones duplicadas sin importar mayúsculas ni espacios", () => {
    const r = puedeUnirse(sesion, ["Ana Pérez"], "  ana   PÉREZ ", AHORA);
    expect(r).toMatchObject({ ok: false, codigo: "DUPLICADO" });
  });

  test("rechaza cuando la sesión está llena", () => {
    expect(puedeUnirse(sesion, ["Ana", "Luis", "Eva"], "Juan", AHORA)).toMatchObject({ ok: false, codigo: "LLENA" });
  });

  test("rechaza cuando la sesión ya comenzó", () => {
    expect(puedeUnirse({ inicio: AYER, cupo: 3 }, [], "Juan", AHORA)).toMatchObject({ ok: false, codigo: "YA_COMENZO" });
  });

  test("exige un nombre", () => {
    expect(puedeUnirse(sesion, [], "   ", AHORA)).toMatchObject({ ok: false, codigo: "NOMBRE_REQUERIDO" });
  });
});

describe("utilidades", () => {
  test("cuposDisponibles nunca es negativo", () => {
    expect(cuposDisponibles(4, 1)).toBe(3);
    expect(cuposDisponibles(2, 5)).toBe(0);
  });

  test("normalizarNombre recorta y colapsa espacios", () => {
    expect(normalizarNombre("  Ana    María ")).toBe("Ana María");
    expect(normalizarNombre(undefined)).toBe("");
  });
});
