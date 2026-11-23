# Sube a GitHub solo las credenciales (el resto de valores los configura Claude).
# Ejecutar: powershell -ExecutionPolicy Bypass -File scripts\set-credentials.ps1
$repo = "BolivianProgrammer/Portafolio"

Write-Host "`n1/3 Pega tu token de Docker Hub (clic derecho para pegar) y presiona Enter:" -ForegroundColor Cyan
gh secret set DOCKERHUB_TOKEN -R $repo

Write-Host "`n2/3 Pega la URL de la Pre-Authenticated Request (portafolio.tfstate) y presiona Enter:" -ForegroundColor Cyan
gh secret set OCI_STATE_URL -R $repo

$keyPath = Read-Host "`n3/3 Ruta del archivo .pem de tu API key de OCI (ej. C:\Users\tyler\Downloads\oci_api_key.pem)"
Get-Content -Raw $keyPath | gh secret set OCI_KEY_FILE -R $repo

# Llave SSH que Claude generó para la VM (no requiere escribir nada)
Get-Content -Raw "$HOME\.ssh\portafolio-oci" | gh secret set VM_SSH_PRIVATE_KEY -R $repo

Write-Host "`nListo:" -ForegroundColor Green
gh secret list -R $repo
