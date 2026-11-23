# Imagen del portafolio: sitio estático servido por nginx en los puertos 80 y 443.
FROM nginx:1.27-alpine

# Certificado autofirmado para HTTPS en el origen (Cloudflare en modo "Full" lo acepta).
RUN apk add --no-cache openssl \
 && mkdir -p /etc/nginx/ssl \
 && openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
      -subj "/CN=portafolio" \
      -keyout /etc/nginx/ssl/portafolio.key \
      -out /etc/nginx/ssl/portafolio.crt \
 && apk del openssl

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css script.js /usr/share/nginx/html/

EXPOSE 80 443
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
