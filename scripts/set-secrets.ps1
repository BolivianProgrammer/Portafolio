# Configura los secretos de GitHub Actions para el pipeline del portafolio.
# Ejecutar desde la carpeta del repo:  powershell -ExecutionPolicy Bypass -File scripts\set-secrets.ps1
# gh pedirá cada valor de forma interactiva (no quedan guardados en el historial).

$repo = "BolivianProgrammer/Portafolio"

Write-Host "`n== Docker Hub ==" -ForegroundColor Cyan
Write-Host "Usuario de Docker Hub y un Access Token (hub.docker.com > Account settings > Personal access tokens, permiso Read & Write)."
gh secret set DOCKERHUB_USERNAME -R $repo
gh secret set DOCKERHUB_TOKEN -R $repo

Write-Host "`n== Oracle Cloud (los mismos valores que usaste en oci-terraform) ==" -ForegroundColor Cyan
gh secret set OCI_TENANCY_OCID -R $repo
gh secret set OCI_USER_OCID -R $repo
gh secret set OCI_FINGERPRINT -R $repo
gh secret set OCI_REGION -R $repo

$keyPath = Read-Host "Ruta del archivo .pem de tu API key de OCI (ej. C:\Users\tyler\.oci\oci_api_key.pem)"
Get-Content -Raw $keyPath | gh secret set OCI_KEY_FILE -R $repo

Write-Host "`nURL de una Pre-Authenticated Request (lectura/escritura) NUEVA para el objeto 'portafolio.tfstate'."
Write-Host "No reutilices la de oci-terraform: sobrescribirías el estado de ese laboratorio."
gh secret set OCI_STATE_URL -R $repo

Write-Host "`n== Llave SSH para que Ansible entre a la VM ==" -ForegroundColor Cyan
Get-Content -Raw "$HOME\.ssh\portafolio-oci" | gh secret set VM_SSH_PRIVATE_KEY -R $repo

$cf = Read-Host "`nConfigurar Cloudflare (puntos extra)? Necesitas un dominio en Cloudflare. (s/n)"
if ($cf -eq "s") {
  Write-Host "API Token con permiso Zone > DNS > Edit, y el Zone ID (panel del dominio, columna derecha)."
  gh secret set CLOUDFLARE_API_TOKEN -R $repo
  gh secret set CLOUDFLARE_ZONE_ID -R $repo
  $name = Read-Host "Nombre completo del registro (ej. portafolio.tudominio.com)"
  gh variable set CLOUDFLARE_RECORD_NAME -R $repo --body $name
}

Write-Host "`nListo. Secretos configurados:" -ForegroundColor Green
gh secret list -R $repo
