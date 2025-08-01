# Usa Node.js 18 LTS
FROM node:18-alpine

# Crea directory app
WORKDIR /usr/src/app

# Copia package.json
COPY package*.json ./

# Installa dipendenze
RUN npm ci --only=production

# Copia codice sorgente
COPY . .

# Esponi porta
EXPOSE 10000

# Crea utente non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Avvia applicazione
CMD ["npm", "start"]