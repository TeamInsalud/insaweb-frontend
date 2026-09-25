# Frontend de INSAWEB: se compila con Node y se sirve con nginx, que además envía /api al backend.
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Solo si la API se publica en otro nombre o puerto (si no, se deja vacío y se usa el proxy de nginx)
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
# Dirección del backend en el servidor Coolify (10.10.0.7:3001); puede sobreescribirse en Coolify con API_UPSTREAM
ENV API_UPSTREAM=http://10.10.0.7:3001
# Normaliza API_UPSTREAM quitando cualquier '/' final para evitar que nginx recorte el prefijo /api/
RUN printf '#!/bin/sh\nexport API_UPSTREAM="${API_UPSTREAM%%/}"\n' > /docker-entrypoint.d/15-normalize-upstream.envsh && \
    chmod +x /docker-entrypoint.d/15-normalize-upstream.envsh
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:80/" > /dev/null || exit 1
