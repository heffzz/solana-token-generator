import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import dotenv from 'dotenv';

// Carica variabili d'ambiente
dotenv.config();

async function checkWalletBalance() {
    try {
        console.log('🔍 Controllo saldo wallet...');
        
        // Connessione a Solana
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');
        
        // Carica keypair
        let keypair;
        try {
            const keypairData = JSON.parse(fs.readFileSync('./temp_keypair.json', 'utf8'));
            keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
        } catch (error) {
            console.error('❌ Errore nel caricamento del keypair:', error.message);
            return;
        }
        
        console.log(`📍 Indirizzo wallet: ${keypair.publicKey.toString()}`);
        
        // Controlla saldo
        const balance = await connection.getBalance(keypair.publicKey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;
        
        console.log(`💰 Saldo attuale: ${balanceSOL} SOL`);
        
        // Se il saldo è insufficiente, richiedi airdrop
        if (balanceSOL < 1) {
            console.log('⚠️ Saldo insufficiente, richiedo airdrop...');
            
            try {
                const airdropSignature = await connection.requestAirdrop(
                    keypair.publicKey,
                    2 * LAMPORTS_PER_SOL // 2 SOL
                );
                
                console.log('⏳ Attendo conferma airdrop...');
                await connection.confirmTransaction(airdropSignature);
                
                // Controlla nuovo saldo
                const newBalance = await connection.getBalance(keypair.publicKey);
                const newBalanceSOL = newBalance / LAMPORTS_PER_SOL;
                
                console.log(`✅ Airdrop completato! Nuovo saldo: ${newBalanceSOL} SOL`);
                
            } catch (airdropError) {
                console.error('❌ Errore durante airdrop:', airdropError.message);
                console.log('💡 Suggerimento: Visita https://faucet.solana.com per richiedere SOL manualmente');
            }
        } else {
            console.log('✅ Saldo sufficiente per le operazioni');
        }
        
        // Controlla connessione alla rete
        const version = await connection.getVersion();
        const network = rpcUrl.includes('devnet') ? 'devnet' : rpcUrl.includes('testnet') ? 'testnet' : 'mainnet';
        console.log(`🌐 Connesso a Solana ${network} - Versione: ${version['solana-core']}`);
        
    } catch (error) {
        console.error('❌ Errore durante controllo wallet:', error.message);
    }
}

// Esegui controllo
checkWalletBalance();