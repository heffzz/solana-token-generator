// Configurazione per Vercel deployment
// Questo file definisce le variabili d'ambiente per il build

module.exports = {
  env: {
    REACT_APP_API_URL: 'https://solana-token-generator-grmy.onrender.com',
    REACT_APP_ENVIRONMENT: 'production',
    REACT_APP_DEBUG: 'false'
  }
};