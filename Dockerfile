# ====================================================================
# DOCKERFILE MONOLÍTICO (UN SOLO SERVICIO PARA EASYPANEL / HOSTINGER)
# ====================================================================

# Etapa 1: Compilar Frontend (React + Vite)
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY Frontend/package*.json ./
RUN npm ci

COPY Frontend/ .
ENV VITE_API_URL=/api
RUN npm run build

# Etapa 2: Contenedor Final (Express Backend + Frontend Estático)
FROM node:18-alpine
WORKDIR /app

COPY Backend/package*.json ./
RUN npm ci --only=production

COPY Backend/ .

# Copiar estáticos compilados del Frontend a public/ en Backend
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 5000
ENV PORT=5000

CMD ["node", "src/index.js"]
