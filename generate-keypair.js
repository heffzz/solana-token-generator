import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔑 Generazione Keypair per Test...');

// Genera nuova keypair
const keypair = Keypair.generate();
const publicKey = keypair.publicKey.toString();
const privateKeyBase58 = bs58.encode(keypair.secretKey);

console.log('\n✅ Keypair generata con successo!');
console.log('📍 Public Key:', publicKey);
console.log('🔐 Private Key (base58):', privateKeyBase58);

// Leggi il file .env esistente
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
    console.log('⚠️  File .env non trovato, creazione nuovo file...');
    // Copia da .env.example se esiste
    try {
        const examplePath = path.join(__dirname, '.env.example');
        envContent = fs.readFileSync(examplePath, 'utf8');
    } catch (err) {
        console.log('⚠️  .env.example non trovato, creazione configurazione base...');
        envContent = `# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your_base58_private_key_here

# Token Generation Settings
TOTAL_LIQUIDITY_EUR=100
MIN_TOKENS=10
MAX_TOKENS=50

# DEX Configuration
RAYDIUM_ENABLED=true
ORCA_ENABLED=true
SERUM_ENABLED=true

# Monitoring
MONITORING_INTERVAL_MS=300000
AUTO_FIX_ENABLED=true

# Performance Settings
BATCH_SIZE=5
CONCURRENT_OPERATIONS=3
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=5000

# Security Settings
MAX_SUPPLY=10000000000
MIN_SUPPLY=1000000
MAX_DECIMALS=9
MIN_DECIMALS=6

# Logging
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=7
NODE_ENV=development`;
    }
}

// Aggiorna la chiave privata nel contenuto
if (envContent.includes('SOLANA_PRIVATE_KEY=')) {
    envContent = envContent.replace(
        /SOLANA_PRIVATE_KEY=.*/,
        `SOLANA_PRIVATE_KEY=${privateKeyBase58}`
    );
} else {
    envContent += `\nSOLANA_PRIVATE_KEY=${privateKeyBase58}`;
}

// Assicurati che sia configurato per devnet
if (envContent.includes('SOLANA_RPC_URL=')) {
    envContent = envContent.replace(
        /SOLANA_RPC_URL=.*/,
        'SOLANA_RPC_URL=https://api.devnet.solana.com'
    );
} else {
    envContent += '\nSOLANA_RPC_URL=https://api.devnet.solana.com';
}

// Salva il file .env aggiornato
try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ File .env aggiornato con successo!');
} catch (error) {
    console.error('❌ Errore nel salvare il file .env:', error.message);
    process.exit(1);
}

// Salva anche la keypair in formato JSON per backup
const keypairData = {
    publicKey: publicKey,
    privateKey: privateKeyBase58,
    secretKey: Array.from(keypair.secretKey)
};

try {
    const backupPath = path.join(__dirname, 'backups', 'test-keypair.json');
    fs.writeFileSync(backupPath, JSON.stringify(keypairData, null, 2));
    console.log('💾 Backup keypair salvato in:', backupPath);
} catch (error) {
    console.log('⚠️  Impossibile salvare backup keypair:', error.message);
}

console.log('\n🎯 Prossimi passi:');
console.log('1. Richiedi airdrop devnet:');
console.log(`   solana airdrop 2 ${publicKey} --url https://api.devnet.solana.com`);
console.log('2. Verifica balance:');
console.log(`   solana balance ${publicKey} --url https://api.devnet.solana.com`);
console.log('3. Avvia il sistema:');
console.log('   npm start');

console.log('\n⚠️  IMPORTANTE:');
console.log('- Questa è una keypair di TEST per devnet');
console.log('- NON usare mai questa chiave su mainnet');
console.log('- Mantieni sempre sicure le tue chiavi private');
console.log('\n🚀 Sistema pronto per il test!');