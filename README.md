# INSAWEB – Frontend

Aplicación web de INSAWEB para INSALUD: Vite + React + TypeScript + Tailwind. La API está en el
repositorio [insaweb-backend](https://github.com/TeamInsalud/insaweb-backend).

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
- **Build Pack:** Dockerfile (incluido). **Puerto:** 80.
- **Variable de entorno `API_UPSTREAM`:** dirección interna del backend, p. ej. `http://10.10.0.6:3001`.
  nginx envía `/api` a esa dirección, así la aplicación y la API quedan bajo el mismo nombre (sin CORS).
- Alternativa (solo si la API se publica en otro nombre o puerto): variable de compilación `VITE_API_URL`
  con la dirección pública de la API, y en el backend `CORS_ORIGIN` con la dirección de esta aplicación.
