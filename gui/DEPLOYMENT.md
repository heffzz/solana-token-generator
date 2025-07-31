# Deployment Guide - Solana Token Generator

Guida completa per il deployment gratuito del sistema autonomo di generazione token SPL su Solana.

## 🎯 Architettura

- **Frontend**: React App (porta 3000/3002)
- **Backend**: Node.js API (porta 3001)
- **Blockchain**: Solana Mainnet

## 🚀 Deployment Gratuito

### Frontend (Vercel - Raccomandato)

1. **Preparazione**
   ```bash
   npm run build
   ```

2. **Deploy su Vercel**
   - Vai su [vercel.com](https://vercel.com)
   - Connetti GitHub repository
   - Importa progetto
   - Configura:
     - Framework: React
     - Build Command: `npm run build`
     - Output Directory: `build`
     - Install Command: `npm install`

3. **Variabili Ambiente**
   - `REACT_APP_API_URL`: URL del backend (es: https://your-backend.onrender.com)

### Backend (Render - Raccomandato)

1. **Preparazione**
   - Usa la cartella `solana-backend/`
   - File necessari: `api-server.js`, `package.json`, `README.md`

2. **Deploy su Render**
   - Vai su [render.com](https://render.com)
   - Crea nuovo Web Service
   - Connetti repository
   - Configura:
     - Environment: Node
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Port: 3001

### Alternative Gratuite

#### Frontend
- **Netlify**: Ottimo per siti statici
- **GitHub Pages**: Semplice ma limitato
- **Firebase Hosting**: Integrazione Google

#### Backend
- **Railway**: $5 credito mensile
- **Fly.io**: Piano gratuito generoso
- **Northflank**: 2 servizi gratuiti

## 🔧 Configurazione CORS

Il backend è già configurato per accettare richieste da qualsiasi origine. Per produzione, aggiorna `api-server.js`:

```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.vercel.app']
}));
```

## 📱 URL Finali

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-api.onrender.com`
- **API Endpoints**: `https://your-api.onrender.com/api/*`

## 🔍 Verifica Deployment

1. **Frontend**: Apri l'URL e verifica che l'interfaccia si carichi
2. **Backend**: Testa `https://your-api.onrender.com/api/system/stats`
3. **Integrazione**: Verifica che i dati vengano caricati correttamente

## 🐛 Troubleshooting

- **CORS Error**: Verifica configurazione CORS nel backend
- **API Not Found**: Controlla URL backend nel frontend
- **Build Failed**: Verifica dipendenze e comandi build
- **Server Error**: Controlla log su Render dashboard

## 📊 Monitoraggio

- **Vercel**: Analytics integrato
- **Render**: Log e metriche in tempo reale
- **Uptime**: Usa servizi come UptimeRobot (gratuito)

## 💡 Ottimizzazioni

- **CDN**: Automatico su Vercel/Netlify
- **Caching**: Configurato in `netlify.toml`
- **Compression**: Automatica su piattaforme cloud
- **SSL**: Certificati gratuiti inclusi