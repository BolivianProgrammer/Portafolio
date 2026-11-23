// Reglas de negocio puras (sin base de datos) -> cubiertas por pruebas unitarias.

const CUPO_MIN = 2;
const CUPO_MAX = 20;

function texto(v) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizarNombre(nombre) {
  return String(nombre ?? "").trim().replace(/\s+/g, " ");
}

function validarSesion(datos, ahora = new Date()) {
  if (!datos || typeof datos !== "object") return ["Datos inválidos"];
  const errores = [];

  if (texto(datos.materia).length < 3) errores.push("La materia debe tener al menos 3 caracteres");
  if (!texto(datos.lugar)) errores.push("El lugar es obligatorio");
  if (!normalizarNombre(datos.creador)) errores.push("Tu nombre es obligatorio");

  const cupo = Number(datos.cupo);
  if (!Number.isInteger(cupo) || cupo < CUPO_MIN || cupo > CUPO_MAX) {
    errores.push(`El cupo debe ser un número entero entre ${CUPO_MIN} y ${CUPO_MAX}`);
  }

  const inicio = new Date(datos.inicio);
  if (!datos.inicio || Number.isNaN(inicio.getTime())) errores.push("La fecha de inicio es inválida");
  else if (inicio <= ahora) errores.push("La sesión debe programarse en el futuro");

  return errores;
}

function cuposDisponibles(cupo, inscritos) {
  return Math.max(0, cupo - inscritos);
}

// Devuelve { ok: true } o { ok: false, codigo, motivo }
function puedeUnirse(sesion, participantes, nombre, ahora = new Date()) {
  const n = normalizarNombre(nombre);
  if (!n) return { ok: false, codigo: "NOMBRE_REQUERIDO", motivo: "El nombre es obligatorio" };
  if (new Date(sesion.inicio) <= ahora) return { ok: false, codigo: "YA_COMENZO", motivo: "La sesión ya comenzó" };
  if (participantes.some((p) => p.toLowerCase() === n.toLowerCase())) {
    return { ok: false, codigo: "DUPLICADO", motivo: "Ya estás inscrito en esta sesión" };
  }
  if (cuposDisponibles(sesion.cupo, participantes.length) === 0) {
    return { ok: false, codigo: "LLENA", motivo: "La sesión está llena" };
  }
  return { ok: true };
}

module.exports = { CUPO_MIN, CUPO_MAX, normalizarNombre, validarSesion, cuposDisponibles, puedeUnirse };
