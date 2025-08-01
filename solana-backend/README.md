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

#### Metodo 1: Deploy Automatico con render.yaml
1. Il file `render.yaml` è già configurato nel repository
2. Connetti il repository GitHub a Render
3. Render rileverà automaticamente la configurazione
4. (Opzionale) Aggiungi `SOLSCAN_API_KEY` nelle variabili d'ambiente per dati token completi

#### Metodo 2: Configurazione Manuale
1. Crea un nuovo Web Service su Render
2. Connetti il repository GitHub
3. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Plan**: Free

#### Variabili d'Ambiente Render
Configura queste variabili nel dashboard Render:

**Obbligatorie:**
- `NODE_ENV=production`
- `PORT=10000` (Render usa la porta 10000)
- `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`
- `CORS_ORIGIN=*`

**Opzionali (per funzionalità avanzate):**
- `SOLSCAN_API_KEY=your_api_key` (per dati token reali)
- `GITHUB_TOKEN=your_token` (per integrazione GitHub)

#### Risoluzione Problemi Deploy Render

**Errore: "Cannot find module"**
- Verifica che tutte le dipendenze siano in `package.json`
- Controlla che `npm install` funzioni localmente
- Assicurati che il file `package-lock.json` sia aggiornato

**Errore: "Application failed to respond"**
- Verifica che la porta sia configurata correttamente (`PORT=10000`)
- Controlla che il server si avvii senza errori nei log
- Assicurati che l'endpoint `/api/system/stats` risponda

**Errore: "Build failed"**
- Controlla che Node.js version sia compatibile (>= 16.0.0)
- Verifica che non ci siano errori di sintassi
- Assicurati che tutte le dipendenze siano installabili

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