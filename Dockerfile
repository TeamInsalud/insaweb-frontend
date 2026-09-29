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
# Valores de INSALUD (se pueden cambiar en Coolify con variables de entorno):
#   PUERTO: puerto donde escucha la aplicación web dentro del contenedor
#   API_UPSTREAM: dirección del backend VISTA DESDE EL CONTENEDOR (no usar 127.0.0.1/localhost:
#                 dentro del contenedor esa dirección es el propio frontend)
ENV PUERTO=5000
ENV API_UPSTREAM=http://10.10.0.7:3001
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PUERTO}/" > /dev/null || exit 1
