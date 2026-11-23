// Proyectos tomados de github.com/BolivianProgrammer
const GH = "https://github.com/BolivianProgrammer/";

const projects = [
  {
    name: "CompaEstudio (MVP)",
    repo: "Portafolio/tree/main/mvp",
    desc: "Plataforma para organizar sesiones de estudio por materia y horario, con control de cupos. Incluye pruebas unitarias, de integración y E2E, y un pipeline CI/CD con Docker, Terraform y Ansible.",
    tags: ["React", "Express", "PostgreSQL", "Playwright"],
    cat: "web",
  },
  {
    name: "Roguelike VR",
    repo: "Roguelike",
    desc: "Juego roguelike en realidad virtual hecho en Unity, con enemigos, un jefe final y escenarios de bosque.",
    tags: ["Unity", "C#", "VR"],
    cat: "juegos",
  },
  {
    name: "UniSocial: Red Social Univalle",
    repo: "UniSocial",
    desc: "Red social universitaria del proyecto integrador: publicaciones, perfiles y comunidad estudiantil. Incluye manual técnico y de usuario.",
    tags: ["Python", "Web", "Integrador"],
    cat: "web",
    private: true,
  },
  {
    name: "Sistema Hermes",
    repo: "SistemaHermes",
    desc: "Sistema de control de tareas y hojas de ruta para dar seguimiento a trámites dentro de una organización.",
    tags: ["C#", "ASP.NET"],
    cat: "web",
  },
  {
    name: "Agenda Electrónica Intranet",
    repo: "agenda-intranet-tcp",
    desc: "Agenda electrónica para una intranet, con ambiente de pruebas automatizadas (Jest, Cypress + Cucumber) e integración continua.",
    tags: ["JavaScript", "Jest", "Cypress", "CI"],
    cat: "cloud",
    private: true,
  },
  {
    name: "Sistema de Filas",
    repo: "SistemaFilas",
    desc: "Sistema de control de filas y turnos para la atención al cliente de un banco.",
    tags: ["C#", ".NET"],
    cat: "web",
  },
  {
    name: "Oracle Cloud App",
    repo: "oracle-test-app",
    desc: "Aplicación Node.js + Express desplegada en una instancia de cómputo de Oracle Cloud (OCI).",
    tags: ["Node.js", "Express", "OCI"],
    cat: "cloud",
  },
  {
    name: "Docker en OCI",
    repo: "DockerOCI",
    desc: "Contenedores Docker sobre una VM de Oracle Cloud Infrastructure, sirviendo una app web con un framework.",
    tags: ["Docker", "OCI", "Linux"],
    cat: "cloud",
    private: true,
  },
  {
    name: "Infraestructura OCI con Terraform",
    repo: "oci-terraform",
    desc: "Infraestructura como código para aprovisionar recursos en Oracle Cloud usando Terraform.",
    tags: ["Terraform", "HCL", "OCI"],
    cat: "cloud",
    private: true,
  },
  {
    name: "Parcial SQA",
    repo: "ParcialSQA",
    desc: "Examen de Software Quality Assurance: pruebas y aseguramiento de calidad sobre un proyecto en Java.",
    tags: ["Java", "Testing"],
    cat: "cloud",
  },
  {
    name: "WAMVC",
    repo: "WAMVC",
    desc: "Aplicación ASP.NET MVC con manejo de cookies, sesiones y autenticación.",
    tags: ["C#", "ASP.NET MVC"],
    cat: "web",
  },
  {
    name: "Razor DataBase",
    repo: "RazorDataBase",
    desc: "Aplicación Razor Pages conectada a una base de datos con operaciones CRUD.",
    tags: ["C#", "Razor", "SQL"],
    cat: "web",
  },
  {
    name: "ToDo App Razor",
    repo: "ToDoAppRazor",
    desc: "Mi primera página en Razor: gestor de tareas para crear, completar y organizar pendientes.",
    tags: ["C#", "Razor Pages"],
    cat: "web",
  },
  {
    name: "Razor Pedidos",
    repo: "RazorPedidos",
    desc: "Sistema web para registrar y gestionar pedidos, hecho con Razor Pages.",
    tags: ["C#", "Razor", "HTML"],
    cat: "web",
  },
  {
    name: "Demo API Web",
    repo: "DemoApiWeb",
    desc: "Programa que consume y expone una API REST con ASP.NET Core.",
    tags: ["C#", "Web API"],
    cat: "web",
  },
  {
    name: "Procesamiento Digital de Imágenes",
    repo: "PDI26",
    desc: "Prácticas de procesamiento digital de imágenes: filtros, transformaciones y análisis en notebooks.",
    tags: ["Python", "Jupyter"],
    cat: "web",
  },
  {
    name: "Práctica Móvil 4.2",
    repo: "Practica4.2",
    desc: "App Android en Kotlin desarrollada para la materia de Programación Móvil.",
    tags: ["Kotlin", "Android"],
    cat: "movil",
  },
  {
    name: "Programación Móvil",
    repo: "Prog_Movil",
    desc: "Colección de mis trabajos de la materia de Programación Móvil, la mayoría en Kotlin.",
    tags: ["Kotlin", "Android"],
    cat: "movil",
  },
  {
    name: "Snake Game",
    repo: "SnakeGame",
    desc: "Mi primer juego en Unity: el clásico de la serpiente con puntaje y colisiones.",
    tags: ["Unity", "C#"],
    cat: "juegos",
  },
];

const grid = document.getElementById("projects-grid");

function render(filter) {
  const list = filter === "all" ? projects : projects.filter((p) => p.cat === filter);
  grid.innerHTML = list
    .map(
      (p) => `
      <article class="project">
        <div class="project-head">
          <h3>${p.name}</h3>
          ${p.private ? '<span class="badge">Repo privado</span>' : ""}
        </div>
        <p>${p.desc}</p>
        <ul class="tags">${p.tags.map((t) => `<li>${t}</li>`).join("")}</ul>
        ${
          p.private
            ? '<span class="link disabled">Código disponible a pedido</span>'
            : `<a class="link" href="${GH + p.repo}" target="_blank" rel="noopener">Ver en GitHub →</a>`
        }
      </article>`
    )
    .join("");
}

document.querySelectorAll(".filter").forEach((btn) =>
  btn.addEventListener("click", () => {
    document.querySelector(".filter.active").classList.remove("active");
    btn.classList.add("active");
    render(btn.dataset.filter);
  })
);

// Menú móvil
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

document.getElementById("year").textContent = new Date().getFullYear();
render("all");
