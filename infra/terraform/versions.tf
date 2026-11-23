terraform {
  required_version = ">= 1.6.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.0.0"
    }
  }

  # Estado remoto en OCI Object Storage mediante una Pre-Authenticated Request (PAR).
  # La URL se pasa con la variable de entorno TF_HTTP_ADDRESS (secreto OCI_STATE_URL).
  backend "http" {
    update_method = "PUT"
  }
}

# Credenciales por variables de entorno: OCI_TENANCY_OCID, OCI_USER_OCID,
# OCI_FINGERPRINT, OCI_PRIVATE_KEY y OCI_REGION.
provider "oci" {}
