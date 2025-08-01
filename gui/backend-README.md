# Solana Token Backend API

Backend API per il sistema autonomo di generazione token SPL su Solana.

## Caratteristiche

- API REST per statistiche sistema
- Integrazione con Solana mainnet
- Monitoraggio salute rete
- Gestione log e configurazione
- CORS abilitato per frontend

## Endpoints API

- `GET /api/system/stats` - Statistiche sistema
- `GET /api/system/logs` - Log sistema
- `GET /api/config` - Configurazione

## Deployment Gratuito

### Render (Raccomandato)

1. Crea account su [render.com](https://render.com)
2. Connetti repository GitHub
3. Crea nuovo Web Service
4. Configura:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
   - Port: 10000

### Railway

1. Crea account su [railway.app](https://railway.app)
2. Deploy da GitHub
3. Configura variabili ambiente se necessario

### Fly.io

1. Installa Fly CLI
2. `fly launch`
3. `fly deploy`

## Variabili Ambiente

- `PORT` - Porta server (default: 10000)
- `SOLANA_RPC_URL` - URL RPC Solana (default: mainnet)

## Installazione Locale

```bash
npm install
npm start
```

Server disponibile su http://localhost:10000