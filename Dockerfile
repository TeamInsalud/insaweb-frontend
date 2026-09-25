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
# Dirección interna del backend; se cambia en Coolify con la variable API_UPSTREAM
ENV API_UPSTREAM=http://127.0.0.1:3001
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
