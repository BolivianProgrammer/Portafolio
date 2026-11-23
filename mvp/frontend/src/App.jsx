import { useEffect, useState } from "react";
import { api } from "./api.js";

const VACIO = { materia: "", tema: "", lugar: "", inicio: "", cupo: 4, creador: "" };

function formatearFecha(iso) {
  return new Date(iso).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

function SesionCard({ sesion, onCambio }) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const llena = sesion.disponibles === 0;

  async function unirse(e) {
    e.preventDefault();
    setError("");
    try {
      await api.unirse(sesion.id, nombre);
      setNombre("");
      onCambio();
    } catch (err) {
      setError(err.message);
    }
  }

  async function salir(participante) {
    setError("");
    try {
      await api.salir(sesion.id, participante);
      onCambio();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <article className="card" data-testid="sesion-card">
      <header className="card-head">
        <h3>{sesion.materia}</h3>
        <span className={`badge ${llena ? "full" : ""}`} data-testid="cupos">
          {llena ? "Llena" : `${sesion.disponibles} de ${sesion.cupo} cupos libres`}
        </span>
      </header>
      {sesion.tema && <p className="tema">{sesion.tema}</p>}
      <p className="meta">
        📍 {sesion.lugar} · 🕒 {formatearFecha(sesion.inicio)}
      </p>
      <ul className="participantes" aria-label="Participantes">
        {sesion.participantes.map((p) => (
          <li key={p}>
            {p}
            {p === sesion.creador ? (
              <small> (organiza)</small>
            ) : (
              <button className="link" onClick={() => salir(p)} aria-label={`Quitar a ${p}`}>
                salir
              </button>
            )}
          </li>
        ))}
      </ul>
      <form className="join" onSubmit={unirse}>
        <input
          placeholder="Tu nombre"
          aria-label="Nombre para unirse"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={llena}
        />
        <button type="submit" disabled={llena}>
          Unirme
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}

export default function App() {
  const [sesiones, setSesiones] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [form, setForm] = useState(VACIO);
  const [errorForm, setErrorForm] = useState("");
  const [cargando, setCargando] = useState(true);

  async function cargar(materia = filtro) {
    try {
      setSesiones(await api.listar(materia));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => cargar(filtro), 250);
    return () => clearTimeout(t);
  }, [filtro]);

  function campo(nombre) {
    return {
      value: form[nombre],
      onChange: (e) => setForm({ ...form, [nombre]: e.target.value }),
    };
  }

  async function crear(e) {
    e.preventDefault();
    setErrorForm("");
    try {
      await api.crear({
        ...form,
        cupo: Number(form.cupo),
        inicio: form.inicio ? new Date(form.inicio).toISOString() : "",
      });
      setForm(VACIO);
      cargar();
    } catch (err) {
      setErrorForm(err.message);
    }
  }

  return (
    <div className="app">
      <header className="top">
        <h1>CompaEstudio</h1>
        <p>Organiza sesiones de estudio y encuentra compañeros por materia.</p>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Nueva sesión</h2>
          <form onSubmit={crear} className="form" aria-label="Crear sesión">
            <label>
              Materia
              <input {...campo("materia")} placeholder="Cálculo II" />
            </label>
            <label>
              Tema
              <input {...campo("tema")} placeholder="Integrales por partes" />
            </label>
            <label>
              Lugar
              <input {...campo("lugar")} placeholder="Biblioteca, sala 3" />
            </label>
            <label>
              Fecha y hora
              <input type="datetime-local" {...campo("inicio")} />
            </label>
            <label>
              Cupo
              <input type="number" {...campo("cupo")} />
            </label>
            <label>
              Tu nombre
              <input {...campo("creador")} placeholder="Ana" />
            </label>
            <button type="submit">Crear sesión</button>
            {errorForm && (
              <p className="error" role="alert" data-testid="form-error">
                {errorForm}
              </p>
            )}
          </form>
        </section>

        <section className="lista">
          <input
            className="buscar"
            placeholder="Buscar por materia…"
            aria-label="Buscar por materia"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          {!cargando && sesiones.length === 0 && <p className="vacio">No hay sesiones próximas.</p>}
          <div className="grid">
            {sesiones.map((s) => (
              <SesionCard key={s.id} sesion={s} onCambio={() => cargar()} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
