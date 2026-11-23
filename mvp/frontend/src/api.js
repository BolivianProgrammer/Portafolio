async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data.errores || ["Error inesperado"]).join(". "));
  return data;
}

export const api = {
  listar: (materia = "") =>
    request(`/api/sesiones${materia ? `?materia=${encodeURIComponent(materia)}` : ""}`),
  crear: (sesion) => request("/api/sesiones", { method: "POST", body: JSON.stringify(sesion) }),
  unirse: (id, nombre) =>
    request(`/api/sesiones/${id}/unirse`, { method: "POST", body: JSON.stringify({ nombre }) }),
  salir: (id, nombre) =>
    request(`/api/sesiones/${id}/participantes/${encodeURIComponent(nombre)}`, { method: "DELETE" }),
};
