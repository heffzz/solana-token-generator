# 🔧 Guida Setup Sistema Token SPL

## ⚠️ IMPORTANTE: Configurazione Chiave Privata

Il sistema richiede una chiave privata Solana valida per funzionare. Ecco come configurarla:

### Opzione 1: Usa una Chiave Esistente

Se hai già un wallet Solana:

1. **Phantom Wallet**: Vai su Impostazioni → Mostra Chiave Privata
2. **Solflare**: Impostazioni → Esporta Chiave Privata
3. **Solana CLI**: `solana-keygen pubkey ~/.config/solana/id.json`

### Opzione 2: Genera una Nuova Chiave (CONSIGLIATO per TEST)

```bash
# Installa Solana CLI se non presente
# Windows: scaricare da https://docs.solana.com/cli/install-solana-cli-tools

# Genera nuova keypair
solana-keygen new --outfile ./test-keypair.json

# Mostra la chiave privata
solana-keygen pubkey ./test-keypair.json

# Ottieni la chiave privata in base58
cat ./test-keypair.json
```

### Opzione 3: Genera Chiave con Node.js

Esegui questo script per generare una nuova chiave:

```javascript
// generate-keypair.js
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

const keypair = Keypair.generate();
console.log('Public Key:', keypair.publicKey.toString());
console.log('Private Key (base58):', bs58.encode(keypair.secretKey));
console.log('\nAggiungi questa riga al tuo file .env:');
console.log(`SOLANA_PRIVATE_KEY=${bs58.encode(keypair.secretKey)}`);
```

```bash
node generate-keypair.js
```

## 💰 Finanziamento Wallet

### Per Devnet (CONSIGLIATO per TEST)

```bash
# Configura Solana CLI per devnet
solana config set --url https://api.devnet.solana.com

# Richiedi airdrop (fino a 2 SOL)
solana airdrop 2 YOUR_PUBLIC_KEY

# Verifica balance
solana balance YOUR_PUBLIC_KEY
```

### Per Mainnet (SOLO DOPO TEST COMPLETI)

⚠️ **ATTENZIONE**: Mainnet richiede SOL reali. Inizia sempre con devnet!

1. Acquista SOL su un exchange
2. Trasferisci al tuo wallet
3. Cambia RPC URL nel .env: `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`

## 🔧 Configurazione Completa

1. **Copia il file di configurazione**:
   ```bash
   cp .env.example .env
   ```

2. **Modifica il file .env**:
   ```env
   # Configurazione Solana
   SOLANA_RPC_URL=https://api.devnet.solana.com
   SOLANA_PRIVATE_KEY=your_base58_private_key_here
   
   # Impostazioni Token
   TOTAL_LIQUIDITY_EUR=100
   MIN_TOKENS=10
   MAX_TOKENS=50
   
   # DEX abilitati
   RAYDIUM_ENABLED=true
   ORCA_ENABLED=true
   SERUM_ENABLED=true
   ```

3. **Verifica configurazione**:
   ```bash
   node -e "import('./config.js').then(c => console.log('Config OK!'))"
   ```

## 🚀 Avvio Sistema

```bash
# Avvia il sistema autonomo
npm start
```

## 🐛 Risoluzione Problemi

### "SOLANA_PRIVATE_KEY valida è richiesta"
- Verifica che la chiave sia in formato base58
- Controlla che non ci siano spazi extra
- Assicurati che il file .env sia nella directory corretta

### "Insufficient funds"
- Richiedi airdrop su devnet: `solana airdrop 2`
- Verifica balance: `solana balance`

### "RPC connection failed"
- Verifica connessione internet
- Prova un RPC diverso
- Controlla se devnet è operativo

## 📋 Checklist Pre-Avvio

- [ ] File .env configurato
- [ ] Chiave privata valida inserita
- [ ] Wallet finanziato (min 0.1 SOL)
- [ ] RPC URL corretto
- [ ] Directory logs/data/exports/backups create
- [ ] Dipendenze npm installate

## 🔒 Sicurezza

- ✅ Usa sempre devnet per test
- ✅ Non condividere mai la chiave privata
- ✅ Backup sicuro delle chiavi
- ✅ Limita la liquidità totale
- ✅ Monitora le transazioni

---

🎯 **Pronto per iniziare? Esegui `npm start` dopo aver configurato tutto!**