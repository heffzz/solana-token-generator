# 🦄 Esempio Configurazione Phantom Wallet

## 🚀 Avvio Rapido

### 1. Configurazione Interattiva
```bash
npm run configure-wallet
```

### 2. Visualizza Guida Completa
```bash
npm run wallet-guide
```

## 📋 Esempi di Configurazione

### Opzione 1: Solo Monitoraggio (SICURO) ✅
```
Scegli opzione (1/2/3): 1
Inserisci il tuo indirizzo pubblico Phantom: DfX5YGzSsxHis9oHgd3Y64eKe2ESmuZKq9TDrmVvVY84

✅ Configurazione salvata in wallet-config.json
📍 Indirizzo: DfX5YGzSsxHis9oHgd3Y64eKe2ESmuZKq9TDrmVvVY84
🔒 Modalità: Solo monitoraggio (SICURO)
```

**Cosa succede:**
- Salva solo l'indirizzo pubblico
- Nessuna chiave privata memorizzata
- Può solo monitorare il wallet
- Massima sicurezza

### Opzione 2: Controllo Completo (RISCHIO) ⚠️
```
Scegli opzione (1/2/3): 2

🚨 ATTENZIONE: Stai per inserire la tua chiave privata!
   Assicurati che:
   - Nessuno possa vedere il tuo schermo
   - Sei su una connessione sicura
   - Il computer non è compromesso

Vuoi continuare? (si/no): si
Inserisci la chiave privata (da Phantom Export): [1,2,3,4...]

✅ Configurazione completata
📍 Indirizzo: DfX5YGzSsxHis9oHgd3Y64eKe2ESmuZKq9TDrmVvVY84
🔑 Chiave privata salvata in keypair.json
🔒 IMPORTANTE: Aggiungi keypair.json al .gitignore!
```

**Cosa succede:**
- Salva la chiave privata in `keypair.json`
- Controllo completo del wallet
- Può eseguire transazioni
- Aggiunge automaticamente al `.gitignore`

### Opzione 3: Wallet Dedicato (CONSIGLIATO) 🎯
```
Scegli opzione (1/2/3): 3

📝 ISTRUZIONI:
1. Apri Phantom
2. Clicca sull'icona del wallet in alto
3. Clicca "Add / Connect Wallet"
4. Seleziona "Create New Wallet"
5. Salva la nuova seed phrase in modo sicuro
6. Copia l'indirizzo pubblico del nuovo wallet

Inserisci l'indirizzo del nuovo wallet dedicato: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM

✅ Configurazione salvata
📍 Wallet dedicato: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM

💡 PROSSIMI PASSI:
1. Vai su https://faucet.solana.com
2. Seleziona "Devnet"
3. Inserisci l'indirizzo del wallet
4. Richiedi SOL gratuiti per test
```

**Cosa succede:**
- Crei un wallet separato per test
- Mantieni il wallet principale sicuro
- Usi solo fondi dedicati al progetto
- Approccio più sicuro

## 📁 File Generati

### `wallet-config.json`
```json
{
  "mode": "monitoring",
  "wallet": {
    "publicKey": "DfX5YGzSsxHis9oHgd3Y64eKe2ESmuZKq9TDrmVvVY84",
    "note": "Solo monitoraggio - nessuna chiave privata salvata"
  },
  "createdAt": "2025-01-30T22:00:00.000Z"
}
```

### `keypair.json` (solo per controllo completo)
```json
[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]
```

## 🔐 Sicurezza

### ✅ Buone Pratiche
- Usa sempre wallet dedicati per test
- Non condividere mai chiavi private
- Verifica sempre il network (Devnet/Mainnet)
- Mantieni backup sicuri delle seed phrase
- Usa importi minimi per test

### ❌ Cosa Evitare
- Non usare wallet principali per test
- Non salvare chiavi private in cloud
- Non condividere seed phrase
- Non usare password deboli
- Non ignorare gli avvisi di sicurezza

## 🆘 Risoluzione Problemi

### Errore: "Indirizzo pubblico non valido"
- Verifica di aver copiato l'indirizzo completo
- Controlla che non ci siano spazi extra
- Assicurati che sia un indirizzo Solana valido

### Errore: "Chiave privata non valida"
- Verifica il formato (array JSON o base58)
- Controlla che la chiave sia completa
- Assicurati di aver esportato correttamente da Phantom

### Script non risponde
- Premi Ctrl+C per uscire
- Riavvia il terminale
- Verifica che Node.js sia installato correttamente

## 📞 Supporto

Per problemi o domande:
1. Controlla la guida completa: `npm run wallet-guide`
2. Verifica i log nella cartella `logs/`
3. Consulta la documentazione Phantom: [help.phantom.app](https://help.phantom.app)