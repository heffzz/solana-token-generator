import { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import fs from 'fs';
import chalk from 'chalk';

async function transferFunds() {
  try {
    console.log(chalk.blue('💸 Trasferimento fondi al wallet del token_project...'));
    
    // Carica il wallet principale (con fondi)
    const mainKeypairData = JSON.parse(fs.readFileSync('./temp_keypair.json', 'utf8'));
    const mainKeypair = Keypair.fromSecretKey(new Uint8Array(mainKeypairData));
    
    // Carica il wallet del token_project (senza fondi)
    const tokenProjectKeypairData = JSON.parse(fs.readFileSync('./token_project/keypair.json', 'utf8'));
    const tokenProjectKeypair = Keypair.fromSecretKey(new Uint8Array(tokenProjectKeypairData));
    
    console.log(`📤 Da: ${mainKeypair.publicKey.toString()}`);
    console.log(`📥 A: ${tokenProjectKeypair.publicKey.toString()}`);
    
    // Connetti a Solana devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Controlla saldi
    const mainBalance = await connection.getBalance(mainKeypair.publicKey);
    const tokenProjectBalance = await connection.getBalance(tokenProjectKeypair.publicKey);
    
    console.log(`💰 Saldo wallet principale: ${mainBalance / 1e9} SOL`);
    console.log(`💰 Saldo wallet token_project: ${tokenProjectBalance / 1e9} SOL`);
    
    if (mainBalance < 0.5 * 1e9) {
      console.log(chalk.red('❌ Saldo insufficiente nel wallet principale'));
      return;
    }
    
    // Crea transazione di trasferimento
    const transferAmount = 0.3 * 1e9; // 0.3 SOL
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: mainKeypair.publicKey,
        toPubkey: tokenProjectKeypair.publicKey,
        lamports: transferAmount,
      })
    );
    
    console.log(chalk.yellow('⏳ Invio transazione...'));
    
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [mainKeypair]
    );
    
    console.log(chalk.green(`✅ Trasferimento completato!`));
    console.log(chalk.blue(`🔗 Signature: ${signature}`));
    
    // Verifica nuovi saldi
    const newMainBalance = await connection.getBalance(mainKeypair.publicKey);
    const newTokenProjectBalance = await connection.getBalance(tokenProjectKeypair.publicKey);
    
    console.log(`💰 Nuovo saldo wallet principale: ${newMainBalance / 1e9} SOL`);
    console.log(`💰 Nuovo saldo wallet token_project: ${newTokenProjectBalance / 1e9} SOL`);
    
  } catch (error) {
    console.error(chalk.red('❌ Errore nel trasferimento:'), error.message);
  }
}

transferFunds();