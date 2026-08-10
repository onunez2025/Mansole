# Etapa 1: Construcción (Build - Vite 8 requiere Node 22+)
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Etapa 2: Servidor web ultraligero (Nginx) con soporte para SPA
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración Nginx para Single Page Application (SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
