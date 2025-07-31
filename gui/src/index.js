import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Se vuoi iniziare a misurare le prestazioni nella tua app, passa una funzione
// per registrare i risultati (ad esempio: reportWebVitals(console.log))
// o invia a un endpoint di analisi. Scopri di più: https://bit.ly/CRA-vitals
reportWebVitals();