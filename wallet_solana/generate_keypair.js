// Script per generare una nuova coppia di chiavi Solana

// Questo script utilizza la libreria @solana/web3.js per generare una nuova coppia di chiavi
// per la blockchain Solana. La coppia di chiavi include una chiave pubblica (indirizzo del wallet)
// e una chiave privata.

// Per eseguire questo script, è necessario installare Node.js e la libreria @solana/web3.js
// npm install @solana/web3.js

const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Genera una nuova coppia di chiavi
const generateNewKeypair = () => {
  const keypair = Keypair.generate();
  
  // Converti la chiave privata in un array di numeri
  const privateKey = Array.from(keypair.secretKey);
  
  // Ottieni l'indirizzo pubblico
  const publicKey = keypair.publicKey.toString();
  
  return {
    publicKey,
    privateKey,
  };
};

// Salva la coppia di chiavi in un file JSON
const saveKeypairToFile = (keypair, filename) => {
  const data = JSON.stringify(keypair, null, 2);
  fs.writeFileSync(filename, data);
  console.log(`Coppia di chiavi salvata in ${filename}`);
};

// Genera e salva una nuova coppia di chiavi
const newKeypair = generateNewKeypair();
saveKeypairToFile(newKeypair, 'solana_keypair.json');

console.log('Indirizzo pubblico (Public Key):', newKeypair.publicKey);
console.log('Chiave privata generata e salvata nel file solana_keypair.json');
console.log('IMPORTANTE: Conserva la tua chiave privata in un luogo sicuro e non condividerla mai con nessuno!');