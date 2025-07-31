#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import readline from 'readline';

// Colori per output console
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function colorLog(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function createInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function askQuestion(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

function validatePublicKey(publicKeyString) {
    try {
        new PublicKey(publicKeyString);
        return true;
    } catch (error) {
        return false;
    }
}

function validatePrivateKey(privateKeyString) {
    try {
        // Prova diversi formati
        let secretKey;
        
        if (privateKeyString.startsWith('[') && privateKeyString.endsWith(']')) {
            // Formato array JSON
            secretKey = new Uint8Array(JSON.parse(privateKeyString));
        } else if (privateKeyString.length === 88) {
            // Formato base58
            secretKey = bs58.decode(privateKeyString);
        } else {
            return false;
        }
        
        Keypair.fromSecretKey(secretKey);
        return true;
    } catch (error) {
        return false;
    }
}

function convertPrivateKeyToArray(privateKeyString) {
    try {
        let secretKey;
        
        if (privateKeyString.startsWith('[') && privateKeyString.endsWith(']')) {
            // Già in formato array
            return JSON.parse(privateKeyString);
        } else if (privateKeyString.length === 88) {
            // Formato base58
            secretKey = bs58.decode(privateKeyString);
            return Array.from(secretKey);
        }
        
        throw new Error('Formato non riconosciuto');
    } catch (error) {
        throw new Error(`Errore conversione chiave: ${error.message}`);
    }
}

async function configureWallet() {
    const rl = createInterface();
    
    try {
        colorLog('\n🦄 CONFIGURAZIONE PHANTOM WALLET', 'cyan');
        colorLog('=====================================', 'cyan');
        
        colorLog('\n⚠️  IMPORTANTE: Questo script ti aiuterà a configurare il tuo wallet Phantom', 'yellow');
        colorLog('   in modo SICURO per il progetto token Solana.', 'yellow');
        
        colorLog('\n🔐 OPZIONI DISPONIBILI:', 'blue');
        colorLog('1. Solo monitoraggio (SICURO) - Inserisci solo indirizzo pubblico', 'green');
        colorLog('2. Controllo completo (RISCHIO) - Inserisci chiave privata', 'red');
        colorLog('3. Wallet dedicato (CONSIGLIATO) - Crea nuovo wallet per test', 'green');
        
        const choice = await askQuestion(rl, '\nScegli opzione (1/2/3): ');
        
        switch (choice) {
            case '1':
                await configureMonitoringOnly(rl);
                break;
            case '2':
                await configureFullControl(rl);
                break;
            case '3':
                await configureDedicatedWallet(rl);
                break;
            default:
                colorLog('\n❌ Opzione non valida', 'red');
                return;
        }
        
    } catch (error) {
        colorLog(`\n❌ Errore: ${error.message}`, 'red');
    } finally {
        rl.close();
    }
}

async function configureMonitoringOnly(rl) {
    colorLog('\n📊 CONFIGURAZIONE SOLO MONITORAGGIO', 'green');
    colorLog('=====================================', 'green');
    
    const publicKey = await askQuestion(rl, '\nInserisci il tuo indirizzo pubblico Phantom: ');
    
    if (!validatePublicKey(publicKey)) {
        colorLog('❌ Indirizzo pubblico non valido', 'red');
        return;
    }
    
    const config = {
        mode: 'monitoring',
        wallet: {
            publicKey: publicKey,
            note: 'Solo monitoraggio - nessuna chiave privata salvata'
        },
        createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync('wallet-config.json', JSON.stringify(config, null, 2));
    
    colorLog('\n✅ Configurazione salvata in wallet-config.json', 'green');
    colorLog(`📍 Indirizzo: ${publicKey}`, 'cyan');
    colorLog('🔒 Modalità: Solo monitoraggio (SICURO)', 'green');
}

async function configureFullControl(rl) {
    colorLog('\n⚠️  CONFIGURAZIONE CONTROLLO COMPLETO', 'red');
    colorLog('=======================================', 'red');
    
    colorLog('\n🚨 ATTENZIONE: Stai per inserire la tua chiave privata!', 'red');
    colorLog('   Assicurati che:', 'yellow');
    colorLog('   - Nessuno possa vedere il tuo schermo', 'yellow');
    colorLog('   - Sei su una connessione sicura', 'yellow');
    colorLog('   - Il computer non è compromesso', 'yellow');
    
    const confirm = await askQuestion(rl, '\nVuoi continuare? (si/no): ');
    
    if (confirm.toLowerCase() !== 'si') {
        colorLog('\n✅ Operazione annullata per sicurezza', 'green');
        return;
    }
    
    const privateKey = await askQuestion(rl, '\nInserisci la chiave privata (da Phantom Export): ');
    
    if (!validatePrivateKey(privateKey)) {
        colorLog('❌ Chiave privata non valida', 'red');
        return;
    }
    
    try {
        const secretKeyArray = convertPrivateKeyToArray(privateKey);
        const keypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));
        
        // Salva keypair
        fs.writeFileSync('keypair.json', JSON.stringify(secretKeyArray));
        
        // Salva config
        const config = {
            mode: 'full_control',
            wallet: {
                publicKey: keypair.publicKey.toString(),
                note: 'Controllo completo - chiave privata salvata in keypair.json'
            },
            createdAt: new Date().toISOString()
        };
        
        fs.writeFileSync('wallet-config.json', JSON.stringify(config, null, 2));
        
        colorLog('\n✅ Configurazione completata', 'green');
        colorLog(`📍 Indirizzo: ${keypair.publicKey.toString()}`, 'cyan');
        colorLog('🔑 Chiave privata salvata in keypair.json', 'yellow');
        colorLog('\n🔒 IMPORTANTE: Aggiungi keypair.json al .gitignore!', 'red');
        
        // Aggiungi al gitignore se esiste
        if (fs.existsSync('.gitignore')) {
            const gitignore = fs.readFileSync('.gitignore', 'utf8');
            if (!gitignore.includes('keypair.json')) {
                fs.appendFileSync('.gitignore', '\nkeypair.json\n');
                colorLog('✅ keypair.json aggiunto al .gitignore', 'green');
            }
        }
        
    } catch (error) {
        colorLog(`❌ Errore configurazione: ${error.message}`, 'red');
    }
}

async function configureDedicatedWallet(rl) {
    colorLog('\n🎯 CONFIGURAZIONE WALLET DEDICATO', 'green');
    colorLog('==================================', 'green');
    
    colorLog('\n📝 ISTRUZIONI:', 'blue');
    colorLog('1. Apri Phantom', 'cyan');
    colorLog('2. Clicca sull\'icona del wallet in alto', 'cyan');
    colorLog('3. Clicca "Add / Connect Wallet"', 'cyan');
    colorLog('4. Seleziona "Create New Wallet"', 'cyan');
    colorLog('5. Salva la nuova seed phrase in modo sicuro', 'cyan');
    colorLog('6. Copia l\'indirizzo pubblico del nuovo wallet', 'cyan');
    
    const publicKey = await askQuestion(rl, '\nInserisci l\'indirizzo del nuovo wallet dedicato: ');
    
    if (!validatePublicKey(publicKey)) {
        colorLog('❌ Indirizzo pubblico non valido', 'red');
        return;
    }
    
    const config = {
        mode: 'dedicated_wallet',
        wallet: {
            publicKey: publicKey,
            note: 'Wallet dedicato per test - solo monitoraggio'
        },
        createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync('wallet-config.json', JSON.stringify(config, null, 2));
    
    colorLog('\n✅ Configurazione salvata', 'green');
    colorLog(`📍 Wallet dedicato: ${publicKey}`, 'cyan');
    colorLog('\n💡 PROSSIMI PASSI:', 'blue');
    colorLog('1. Vai su https://faucet.solana.com', 'cyan');
    colorLog('2. Seleziona "Devnet"', 'cyan');
    colorLog('3. Inserisci l\'indirizzo del wallet', 'cyan');
    colorLog('4. Richiedi SOL gratuiti per test', 'cyan');
}

// Esegui sempre quando il file viene caricato direttamente
configureWallet();

export {
    configureWallet,
    validatePublicKey,
    validatePrivateKey
};

export default configureWallet;