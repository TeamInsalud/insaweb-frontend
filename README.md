# INSAWEB – Frontend

Aplicación web de INSAWEB para INSALUD: Vite + React + TypeScript + Tailwind. La API está en el
repositorio [insaweb-backend](https://github.com/candresper/insaweb-backend).

Los módulos del menú se muestran según los formularios del usuario en `usuariofor` (ver `src/modulos.tsx`):
Consulta Nómina (`CNFO1203`), Reportes (`COM_FOR`) y Master RRHH (`FONO2301`).

## Desarrollo
Con el backend corriendo en http://localhost:3001:
```bash
npm install
npm run dev            # http://localhost:5173 (envía /api al backend)
```
Para usar otro backend: `API_PROXY=http://10.10.0.6:3001 npm run dev`.

## Despliegue en Coolify
Guía completa para INSALUD: [DESPLIEGUE.md en insaweb-backend](https://github.com/candresper/insaweb-backend/blob/main/DESPLIEGUE.md).

- **Build Pack:** Dockerfile (incluido; no Nixpacks ni "Static"). **Puerto:** 5000 (`Ports Exposes 5000`,
  `Ports Mappings 5000:5000`).
- **Variables de entorno** (ya vienen por defecto con los valores de INSALUD):
  - `PUERTO=5000`: puerto donde escucha nginx.
  - `API_UPSTREAM=http://10.10.0.7:3001`: dirección del backend vista desde el contenedor (no usar
    `localhost` ni `127.0.0.1`). nginx envía `/api` ahí, así la aplicación y la API quedan bajo el mismo
    nombre y puerto (sin CORS).
- Comprobar: `http://10.10.0.7:5000` muestra el ingreso y `http://10.10.0.7:5000/api/salud` responde el
  estado del backend.
- Alternativa (solo si la API se publica en otro nombre o puerto): variable de compilación `VITE_API_URL`
  con la dirección pública de la API, y en el backend `CORS_ORIGIN` con la dirección de esta aplicación.
