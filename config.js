import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Carica variabili d'ambiente
dotenv.config();

class Config {
    constructor() {
        this.loadConfiguration();
        this.validateConfiguration();
    }

    loadConfiguration() {
        // Configurazione Solana
        this.SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        this.SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY || this.generateDefaultKey();
        this.SOLANA_PUBLIC_KEY = process.env.SOLANA_PUBLIC_KEY || this.getPublicKeyFromPrivate();
        
        // Configurazione Token Generation
        this.TOTAL_LIQUIDITY_EUR = parseFloat(process.env.TOTAL_LIQUIDITY_EUR) || 100;
        this.MIN_TOKENS = parseInt(process.env.MIN_TOKENS) || 10;
        this.MAX_TOKENS = parseInt(process.env.MAX_TOKENS) || 50;
        
        // Configurazione DEX
        this.RAYDIUM_ENABLED = process.env.RAYDIUM_ENABLED !== 'false';
        this.ORCA_ENABLED = process.env.ORCA_ENABLED !== 'false';
        this.SERUM_ENABLED = process.env.SERUM_ENABLED !== 'false';
        
        // Configurazione Monitoring
        this.MONITORING_INTERVAL_MS = parseInt(process.env.MONITORING_INTERVAL_MS) || 300000; // 5 minuti
        this.AUTO_FIX_ENABLED = process.env.AUTO_FIX_ENABLED !== 'false';
        
        // API Keys
        this.SOLSCAN_API_KEY = process.env.SOLSCAN_API_KEY || '';
        this.COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || '';
        
        // Configurazioni avanzate
        this.MAX_RETRY_ATTEMPTS = parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3;
        this.RETRY_DELAY_MS = parseInt(process.env.RETRY_DELAY_MS) || 5000;
        this.RATE_LIMIT_DELAY_MS = parseInt(process.env.RATE_LIMIT_DELAY_MS) || 2000;
        
        // Configurazione sicurezza
        this.MAX_SUPPLY = parseInt(process.env.MAX_SUPPLY) || 10000000000; // 10B
        this.MIN_SUPPLY = parseInt(process.env.MIN_SUPPLY) || 1000000; // 1M
        this.MAX_DECIMALS = parseInt(process.env.MAX_DECIMALS) || 9;
        this.MIN_DECIMALS = parseInt(process.env.MIN_DECIMALS) || 6;
        
        // Configurazione logging
        this.LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
        this.LOG_RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS) || 7;
        
        // Configurazione performance
        this.BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 5;
        this.CONCURRENT_OPERATIONS = parseInt(process.env.CONCURRENT_OPERATIONS) || 3;
        
        // Configurazione DEX specifica
        this.DEX_CONFIG = {
            raydium: {
                enabled: this.RAYDIUM_ENABLED,
                minLiquidity: 10, // EUR
                maxSlippage: 0.05, // 5%
                fee: 0.0025
            },
            orca: {
                enabled: this.ORCA_ENABLED,
                minLiquidity: 8, // EUR
                maxSlippage: 0.03, // 3%
                fee: 0.003
            },
            serum: {
                enabled: this.SERUM_ENABLED,
                minLiquidity: 5, // EUR
                maxSlippage: 0.02, // 2%
                fee: 0.0022
            }
        };
        
        // Configurazione validazione
        this.VALIDATION_CONFIG = {
            checkSolscan: true,
            checkJupiter: true,
            checkSimilarity: true,
            similarityThreshold: 0.8,
            cacheSize: 1000
        };
        
        // Configurazione auto-fix
        this.AUTO_FIX_CONFIG = {
            enabled: this.AUTO_FIX_ENABLED,
            maxAttempts: 3,
            strategies: {
                insufficientFunds: true,
                rateLimiting: true,
                networkErrors: true,
                validationErrors: true
            }
        };
    }

    validateConfiguration() {
        const errors = [];
        
        // Valida configurazione base
        if (!this.SOLANA_RPC_URL) {
            errors.push('SOLANA_RPC_URL è richiesto');
        }
        
        if (!this.SOLANA_PRIVATE_KEY || this.SOLANA_PRIVATE_KEY === 'your_base58_private_key_here') {
            errors.push('SOLANA_PRIVATE_KEY valida è richiesta');
        }
        
        // Valida range token
        if (this.MIN_TOKENS > this.MAX_TOKENS) {
            errors.push('MIN_TOKENS non può essere maggiore di MAX_TOKENS');
        }
        
        if (this.MIN_TOKENS < 1) {
            errors.push('MIN_TOKENS deve essere almeno 1');
        }
        
        if (this.MAX_TOKENS > 100) {
            errors.push('MAX_TOKENS non può essere maggiore di 100');
        }
        
        // Valida liquidità
        if (this.TOTAL_LIQUIDITY_EUR <= 0) {
            errors.push('TOTAL_LIQUIDITY_EUR deve essere maggiore di 0');
        }
        
        if (this.TOTAL_LIQUIDITY_EUR > 10000) {
            errors.push('TOTAL_LIQUIDITY_EUR non può essere maggiore di 10000 EUR');
        }
        
        // Valida supply range
        if (this.MIN_SUPPLY >= this.MAX_SUPPLY) {
            errors.push('MIN_SUPPLY deve essere minore di MAX_SUPPLY');
        }
        
        // Valida decimali
        if (this.MIN_DECIMALS >= this.MAX_DECIMALS) {
            errors.push('MIN_DECIMALS deve essere minore di MAX_DECIMALS');
        }
        
        // Valida che almeno un DEX sia abilitato
        if (!this.RAYDIUM_ENABLED && !this.ORCA_ENABLED && !this.SERUM_ENABLED) {
            errors.push('Almeno un DEX deve essere abilitato');
        }
        
        if (errors.length > 0) {
            throw new Error(`Errori di configurazione:\n${errors.join('\n')}`);
        }
    }

    generateDefaultKey() {
        try {
            // Prova a leggere la chiave dal file keypair.json
            const keypairPath = './keypair.json';
            if (fs.existsSync(keypairPath)) {
                const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
                if (keypairData && Array.isArray(keypairData)) {
                    return Buffer.from(keypairData).toString('base64');
                }
            }
            
            // Se non esiste, genera una chiave temporanea
            console.warn('⚠️  Nessuna chiave privata trovata. Usando chiave temporanea.');
            return 'TEMP_KEY_PLACEHOLDER';
        } catch (error) {
            console.error('Errore nel caricamento della chiave:', error);
            return 'TEMP_KEY_PLACEHOLDER';
        }
    }

    getPublicKeyFromPrivate() {
        try {
            if (this.SOLANA_PRIVATE_KEY === 'TEMP_KEY_PLACEHOLDER') {
                return 'TEMP_PUBLIC_KEY_PLACEHOLDER';
            }
            
            // Prova a derivare la chiave pubblica dalla privata
            const keypairPath = './keypair.json';
            if (fs.existsSync(keypairPath)) {
                const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
                if (keypairData && Array.isArray(keypairData)) {
                    // Importa Solana web3.js dinamicamente per evitare errori di import
                    try {
                        const { Keypair } = require('@solana/web3.js');
                        const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
                        return keypair.publicKey.toString();
                    } catch (importError) {
                        console.warn('Impossibile importare @solana/web3.js, uso placeholder');
                        return 'TEMP_PUBLIC_KEY_PLACEHOLDER';
                    }
                }
            }
            
            return 'TEMP_PUBLIC_KEY_PLACEHOLDER';
        } catch (error) {
            console.error('Errore nel derivare la chiave pubblica:', error);
            return 'TEMP_PUBLIC_KEY_PLACEHOLDER';
        }
    }

    // Metodi di utilità
    isDevnet() {
        return this.SOLANA_RPC_URL.includes('devnet');
    }

    isMainnet() {
        return this.SOLANA_RPC_URL.includes('mainnet');
    }

    getNetworkName() {
        if (this.isDevnet()) return 'devnet';
        if (this.isMainnet()) return 'mainnet-beta';
        return 'localnet';
    }

    getLiquidityPerToken(tokenCount) {
        return this.TOTAL_LIQUIDITY_EUR / tokenCount;
    }

    getDEXLiquidityDistribution(totalLiquidity) {
        const enabledDEXCount = [
            this.RAYDIUM_ENABLED,
            this.ORCA_ENABLED,
            this.SERUM_ENABLED
        ].filter(Boolean).length;
        
        if (enabledDEXCount === 0) return {};
        
        const distribution = {};
        
        if (this.RAYDIUM_ENABLED) {
            distribution.raydium = totalLiquidity * 0.4; // 40%
        }
        
        if (this.ORCA_ENABLED) {
            distribution.orca = totalLiquidity * 0.35; // 35%
        }
        
        if (this.SERUM_ENABLED) {
            distribution.serum = totalLiquidity * 0.25; // 25%
        }
        
        // Ribilancia se alcuni DEX sono disabilitati
        const totalPercentage = Object.values(distribution).reduce((sum, val) => sum + val, 0);
        if (totalPercentage < totalLiquidity) {
            const adjustment = totalLiquidity / totalPercentage;
            Object.keys(distribution).forEach(key => {
                distribution[key] *= adjustment;
            });
        }
        
        return distribution;
    }

    getRandomTokenCount() {
        return Math.floor(Math.random() * (this.MAX_TOKENS - this.MIN_TOKENS + 1)) + this.MIN_TOKENS;
    }

    getRandomSupply() {
        const min = this.MIN_SUPPLY;
        const max = this.MAX_SUPPLY;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getRandomDecimals() {
        return Math.floor(Math.random() * (this.MAX_DECIMALS - this.MIN_DECIMALS + 1)) + this.MIN_DECIMALS;
    }

    // Salva configurazione corrente
    saveConfiguration(filePath = './config.json') {
        const configData = {
            solana: {
                rpcUrl: this.SOLANA_RPC_URL,
                network: this.getNetworkName()
            },
            tokenGeneration: {
                totalLiquidityEur: this.TOTAL_LIQUIDITY_EUR,
                minTokens: this.MIN_TOKENS,
                maxTokens: this.MAX_TOKENS,
                minSupply: this.MIN_SUPPLY,
                maxSupply: this.MAX_SUPPLY,
                minDecimals: this.MIN_DECIMALS,
                maxDecimals: this.MAX_DECIMALS
            },
            dex: this.DEX_CONFIG,
            monitoring: {
                intervalMs: this.MONITORING_INTERVAL_MS,
                autoFixEnabled: this.AUTO_FIX_ENABLED
            },
            validation: this.VALIDATION_CONFIG,
            autoFix: this.AUTO_FIX_CONFIG,
            performance: {
                batchSize: this.BATCH_SIZE,
                concurrentOperations: this.CONCURRENT_OPERATIONS,
                maxRetryAttempts: this.MAX_RETRY_ATTEMPTS,
                retryDelayMs: this.RETRY_DELAY_MS
            }
        };
        
        try {
            fs.writeFileSync(filePath, JSON.stringify(configData, null, 2));
            console.log(`✅ Configurazione salvata in ${filePath}`);
        } catch (error) {
            console.error(`❌ Errore nel salvataggio configurazione: ${error.message}`);
        }
    }

    // Carica configurazione da file
    loadFromFile(filePath = './config.json') {
        try {
            if (fs.existsSync(filePath)) {
                const configData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                // Merge con configurazione corrente
                Object.assign(this, configData);
                
                console.log(`✅ Configurazione caricata da ${filePath}`);
                return true;
            }
        } catch (error) {
            console.error(`❌ Errore nel caricamento configurazione: ${error.message}`);
        }
        return false;
    }

    // Stampa configurazione corrente
    printConfiguration() {
        console.log('\n=== CONFIGURAZIONE SISTEMA ===');
        console.log(`Network: ${this.getNetworkName()}`);
        console.log(`RPC URL: ${this.SOLANA_RPC_URL}`);
        console.log(`Token Range: ${this.MIN_TOKENS}-${this.MAX_TOKENS}`);
        console.log(`Total Liquidity: €${this.TOTAL_LIQUIDITY_EUR}`);
        console.log(`DEX Enabled: Raydium(${this.RAYDIUM_ENABLED}) Orca(${this.ORCA_ENABLED}) Serum(${this.SERUM_ENABLED})`);
        console.log(`Auto-Fix: ${this.AUTO_FIX_ENABLED}`);
        console.log(`Monitoring Interval: ${this.MONITORING_INTERVAL_MS}ms`);
        console.log('===============================\n');
    }
}

// Esporta istanza singleton
export const config = new Config();