# 🚀 Deployment Automatico - Solana Token Generator

## Passo 1: Preparazione Repository

### Frontend (Cartella principale)
```bash
# Assicurati di essere nella cartella gui
cd c:\Users\luca6\Desktop\crypto\gui

# Crea repository Git (se non esiste)
git init
git add .
git commit -m "Initial commit - Solana Token Generator"

# Collega a GitHub (sostituisci con il tuo repository)
git remote add origin https://github.com/TUO-USERNAME/solana-token-frontend.git
git push -u origin main
```

### Backend (Cartella separata)
```bash
# Vai nella cartella backend
cd c:\Users\luca6\Desktop\crypto\solana-backend

# Crea repository Git separato
git init
git add .
git commit -m "Initial commit - Solana Token Backend API"

# Collega a GitHub (sostituisci con il tuo repository)
git remote add origin https://github.com/TUO-USERNAME/solana-token-backend.git
git push -u origin main
```

## Passo 2: Deploy Backend (Render)

1. **Vai su [render.com](https://render.com)**
2. **Crea account gratuito**
3. **Clicca "New +" → "Web Service"**
4. **Connetti GitHub repository del backend**
5. **Configura:**
   - Name: `solana-token-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Auto-Deploy: `Yes`

6. **Clicca "Create Web Service"**
7. **Copia l'URL generato** (es: `https://solana-token-backend.onrender.com`)

## Passo 3: Deploy Frontend (Vercel)

1. **Vai su [vercel.com](https://vercel.com)**
2. **Crea account gratuito**
3. **Clicca "New Project"**
4. **Importa repository GitHub del frontend**
5. **Configura:**
   - Framework Preset: `Create React App`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

6. **Aggiungi variabile ambiente:**
   - Name: `REACT_APP_API_URL`
   - Value: `https://solana-token-backend.onrender.com` (URL del tuo backend)

7. **Clicca "Deploy"**

## Passo 4: Verifica

### Test Backend
```bash
# Testa l'API del backend
curl https://TUO-BACKEND-URL.onrender.com/api/system/stats
```

### Test Frontend
1. Apri l'URL Vercel del frontend
2. Verifica che i dati si carichino correttamente
3. Controlla la console del browser per errori

## 🔧 Configurazioni Avanzate

### Dominio Personalizzato (Opzionale)

**Vercel:**
- Vai in Project Settings → Domains
- Aggiungi il tuo dominio
- Configura DNS secondo le istruzioni

**Render:**
- Vai in Settings → Custom Domains
- Aggiungi il tuo dominio
- Configura DNS secondo le istruzioni

### Monitoraggio

**UptimeRobot (Gratuito):**
1. Crea account su [uptimerobot.com](https://uptimerobot.com)
2. Aggiungi monitor per backend e frontend
3. Configura notifiche email

### SSL/HTTPS
- **Automatico** su Vercel e Render
- Certificati Let's Encrypt gratuiti

## 🐛 Risoluzione Problemi

### Backend non risponde
```bash
# Controlla log su Render dashboard
# Verifica che le dipendenze siano installate
# Controlla variabili ambiente
```

### Frontend non carica dati
```bash
# Verifica REACT_APP_API_URL in Vercel
# Controlla console browser per errori CORS
# Testa API backend direttamente
```

### Build fallisce
```bash
# Verifica package.json
# Controlla versioni Node.js
# Rimuovi node_modules e reinstalla
```

## 📊 URL Finali

Dopo il deployment avrai:
- **Frontend**: `https://tuo-progetto.vercel.app`
- **Backend**: `https://tuo-backend.onrender.com`
- **API**: `https://tuo-backend.onrender.com/api/*`

## 💰 Costi

- **Vercel**: Completamente gratuito
- **Render**: Completamente gratuito (con limitazioni)
- **Totale**: €0/mese

## 🔄 Aggiornamenti

Per aggiornare:
1. Modifica codice localmente
2. Commit e push su GitHub
3. Deploy automatico su Vercel/Render