// @ts-check
const { test, expect } = require("@playwright/test");

// Cada prueba usa una materia única para no depender de las demás.
const unica = (base) => `${base} ${Date.now()}-${Math.floor(Math.random() * 1e4)}`;

function fechaFutura(dias = 3) {
  const d = new Date(Date.now() + dias * 86400000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function crearSesion(page, { materia, cupo = 4, creador = "Ana", lugar = "Biblioteca" }) {
  const form = page.getByRole("form", { name: "Crear sesión" });
  await form.getByLabel("Materia").fill(materia);
  await form.getByLabel("Tema").fill("Repaso general");
  await form.getByLabel("Lugar").fill(lugar);
  await form.getByLabel("Fecha y hora").fill(fechaFutura());
  await form.getByLabel("Cupo").fill(String(cupo));
  await form.getByLabel("Tu nombre").fill(creador);
  await form.getByRole("button", { name: "Crear sesión" }).click();
}

const tarjeta = (page, materia) => page.getByTestId("sesion-card").filter({ hasText: materia });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("la página principal carga con el formulario y el buscador", async ({ page }) => {
  await expect(page).toHaveTitle("CompaEstudio");
  await expect(page.getByRole("heading", { name: "CompaEstudio" })).toBeVisible();
  await expect(page.getByRole("form", { name: "Crear sesión" })).toBeVisible();
  await expect(page.getByLabel("Buscar por materia")).toBeVisible();
});

test("crear una sesión la muestra en la lista con el organizador inscrito", async ({ page }) => {
  const materia = unica("Cálculo");
  await crearSesion(page, { materia, cupo: 4, creador: "Ana" });

  const card = tarjeta(page, materia);
  await expect(card).toBeVisible();
  await expect(card.getByTestId("cupos")).toHaveText("3 de 4 cupos libres");
  await expect(card.getByRole("list", { name: "Participantes" })).toContainText("Ana");
});

test("el formulario muestra los errores de validación del servidor", async ({ page }) => {
  await crearSesion(page, { materia: unica("Física"), cupo: 50 });
  await expect(page.getByTestId("form-error")).toContainText("El cupo debe ser un número entero entre 2 y 20");
});

test("un estudiante puede unirse a una sesión", async ({ page }) => {
  const materia = unica("Redes");
  await crearSesion(page, { materia, cupo: 3 });
  const card = tarjeta(page, materia);

  await card.getByLabel("Nombre para unirse").fill("Luis");
  await card.getByRole("button", { name: "Unirme" }).click();

  await expect(card.getByRole("list", { name: "Participantes" })).toContainText("Luis");
  await expect(card.getByTestId("cupos")).toHaveText("1 de 3 cupos libres");
});

test("no permite inscribirse dos veces con el mismo nombre", async ({ page }) => {
  const materia = unica("Álgebra");
  await crearSesion(page, { materia, creador: "Ana" });
  const card = tarjeta(page, materia);

  await card.getByLabel("Nombre para unirse").fill("ana");
  await card.getByRole("button", { name: "Unirme" }).click();
  await expect(card.getByRole("alert")).toHaveText("Ya estás inscrito en esta sesión");
});

test("una sesión llena se marca como Llena y deshabilita el botón", async ({ page }) => {
  const materia = unica("Compiladores");
  await crearSesion(page, { materia, cupo: 2 });
  const card = tarjeta(page, materia);

  await card.getByLabel("Nombre para unirse").fill("Luis");
  await card.getByRole("button", { name: "Unirme" }).click();

  await expect(card.getByTestId("cupos")).toHaveText("Llena");
  await expect(card.getByRole("button", { name: "Unirme" })).toBeDisabled();
});

test("el buscador filtra las sesiones por materia", async ({ page }) => {
  const sufijo = `${Date.now()}`;
  await crearSesion(page, { materia: `Química ${sufijo}` });
  await crearSesion(page, { materia: `Historia ${sufijo}` });

  await page.getByLabel("Buscar por materia").fill(`Química ${sufijo}`);
  await expect(page.getByTestId("sesion-card")).toHaveCount(1);
  await expect(page.getByTestId("sesion-card")).toContainText(`Química ${sufijo}`);
});

test("un participante puede salir de la sesión y libera su cupo", async ({ page }) => {
  const materia = unica("Estadística");
  await crearSesion(page, { materia, cupo: 3 });
  const card = tarjeta(page, materia);

  await card.getByLabel("Nombre para unirse").fill("Eva");
  await card.getByRole("button", { name: "Unirme" }).click();
  await expect(card.getByTestId("cupos")).toHaveText("1 de 3 cupos libres");

  await card.getByRole("button", { name: "Quitar a Eva" }).click();
  await expect(card.getByRole("list", { name: "Participantes" })).not.toContainText("Eva");
  await expect(card.getByTestId("cupos")).toHaveText("2 de 3 cupos libres");
});
