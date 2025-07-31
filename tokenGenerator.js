import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { config } from './config.js';
import { TokenValidator } from './tokenValidator.js';
import { DescriptionGenerator } from './descriptionGenerator.js';
import { Logger } from './logger.js';
import bs58 from 'bs58';

export class TokenGenerator {
    constructor() {
        this.connection = new Connection(config.SOLANA_RPC_URL, 'confirmed');
        this.payer = Keypair.fromSecretKey(bs58.decode(config.SOLANA_PRIVATE_KEY));
        this.validator = new TokenValidator();
        this.descriptionGenerator = new DescriptionGenerator();
        this.logger = new Logger();
        this.createdTokens = [];
    }

    async generateTokenBatch(count = 10) {
        this.logger.log(`Iniziando generazione di ${count} token SPL...`);
        
        for (let i = 0; i < count; i++) {
            try {
                const tokenData = await this.generateUniqueToken();
                const token = await this.createToken(tokenData);
                this.createdTokens.push(token);
                
                this.logger.log(`Token ${i + 1}/${count} creato: ${token.name} (${token.symbol})`);
                
                // Pausa per evitare rate limiting
                await this.sleep(2000);
            } catch (error) {
                this.logger.error(`Errore nella creazione del token ${i + 1}: ${error.message}`);
                await this.handleError(error, i);
            }
        }
        
        return this.createdTokens;
    }

    async generateUniqueToken() {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const tokenData = this.generateRandomTokenData();
            
            const isUnique = await this.validator.validateUniqueness(
                tokenData.name, 
                tokenData.symbol
            );
            
            if (isUnique) {
                tokenData.description = await this.descriptionGenerator.generate(
                    tokenData.name, 
                    tokenData.symbol
                );
                return tokenData;
            }
            
            attempts++;
            this.logger.log(`Tentativo ${attempts}: Nome/simbolo già esistente, rigenerando...`);
        }
        
        throw new Error('Impossibile generare token unico dopo 10 tentativi');
    }

    generateRandomTokenData() {
        const prefixes = ['Crypto', 'Digital', 'Meta', 'Quantum', 'Stellar', 'Cosmic', 'Lunar', 'Solar', 'Nexus', 'Apex'];
        const suffixes = ['Coin', 'Token', 'Finance', 'Protocol', 'Network', 'Chain', 'Vault', 'Exchange', 'Capital', 'Labs'];
        const themes = ['AI', 'DeFi', 'Gaming', 'NFT', 'Metaverse', 'Green', 'Social', 'Music', 'Art', 'Sports'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const theme = themes[Math.floor(Math.random() * themes.length)];
        
        const name = `${prefix}${theme}${suffix}`;
        const symbol = this.generateSymbol(name);
        const supply = this.generateSupply();
        const decimals = Math.floor(Math.random() * 3) + 6; // 6-8 decimali
        
        return {
            name,
            symbol,
            supply,
            decimals
        };
    }

    generateSymbol(name) {
        // Estrae le prime lettere maiuscole o crea un simbolo basato sul nome
        let symbol = name.match(/[A-Z]/g)?.join('') || name.substring(0, 4).toUpperCase();
        
        // Assicura che il simbolo sia tra 3-8 caratteri
        if (symbol.length < 3) {
            symbol += Math.random().toString(36).substring(2, 5 - symbol.length).toUpperCase();
        } else if (symbol.length > 8) {
            symbol = symbol.substring(0, 8);
        }
        
        return symbol;
    }

    generateSupply() {
        const supplies = [
            1000000,      // 1M
            10000000,     // 10M
            100000000,    // 100M
            1000000000,   // 1B
            10000000000   // 10B
        ];
        
        return supplies[Math.floor(Math.random() * supplies.length)];
    }

    async createToken(tokenData) {
        try {
            this.logger.log(`Creando token: ${tokenData.name} (${tokenData.symbol})`);
            
            // Crea il mint
            const mint = await createMint(
                this.connection,
                this.payer,
                this.payer.publicKey,
                this.payer.publicKey,
                tokenData.decimals,
                undefined,
                undefined,
                TOKEN_PROGRAM_ID
            );
            
            // Crea account token associato
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                this.payer,
                mint,
                this.payer.publicKey
            );
            
            // Minta i token
            await mintTo(
                this.connection,
                this.payer,
                mint,
                tokenAccount.address,
                this.payer.publicKey,
                tokenData.supply * Math.pow(10, tokenData.decimals)
            );
            
            const token = {
                ...tokenData,
                mint: mint.toString(),
                tokenAccount: tokenAccount.address.toString(),
                createdAt: new Date().toISOString(),
                status: 'created'
            };
            
            this.logger.log(`Token creato con successo: ${token.mint}`);
            return token;
            
        } catch (error) {
            this.logger.error(`Errore nella creazione del token: ${error.message}`);
            throw error;
        }
    }

    async handleError(error, tokenIndex) {
        this.logger.error(`Gestione errore per token ${tokenIndex}: ${error.message}`);
        
        // Implementa logica di auto-correzione
        if (error.message.includes('insufficient funds')) {
            this.logger.log('Fondi insufficienti, riducendo supply del prossimo token...');
            // Logica per ridurre supply
        } else if (error.message.includes('rate limit')) {
            this.logger.log('Rate limit raggiunto, attendendo...');
            await this.sleep(10000); // Attende 10 secondi
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getCreatedTokens() {
        return this.createdTokens;
    }

    async getTokenBalance(mint) {
        try {
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                this.payer,
                new PublicKey(mint),
                this.payer.publicKey
            );
            
            const balance = await this.connection.getTokenAccountBalance(tokenAccount.address);
            return balance.value.uiAmount;
        } catch (error) {
            this.logger.error(`Errore nel recupero balance: ${error.message}`);
            return 0;
        }
    }
}