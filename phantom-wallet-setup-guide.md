# 🦄 Guida Configurazione Phantom Wallet per Solana

## 📱 **Installazione Phantom**

### 1. Download e Installazione
- Vai su [phantom.app](https://phantom.app) (sito ufficiale)
- Scarica l'estensione per il tuo browser (Chrome, Firefox, Edge)
- **⚠️ ATTENZIONE**: Usa SOLO il sito ufficiale per evitare truffe

### 2. Creazione Wallet
1. Apri l'estensione Phantom
2. Clicca "Create New Wallet"
3. Crea una password sicura
4. **IMPORTANTE**: Salva la seed phrase (12 parole) in modo sicuro

## 🔐 **Sicurezza della Seed Phrase**

### ✅ **COSA FARE:**
- Scrivi le 12 parole su carta
- Conserva in un posto sicuro (cassaforte, cassetto chiuso)
- Fai una copia di backup in un altro posto sicuro
- Verifica di aver scritto tutto correttamente

### ❌ **COSA NON FARE MAI:**
- Non condividere la seed phrase con nessuno
- Non salvarla su computer/telefono
- Non inviarla via email/chat
- Non fotografarla
- Non condividerla online

## 🔧 **Configurazione per il Progetto Token**

### Opzione 1: Wallet Dedicato (CONSIGLIATO)
```bash
# Crea un nuovo wallet solo per questo progetto
1. Crea un secondo wallet in Phantom
2. Trasferisci solo i SOL necessari (es. 0.1-1 SOL)
3. Usa questo wallet per i test
```

### Opzione 2: Esportazione Sicura
1. In Phantom, vai su Settings → Export Private Key
2. Inserisci la password
3. Copia la chiave privata
4. Incollala nel file `keypair.json` (SOLO sul tuo computer)

## 🌐 **Configurazione Network**

### Devnet (per test)
1. Apri Phantom
2. Clicca sull'icona delle impostazioni
3. Vai su "Change Network"
4. Seleziona "Devnet"
5. Ottieni SOL gratuiti da [faucet.solana.com](https://faucet.solana.com)

### Mainnet (per produzione)
- Usa solo quando sei sicuro del codice
- Richiede SOL reali
- Costi di transazione reali

## 💰 **Ottenere SOL per Test**

### Devnet (Gratuito)
```bash
# Vai su faucet.solana.com
# Inserisci il tuo indirizzo pubblico
# Ricevi 1-2 SOL gratuiti per test
```

### Mainnet (A pagamento)
- Acquista SOL su exchange (Binance, Coinbase, etc.)
- Trasferisci al tuo wallet Phantom

## 🔗 **Integrazione con il Progetto**

### Metodo Sicuro
```javascript
// Nel file config.js
const config = {
  wallet: {
    publicKey: 'TUO_INDIRIZZO_PUBBLICO_QUI', // Solo indirizzo pubblico
    // NON mettere mai la chiave privata qui
  }
};
```

### Configurazione Locale
```bash
# Crea il file keypair.json SOLO sul tuo computer
# NON condividerlo mai
# Aggiungi al .gitignore se usi Git
echo "keypair.json" >> .gitignore
```

## 📋 **Checklist Sicurezza**

- [ ] Phantom scaricato dal sito ufficiale
- [ ] Seed phrase scritta su carta
- [ ] Seed phrase conservata in posto sicuro
- [ ] Password wallet sicura e unica
- [ ] Network corretto selezionato (Devnet per test)
- [ ] SOL sufficienti per le operazioni
- [ ] Chiavi private MAI condivise online

## 🆘 **Supporto e Problemi**

### Problemi Comuni
1. **Wallet non si connette**: Controlla network e permessi
2. **Transazioni falliscono**: Verifica saldo SOL
3. **Phantom non risponde**: Riavvia browser

### Risorse Utili
- [Documentazione Phantom](https://help.phantom.app)
- [Solana Docs](https://docs.solana.com)
- [Faucet Devnet](https://faucet.solana.com)

---

**⚠️ RICORDA: La sicurezza è fondamentale. Non condividere mai informazioni sensibili del wallet!**