import { Connection, Keypair } from '@solana/web3.js';
import fs from 'fs';
import chalk from 'chalk';

async function checkWallet() {
  try {
    console.log('🔍 Controllo saldo wallet token_project...');
    
    // Carica keypair dal token_project
    const keypairData = JSON.parse(fs.readFileSync('./token_project/keypair.json', 'utf8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
    
    console.log(`📍 Indirizzo wallet: ${keypair.publicKey.toString()}`);
    
    // Connetti a Solana devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Controlla saldo
    const balance = await connection.getBalance(keypair.publicKey);
    const solBalance = balance / 1e9;
    
    console.log(`💰 Saldo attuale: ${solBalance} SOL`);
    
    if (solBalance < 0.1) {
      console.log('⚠️ Saldo insufficiente, richiedo airdrop...');
      
      const airdropSignature = await connection.requestAirdrop(
        keypair.publicKey,
        2 * 1e9 // 2 SOL
      );
      
      console.log('⏳ Attendo conferma airdrop...');
      await connection.confirmTransaction(airdropSignature);
      
      const newBalance = await connection.getBalance(keypair.publicKey);
      const newSolBalance = newBalance / 1e9;
      
      console.log(`✅ Airdrop completato! Nuovo saldo: ${newSolBalance} SOL`);
    } else {
      console.log('✅ Saldo sufficiente!');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

checkWallet();