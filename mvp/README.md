# CompaEstudio (MVP)

**Encuentra compañeros de estudio por materia y horario.** Un estudiante publica una sesión
(materia, tema, lugar, fecha y cupo) y otros se unen hasta llenar el cupo. El sistema evita
sobrecupos (incluso con inscripciones simultáneas), inscripciones duplicadas y sesiones en el pasado.

**Integrante:** Tyler Wilson

## Stack
| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express 5 |
| Base de datos | PostgreSQL 16 (driver `pg`) |
| Pruebas | Jest (unitarias), Jest + Supertest + PostgreSQL real (integración), Playwright (E2E) |

## Estructura
```
mvp/
├── backend/   API REST (src/) + pruebas unitarias e integración (tests/)
├── frontend/  SPA React
└── e2e/       Pruebas end-to-end con Playwright
```

## API
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado de la API y la BD |
| GET | `/api/sesiones?materia=` | Sesiones futuras (filtro opcional) |
| GET | `/api/sesiones/:id` | Detalle con participantes |
| POST | `/api/sesiones` | Crear sesión (el creador queda inscrito) |
| POST | `/api/sesiones/:id/unirse` | Unirse (`{ "nombre": "Luis" }`) |
| DELETE | `/api/sesiones/:id/participantes/:nombre` | Salir de la sesión |

## Ejecutar localmente
```bash
docker run -d --name compaestudio-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=compaestudio -p 5432:5432 postgres:16-alpine
cd backend  && npm install && npm start        # http://localhost:3000
cd frontend && npm install && npm run dev      # http://localhost:5173
```

## Pruebas
| Tipo | Cantidad | Comando |
|------|----------|---------|
| Unitarias | 13 | `cd backend && npm run test:unit` |
| Integración | 9 | `cd backend && npm run test:integration` (requiere PostgreSQL) |
| E2E | 8 | `cd e2e && npm install && npx playwright install chromium && npm test` |

En GitHub Actions las tres suites se ejecutan en cada push a `dev` y `main`.
