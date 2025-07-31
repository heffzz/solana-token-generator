# 🚀 Solana Token Generator

Sistema autonomo per la creazione e distribuzione di token SPL su Solana.

## 🔧 Installazione

```bash
npm install
```

## 🦄 Integrazione Phantom Wallet

### 🚀 **INTEGRAZIONE COMPLETA DISPONIBILE!**

Ho implementato un sistema di integrazione sicura con Phantom che **NON richiede mai seed phrase o chiavi private**.

### ⚡ Avvio Rapido

#### 🎯 **App Completa con GUI Integrata** (Raccomandato)
```bash
# Avvia l'intera applicazione con Phantom integrato
npm run start-app
```
**Accesso:**
- 📱 **GUI React**: http://localhost:3001
- 🦄 **Phantom Wallet**: http://localhost:3001/phantom-wallet
- 🔧 **API Backend**: http://localhost:3000

#### 🌐 **Solo Integrazione Web**
```bash
# Avvia integrazione web (server + browser)
npm run phantom-integration

# Solo server backend
npm run phantom-server

# Guida completa integrazione
npm run phantom-guide
```

### 🔐 Caratteristiche di Sicurezza

✅ **Connessione browser diretta** - Phantom mantiene il controllo  
✅ **Nessuna seed phrase richiesta** - Mai condivisa  
✅ **Solo indirizzi pubblici salvati** - Zero rischi  
✅ **Approvazione transazioni** - Controllo completo utente  
✅ **Network selection** - Devnet/Mainnet supportati  

### 🌐 Interfaccia Web Inclusa

- **Connessione Phantom** con un click
- **Monitoraggio saldo** in tempo reale
- **Airdrop Devnet** per test gratuiti
- **Salvataggio configurazione** sicura
- **Gestione network** Devnet/Mainnet

### 📖 Configurazione Tradizionale (Opzionale)

Se preferisci la configurazione manuale:

```bash
# Guida completa
npm run wallet-guide

# Configuratore interattivo
npm run configure-wallet
```

### Opzioni Disponibili:
1. **Solo Monitoraggio** (SICURO) - Inserisci solo l'indirizzo pubblico
2. **Controllo Completo** (RISCHIO) - Inserisci la chiave privata
3. **Wallet Dedicato** (CONSIGLIATO) - Crea un nuovo wallet per test

## 🎯 Utilizzo

```bash
# Avvia il sistema
npm start

# Esegui i test
npm test

# Genera una nuova keypair
npm run setup

# Modalità sviluppo
npm run dev
```

## ⚙️ Configurazione Avanzata

### Parametri Principali (.env)
```env
# Liquidità totale da distribuire
TOTAL_LIQUIDITY_EUR=100

# Range numero token per ciclo
MIN_TOKENS=10
MAX_TOKENS=50

# DEX abilitati
RAYDIUM_ENABLED=true
ORCA_ENABLED=true
SERUM_ENABLED=true

# Monitoraggio (5 minuti)
MONITORING_INTERVAL_MS=300000

# Auto-correzione
AUTO_FIX_ENABLED=true
```

### Configurazione DEX
Il sistema distribuisce automaticamente la liquidità:
- **Raydium**: 40% della liquidità totale
- **Orca**: 35% della liquidità totale  
- **Serum**: 25% della liquidità totale

### Configurazione Token
```env
# Range supply token
MIN_SUPPLY=1000000      # 1M
MAX_SUPPLY=10000000000  # 10B

# Range decimali
MIN_DECIMALS=6
MAX_DECIMALS=9
```

## 📊 Monitoraggio e Logging

### File di Log
- `logs/token-generator-YYYY-MM-DD.log` - Log principale
- `logs/operations-YYYY-MM-DD.log` - Operazioni importanti
- `logs/errors-YYYY-MM-DD.log` - Solo errori

### Directory Dati
- `data/` - Dati token creati
- `exports/` - Report esportati
- `backups/` - Backup stato sistema

### Statistiche in Tempo Reale
Il sistema mostra:
- 📈 Token creati per ciclo
- 💰 Liquidità totale deployata
- ✅ Tasso di successo operazioni
- 🔧 Auto-fix applicati
- ⏱️ Tempo medio per ciclo

## 🔧 Auto-Correzione

Il sistema rileva e corregge automaticamente:

### Problemi Token
- **Balance insufficiente**: Riminta automaticamente
- **Trading inattivo**: Riattiva sui DEX
- **Metadata corrotti**: Rigenera informazioni

### Problemi DEX
- **Connessione persa**: Riconnette automaticamente
- **Pool non sani**: Applica correzioni
- **Liquidità insufficiente**: Ribilancia

### Problemi Sistema
- **RPC disconnesso**: Cambia endpoint
- **Rate limiting**: Aumenta pause
- **Memoria elevata**: Ottimizza operazioni

## 📈 Performance e Ottimizzazione

### Metriche Tipiche
- **Token/ora**: 20-100 (dipende da configurazione)
- **Tasso successo**: >90% con auto-fix
- **Tempo ciclo**: 5-15 minuti
- **Uptime**: >99% con monitoraggio

### Ottimizzazioni
```env
# Aumenta performance
BATCH_SIZE=10
CONCURRENT_OPERATIONS=5

# Riduce pause
RETRY_DELAY_MS=3000
RATE_LIMIT_DELAY_MS=1000
```

## 🛡️ Sicurezza

### Best Practices
- ✅ Usa sempre devnet per test
- ✅ Mantieni chiavi private sicure
- ✅ Monitora balance wallet
- ✅ Backup regolari configurazione
- ✅ Limita liquidità totale

### Limitazioni Sicurezza
```env
# Limiti automatici
MAX_SUPPLY=10000000000  # Max 10B token
TOTAL_LIQUIDITY_EUR=100 # Max €100
MAX_RETRY_ATTEMPTS=3    # Max 3 tentativi
```

## 🐛 Troubleshooting

### Problemi Comuni

#### "Insufficient funds"
```bash
# Verifica balance
solana balance

# Richiedi airdrop (devnet)
solana airdrop 1
```

#### "RPC connection failed"
```env
# Cambia RPC endpoint
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

#### "Token name already exists"
- Il sistema rileva automaticamente e rigenera
- Controlla log per dettagli validazione

### Debug Mode
```env
# Abilita debug dettagliato
NODE_ENV=development
LOG_LEVEL=DEBUG
```

## 📁 Struttura del Progetto

- `index.js` - Entry point principale
- `tokenGenerator.js` - Generatore di token SPL
- `dexManager.js` - Gestione DEX e liquidità
- `tokenValidator.js` - Validazione e controlli
- `descriptionGenerator.js` - Generazione descrizioni
- `logger.js` - Sistema di logging
- `monitor.js` - Monitoraggio continuo
- `configure-phantom-wallet.js` - Configuratore Phantom
- `phantom-wallet-setup-guide.md` - Guida dettagliata

## 🔐 Sicurezza

### Wallet di Test (Default)
Il sistema genera automaticamente una keypair per i test su Devnet.

### Phantom Wallet (Produzione)
Per usare il tuo wallet Phantom:
1. Esegui `npm run configure-wallet`
2. Scegli l'opzione più sicura per le tue esigenze
3. Segui le istruzioni interattive

### ⚠️ Importante
- **MAI** condividere seed phrase o chiavi private
- Usa wallet dedicati per test
- Verifica sempre il network (Devnet/Mainnet)

## 📊 Monitoraggio

I log sono salvati nella cartella `logs/` e i report nella cartella `reports/`.

## 🔄 Ciclo di Vita Sistema

1. **Inizializzazione**
   - Verifica prerequisiti
   - Carica configurazione
   - Testa connessioni

2. **Generazione**
   - Crea token unici
   - Valida unicità
   - Genera descrizioni

3. **Distribuzione**
   - Lista su DEX
   - Aggiunge liquidità
   - Verifica listing

4. **Monitoraggio**
   - Controlla salute
   - Rileva problemi
   - Applica correzioni

5. **Reportistica**
   - Salva dati
   - Genera statistiche
   - Backup stato

## 📞 Supporto

### Log e Debug
- Controlla sempre i file di log in `logs/`
- Usa `NODE_ENV=development` per debug
- Verifica configurazione con `config.printConfiguration()`

### Risorse Utili
- [Solana Documentation](https://docs.solana.com/)
- [SPL Token Guide](https://spl.solana.com/token)
- [Raydium Docs](https://docs.raydium.io/)
- [Orca Docs](https://docs.orca.so/)

## ⚖️ Disclaimer

⚠️ **IMPORTANTE**: Questo sistema è per scopi educativi e di sviluppo. 

- Testa sempre su devnet prima di mainnet
- Non investire più di quanto puoi permetterti di perdere
- I token generati potrebbero non avere valore
- Le criptovalute sono investimenti ad alto rischio
- Rispetta sempre le leggi locali

## 📄 Licenza

MIT License - Vedi file LICENSE per dettagli.

---

🚀 **Buona generazione di token!** 🚀