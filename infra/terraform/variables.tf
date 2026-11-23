variable "compartment_id" {
  description = "OCID del compartimento donde se crean los recursos"
  type        = string
}

variable "ssh_public_key" {
  description = "Llave pública SSH para el usuario ubuntu de la VM"
  type        = string
}

variable "prefix" {
  description = "Prefijo para nombrar los recursos"
  type        = string
  default     = "portafolio"
}

variable "vcn_cidr" {
  type    = string
  default = "10.40.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.40.1.0/24"
}

variable "shape" {
  description = "Shape de la VM (VM.Standard.E2.1.Micro es Always Free)"
  type        = string
  default     = "VM.Standard.E2.1.Micro"
}

variable "flex_ocpus" {
  description = "OCPUs para shapes *.Flex (de pago)"
  type        = number
  default     = 1
}

variable "flex_memory_gbs" {
  description = "Memoria en GB para shapes *.Flex (de pago)"
  type        = number
  default     = 2
}

variable "availability_domain_index" {
  type    = number
  default = 0
}
