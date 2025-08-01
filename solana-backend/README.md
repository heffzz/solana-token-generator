# Solana Token Dashboard - Backend API

🚀 **Sistema autonomo di generazione e monitoraggio token SPL su Solana**

Questo backend fornisce API complete per la creazione, monitoraggio e gestione di token SPL sulla blockchain Solana, con integrazione di dati reali tramite API Solscan e connessione diretta alla rete Solana.

## 🌟 Caratteristiche Principali

### 📊 Dati Reali in Tempo Reale
- **Token Trending**: Recupero automatico dei token più popolari tramite API Solscan
- **Metriche di Rete**: Latenza, TPS, stato della blockchain Solana
- **Dati DEX**: Integrazione con Raydium, Orca, Jupiter per liquidità e coppie di trading
- **Statistiche di Sistema**: Monitoraggio continuo delle performance

### 🔧 Funzionalità Tecniche
- **API RESTful** completa per tutte le operazioni
- **Connessione Solana** nativa tramite @solana/web3.js
- **Rate Limiting** intelligente per evitare sovraccarichi
- **Cache System** per ottimizzare le performance
- **Error Handling** robusto con fallback automatici

## 🛠️ Installazione e Setup

### Prerequisiti
- Node.js >= 16.0.0
- npm >= 8.0.0
- Chiave API Solscan (opzionale ma consigliata)

### Installazione

```bash
# Clona il repository
git clone https://github.com/username/solana-token-dashboard.git
cd solana-token-dashboard/solana-backend

# Installa le dipendenze
npm install

# Configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con le tue configurazioni

# Avvia il server
npm start
```

### Configurazione Ambiente (.env)

```env
# Configurazione Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta

# Configurazione API
PORT=3001
NODE_ENV=development

# Configurazione CORS
CORS_ORIGIN=http://localhost:3000

# Configurazione Solscan API
SOLSCAN_API_KEY=your_solscan_api_key_here
SOLSCAN_BASE_URL=https://pro-api.solscan.io/v2.0

# Configurazione Rate Limiting
API_RATE_LIMIT_DELAY=100
API_REQUEST_TIMEOUT=10000

# Configurazione Cache
CACHE_TTL=300000
CACHE_ENABLED=true
```

## 📡 Endpoints API

### Sistema e Statistiche

#### `GET /api/system/stats`
Restituisce statistiche complete del sistema in tempo reale.

#### `GET /api/system/health`
Controllo dello stato di salute del sistema.

#### `GET /api/tokens`
Restituisce la lista dei token reali dalla rete Solana.

## 🚀 Deploy

### Vercel
```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
npm run deploy:vercel
```

### Render
1. Connetti il repository GitHub a Render
2. Configura le variabili d'ambiente
3. Deploy automatico ad ogni push

## 🔧 Sviluppo

### Script Disponibili

```bash
# Sviluppo con auto-reload
npm run dev

# Produzione
npm start

# Build
npm run build

# Test
npm test
```

## 📄 Licenza

Questo progetto è sotto licenza MIT.

---

**Sviluppato con ❤️ per l'ecosistema Solana**