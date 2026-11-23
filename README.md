# Portafolio: Tyler Wilson

Portafolio web personal + MVP **CompaEstudio** + pipeline CI/CD para Proyecto de Sistemas 3, Univalle.

- Sitio: https://bolivianprogrammer.github.io/Portafolio/ (GitHub Pages) y en la VM de OCI tras el despliegue
- MVP: [`mvp/`](mvp/README.md) (React + Express + PostgreSQL, con pruebas unitarias, de integración y E2E)

## Estructura
```
├── index.html, styles.css, script.js   Portafolio (sitio estático)
├── Dockerfile, docker-compose.yml       Imagen nginx (puertos 80 y 443)
├── docker/nginx.conf
├── mvp/                                 Proyecto MVP + pruebas
├── infra/terraform/                     VCN, subnet pública, security list y VM Ubuntu 24.04 con IP pública (OCI)
├── infra/ansible/playbook.yml           Docker, Git, firewall (ufw + iptables 80/443) y despliegue
├── scripts/set-secrets.ps1              Configura los secretos de GitHub Actions
└── .github/workflows/pipeline.yml       Pipeline CI/CD
```

## Pipeline (`.github/workflows/pipeline.yml`)
| Rama | Qué hace |
|------|----------|
| `dev` | Pruebas unitarias → integración (PostgreSQL como service) → E2E (Playwright) |
| `main` | Las mismas pruebas → build y push de la imagen a Docker Hub → `terraform apply` (VM Ubuntu 24.04, VCN, subnet, IP pública) → Ansible configura la VM y levanta el contenedor → (extra) Cloudflare Tunnel publica el sitio en una URL `https://*.trycloudflare.com` (y registro DNS si hay dominio propio) |

El estado de Terraform se guarda en OCI Object Storage (backend `http` con una Pre-Authenticated Request), así cada push a `main` actualiza la misma infraestructura en vez de crear otra VM.

## Secretos y variables requeridos
| Nombre | Tipo | Uso |
|--------|------|-----|
| `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | secret | Publicar la imagen |
| `OCI_TENANCY_OCID`, `OCI_USER_OCID`, `OCI_FINGERPRINT`, `OCI_KEY_FILE`, `OCI_REGION` | secret | Proveedor OCI de Terraform |
| `OCI_STATE_URL` | secret | PAR de lectura/escritura para `portafolio.tfstate` |
| `VM_SSH_PRIVATE_KEY` | secret | Ansible entra por SSH a la VM |
| `VM_SSH_PUBLIC_KEY` | variable | Se instala en la VM |
| `OCI_COMPARTMENT_OCID` | variable (opcional) | Compartimento; por defecto el tenancy raíz |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` | secret (opcional) | Extra: dominio con Cloudflare |
| `CLOUDFLARE_RECORD_NAME` | variable (opcional) | Ej. `portafolio.midominio.com` |

Configúralos con: `powershell -ExecutionPolicy Bypass -File scripts\set-secrets.ps1`

## Ejecutar el portafolio con Docker
```bash
docker compose up --build    # http://localhost  y  https://localhost (certificado autofirmado)
```
