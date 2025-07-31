import { Keypair } from '@solana/web3.js';
import fs from 'fs';

try {
    const keypairData = JSON.parse(fs.readFileSync('./token_project/keypair.json', 'utf8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
    
    console.log('🔑 Token project keypair address:', keypair.publicKey.toString());
    
    // Verifica anche il temp_keypair
    const tempKeypairData = JSON.parse(fs.readFileSync('./temp_keypair.json', 'utf8'));
    const tempKeypair = Keypair.fromSecretKey(new Uint8Array(tempKeypairData));
    
    console.log('🔑 Temp keypair address:', tempKeypair.publicKey.toString());
    
    // Confronta i secret keys
    console.log('🔍 Secret keys match:', JSON.stringify(keypairData) === JSON.stringify(tempKeypairData));
} catch (error) {
    console.error('❌ Errore:', error.message);
}