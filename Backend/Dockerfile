FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente del backend
COPY . .

# Puerto expuesto
EXPOSE 5000

ENV PORT=5000

CMD ["node", "src/index.js"]
