output "public_ip" {
  description = "IP pública de la VM"
  value       = oci_core_instance.vm.public_ip
}

output "vcn_id" {
  value = oci_core_vcn.vcn.id
}

output "subnet_id" {
  value = oci_core_subnet.public.id
}

output "image_name" {
  value = data.oci_core_images.ubuntu_2404.images[0].display_name
}
