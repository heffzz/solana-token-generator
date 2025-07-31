# 🌙 LUNACOIN - Sistema Autonomo SPL Token

> **Sistema completamente autonomo per la creazione, gestione e monitoraggio di token SPL su Solana**

![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## 🚀 Panoramica

LUNACOIN è un sistema AI autonomo che gestisce l'intero ciclo di vita di un token SPL su Solana, dalla creazione al monitoraggio continuo, senza intervento umano diretto.

### ✨ Caratteristiche Principali

- 🎯 **Generazione Automatica**: Crea token SPL con configurazione ottimizzata
- 🔍 **Validazione Unicità**: Verifica automaticamente nome e simbolo su blockchain
- 🌊 **Listing DEX**: Integrazione automatica con Raydium, Orca e Jupiter
- 🔒 **Gestione Sicurezza**: Rinuncia autorità e lock liquidità automatici
- 📊 **Monitoraggio 24/7**: Tracking continuo di prezzo, volume e liquidità
- 🔧 **Auto-correzione**: Sistema di bug detection e fixing automatico
- 💾 **Backup Completo**: Sistema di backup crittografato e recovery
- 📈 **Analytics**: Report dettagliati e statistiche in tempo reale

## 🏗️ Architettura del Sistema

```
LUNACOIN System
├── 🚀 Core Engine (index.js)
├── 🎯 Token Generator (tokenGenerator.js)
├── 🔍 Validator (tokenValidator.js)
├── 🌊 DEX Manager (dexManager.js)
├── 📊 Monitor (monitor.js)
├── 💾 Backup Manager (backup.js)
├── 📝 Logger (logger.js)
├── ⚙️ Configuration (config.js)
└── 🧪 Test Suite (test.js)
```

## 📦 Installazione

### Prerequisiti

- **Node.js** >= 16.0.0
- **NPM** >= 8.0.0
- **Git** (opzionale)

### Setup Rapido

```bash
# 1. Clona o scarica il progetto
git clone <repository-url>
cd token_project

# 2. Installa dipendenze
npm install

# 3. Avvia il sistema
npm start
```

### Setup Manuale

```bash
# 1. Installa dipendenze
npm install

# 2. Crea file ambiente
cp .env.example .env

# 3. Configura variabili in .env
# Modifica .env con le tue API key

# 4. Esegui setup iniziale
npm run setup

# 5. Testa il sistema
npm test

# 6. Avvia il sistema
npm start
```

## ⚙️ Configurazione

### File Principali

| File | Descrizione |
|------|-------------|
| `config.js` | Configurazione principale del token |
| `.env` | Variabili d'ambiente e API key |
| `keypair.json` | Chiavi del wallet (MANTIENI SICURO!) |

### Configurazione Token

```javascript
// config.js
module.exports = {
  token: {
    name: 'LUNACOIN',
    symbol: 'LUNA',
    decimals: 9,
    totalSupply: 1000000000, // 1 miliardo
    description: 'Token autonomo della luna 🌙'
  },
  // ... altre configurazioni
};
```

### Variabili Ambiente

```bash
# .env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_PRIVATE_KEY=your_private_key
# ... altre variabili
```

## 🎮 Utilizzo

### Avvio Rapido

```bash
# Avvia il launcher interattivo
npm start

# Avvia direttamente il sistema
npm run system

# Esegui solo test
npm test
```

### Comandi Disponibili

| Comando | Descrizione |
|---------|-------------|
| `npm start` | Avvia launcher interattivo |
| `npm run system` | Avvia sistema completo |
| `npm run generate` | Genera solo token |
| `npm run monitor` | Avvia solo monitoraggio |
| `npm test` | Esegui test sistema |
| `npm run backup` | Crea backup manuale |

### Workflow Tipico

1. **Setup Iniziale**
   ```bash
   npm start
   # Seleziona "🔧 Setup Iniziale"
   ```

2. **Test Sistema**
   ```bash
   npm start
   # Seleziona "🧪 Esegui Test Sistema"
   ```

3. **Generazione Token**
   ```bash
   npm start
   # Seleziona "🚀 Avvia Sistema Completo"
   # Poi "🚀 Genera Nuovo Token"
   ```

4. **Monitoraggio**
   - Il sistema avvia automaticamente il monitoraggio
   - Controlla `./data/` per metriche
   - Controlla `./logs/` per eventi

## 📊 Monitoraggio e Analytics

### Metriche Tracciate

- 💰 **Prezzo**: Tracking in tempo reale
- 📈 **Volume**: Volume di trading 24h
- 💧 **Liquidità**: Liquidità totale nei pool
- 👥 **Holders**: Numero di possessori
- 🔄 **Transazioni**: Conteggio transazioni

### Alert Automatici

- 📉 Calo prezzo > 10%
- 📊 Volume basso < soglia
- 💧 Liquidità insufficiente
- 🚨 Attività sospetta

### Report

- **Giornalieri**: `./reports/daily-YYYY-MM-DD.json`
- **Settimanali**: `./reports/weekly-YYYY-WW.json`
- **Mensili**: `./reports/monthly-YYYY-MM.json`

## 🔒 Sicurezza

### Best Practices Implementate

- ✅ **Rinuncia Autorità**: Mint e freeze authority rinunciate
- ✅ **Lock Liquidità**: Liquidità bloccata per periodo configurabile
- ✅ **Backup Crittografato**: Backup automatici con crittografia
- ✅ **Validazione Input**: Tutti gli input sono validati
- ✅ **Rate Limiting**: Protezione contro spam API

### Raccomandazioni

- 🔐 **Mai condividere** il file `keypair.json`
- 💾 **Backup regolari** in location sicure
- 🧪 **Testa sempre** su devnet prima di mainnet
- 🔍 **Verifica sempre** gli indirizzi dei contratti

## 🌐 Network Supportati

| Network | Descrizione | Uso |
|---------|-------------|-----|
| **Mainnet** | Produzione | Token reali, SOL reali |
| **Devnet** | Test | Token test, SOL gratuiti |
| **Testnet** | Test avanzati | Funzionalità sperimentali |

### Configurazione Network

```javascript
// config.js
solana: {
  network: 'devnet', // 'mainnet', 'devnet', 'testnet'
  rpcUrl: 'https://api.devnet.solana.com'
}
```

## 🔧 Troubleshooting

### Problemi Comuni

#### ❌ "Saldo insufficiente"
```bash
# Su devnet, richiedi SOL dal faucet
solana airdrop 2 <your-address> --url devnet
```

#### ❌ "RPC connection failed"
```bash
# Verifica connessione internet
# Prova RPC alternativo in config.js
```

#### ❌ "Token già esistente"
```bash
# Modifica nome/simbolo in config.js
# Il sistema verifica automaticamente unicità
```

### Log e Debug

```bash
# Controlla log errori
cat ./logs/errors.log

# Controlla log principale
cat ./logs/lunacoin.log

# Esegui test diagnostici
npm test
```

## 📁 Struttura Directory

```
token_project/
├── 📄 File Principali
│   ├── index.js          # Sistema principale
│   ├── start.js          # Launcher
│   ├── config.js         # Configurazione
│   └── package.json      # Dipendenze
│
├── 🔧 Moduli Core
│   ├── tokenGenerator.js # Generatore token
│   ├── tokenValidator.js # Validatore
│   ├── dexManager.js     # Gestione DEX
│   ├── monitor.js        # Monitoraggio
│   ├── backup.js         # Sistema backup
│   └── logger.js         # Logging
│
├── 📊 Dati
│   ├── data/             # Metriche e dati
│   ├── logs/             # File di log
│   ├── reports/          # Report generati
│   └── backups/          # Backup automatici
│
├── ⚙️ Configurazione
│   ├── .env              # Variabili ambiente
│   ├── .env.example      # Template ambiente
│   └── keypair.json      # Chiavi wallet
│
└── 🧪 Test
    └── test.js           # Suite di test
```

## 🤝 Contribuire

### Sviluppo

```bash
# Fork del progetto
git clone <your-fork>
cd token_project

# Installa dipendenze
npm install

# Crea branch feature
git checkout -b feature/nuova-funzionalita

# Sviluppa e testa
npm test

# Commit e push
git commit -m "Aggiunge nuova funzionalità"
git push origin feature/nuova-funzionalita
```

### Linee Guida

- ✅ Testa sempre le modifiche
- ✅ Documenta nuove funzionalità
- ✅ Segui lo stile di codice esistente
- ✅ Aggiungi test per nuove funzioni

## 📈 Roadmap

### Versione 1.1
- [ ] Integrazione Telegram Bot
- [ ] Dashboard Web
- [ ] API REST
- [ ] Mobile App

### Versione 1.2
- [ ] AI Trading Bot
- [ ] Yield Farming
- [ ] NFT Integration
- [ ] Cross-chain Bridge

### Versione 2.0
- [ ] Multi-token Support
- [ ] DAO Governance
- [ ] Advanced Analytics
- [ ] Machine Learning

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE) per dettagli.

## 🆘 Supporto

### Documentazione
- 📖 [Wiki Completa](wiki/)
- 🎥 [Video Tutorial](tutorials/)
- 💬 [FAQ](FAQ.md)

### Community
- 💬 [Discord](https://discord.gg/lunacoin)
- 🐦 [Twitter](https://twitter.com/lunacoin)
- 📧 [Email](mailto:support@lunacoin.dev)

### Bug Report
- 🐛 [Issues GitHub](https://github.com/lunacoin/issues)
- 📧 [Email Bug](mailto:bugs@lunacoin.dev)

---

<div align="center">

**🌙 LUNACOIN - Il Futuro dei Token Autonomi 🌙**

*Creato con ❤️ per la community Solana*

[![Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=flat-square&logo=solana)](https://solana.com)
[![Node.js](https://img.shields.io/badge/Powered%20by-Node.js-43853D?style=flat-square&logo=node.js)](https://nodejs.org)
[![MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>