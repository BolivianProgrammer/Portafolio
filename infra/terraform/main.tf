data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

# Imagen oficial más reciente de Ubuntu 24.04 (x86_64, no "Minimal") compatible con el shape
data "oci_core_images" "ubuntu_2404" {
  compartment_id           = var.compartment_id
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = var.shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"

  filter {
    name   = "display_name"
    values = ["^Canonical-Ubuntu-24\\.04-[0-9]{4}\\..*"]
    regex  = true
  }
}

############################################
# Red: VCN, Internet Gateway, rutas y seguridad
############################################

resource "oci_core_vcn" "vcn" {
  compartment_id = var.compartment_id
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${var.prefix}-vcn"
  dns_label      = "portafoliovcn"
}

resource "oci_core_internet_gateway" "igw" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.prefix}-igw"
  enabled        = true
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.prefix}-public-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.igw.id
  }
}

# Firewall a nivel de red: solo SSH (22), HTTP (80) y HTTPS (443) de entrada
resource "oci_core_security_list" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.prefix}-public-sl"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  dynamic "ingress_security_rules" {
    for_each = toset([22, 80, 443])
    content {
      protocol    = "6" # TCP
      source      = "0.0.0.0/0"
      description = "Puerto ${ingress_security_rules.value}"
      tcp_options {
        min = ingress_security_rules.value
        max = ingress_security_rules.value
      }
    }
  }
}

resource "oci_core_subnet" "public" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.vcn.id
  cidr_block                 = var.public_subnet_cidr
  display_name               = "${var.prefix}-public-subnet"
  dns_label                  = "public"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = false
}

############################################
# VM Ubuntu 24.04 con IP pública
############################################

resource "oci_core_instance" "vm" {
  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[var.availability_domain_index].name
  display_name        = "${var.prefix}-vm"
  shape               = var.shape

  # Solo los shapes Flex (p. ej. VM.Standard.E4.Flex) requieren OCPUs/memoria
  dynamic "shape_config" {
    for_each = endswith(var.shape, ".Flex") ? [1] : []
    content {
      ocpus         = var.flex_ocpus
      memory_in_gbs = var.flex_memory_gbs
    }
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.ubuntu_2404.images[0].id
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    assign_public_ip = true
    display_name     = "${var.prefix}-vnic"
    hostname_label   = "portafolio"
  }

  metadata = {
    ssh_authorized_keys = trimspace(var.ssh_public_key)
  }

  # Evita recrear la VM cada vez que Oracle publica una imagen nueva
  lifecycle {
    ignore_changes = [source_details]
  }
}
