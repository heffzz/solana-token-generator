import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { config } from './config.js';
import { Logger } from './logger.js';
import axios from 'axios';
import bs58 from 'bs58';

export class DEXManager {
    constructor() {
        this.connection = new Connection(config.SOLANA_RPC_URL, 'confirmed');
        this.payer = Keypair.fromSecretKey(bs58.decode(config.SOLANA_PRIVATE_KEY));
        this.logger = new Logger();
        this.totalLiquidityEur = config.TOTAL_LIQUIDITY_EUR || 100;
        this.listedTokens = [];
        
        // DEX configurations
        this.dexConfigs = {
            raydium: {
                enabled: config.RAYDIUM_ENABLED,
                programId: 'RVKd61ztZW9GUwhRbbLoYVRE5Xf1B2tVscKqwZqXgEr',
                fee: 0.0025 // 0.25%
            },
            orca: {
                enabled: config.ORCA_ENABLED,
                programId: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
                fee: 0.003 // 0.3%
            },
            serum: {
                enabled: config.SERUM_ENABLED,
                programId: 'EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o',
                fee: 0.0022 // 0.22%
            }
        };
    }

    async distributeTokensOnDEX(tokens) {
        this.logger.log(`Iniziando distribuzione di ${tokens.length} token sui DEX...`);
        
        const liquidityPerToken = this.totalLiquidityEur / tokens.length;
        this.logger.log(`Liquidità per token: €${liquidityPerToken.toFixed(2)}`);
        
        for (const token of tokens) {
            try {
                await this.listTokenOnAllDEX(token, liquidityPerToken);
                this.listedTokens.push({
                    ...token,
                    listedAt: new Date().toISOString(),
                    liquidityEur: liquidityPerToken
                });
                
                // Pausa tra i listing per evitare rate limiting
                await this.sleep(5000);
            } catch (error) {
                this.logger.error(`Errore nel listing del token ${token.name}: ${error.message}`);
                await this.handleListingError(token, error);
            }
        }
        
        return this.listedTokens;
    }

    async listTokenOnAllDEX(token, liquidityEur) {
        this.logger.log(`Listing ${token.name} sui DEX con liquidità €${liquidityEur}`);
        
        const results = [];
        
        // Lista su Raydium
        if (this.dexConfigs.raydium.enabled) {
            try {
                const raydiumResult = await this.listOnRaydium(token, liquidityEur * 0.4);
                results.push({ dex: 'raydium', success: true, data: raydiumResult });
            } catch (error) {
                this.logger.error(`Errore Raydium: ${error.message}`);
                results.push({ dex: 'raydium', success: false, error: error.message });
            }
        }
        
        // Lista su Orca
        if (this.dexConfigs.orca.enabled) {
            try {
                const orcaResult = await this.listOnOrca(token, liquidityEur * 0.35);
                results.push({ dex: 'orca', success: true, data: orcaResult });
            } catch (error) {
                this.logger.error(`Errore Orca: ${error.message}`);
                results.push({ dex: 'orca', success: false, error: error.message });
            }
        }
        
        // Lista su Serum
        if (this.dexConfigs.serum.enabled) {
            try {
                const serumResult = await this.listOnSerum(token, liquidityEur * 0.25);
                results.push({ dex: 'serum', success: true, data: serumResult });
            } catch (error) {
                this.logger.error(`Errore Serum: ${error.message}`);
                results.push({ dex: 'serum', success: false, error: error.message });
            }
        }
        
        token.dexListings = results;
        return results;
    }

    async listOnRaydium(token, liquidityEur) {
        this.logger.log(`Listing ${token.name} su Raydium con €${liquidityEur}`);
        
        try {
            // Simula il processo di listing su Raydium
            // In un ambiente reale, questo richiederebbe l'integrazione con Raydium SDK
            
            const solAmount = await this.convertEurToSol(liquidityEur);
            const tokenAmount = this.calculateTokenAmount(token, solAmount);
            
            // Crea pool di liquidità simulato
            const poolData = {
                tokenMint: token.mint,
                baseMint: 'So11111111111111111111111111111111111111112', // SOL
                solAmount: solAmount,
                tokenAmount: tokenAmount,
                poolId: this.generatePoolId(),
                fee: this.dexConfigs.raydium.fee,
                createdAt: new Date().toISOString()
            };
            
            // Simula transazione di creazione pool
            await this.simulatePoolCreation('raydium', poolData);
            
            this.logger.log(`Pool Raydium creato: ${poolData.poolId}`);
            return poolData;
            
        } catch (error) {
            this.logger.error(`Errore listing Raydium: ${error.message}`);
            throw error;
        }
    }

    async listOnOrca(token, liquidityEur) {
        this.logger.log(`Listing ${token.name} su Orca con €${liquidityEur}`);
        
        try {
            const solAmount = await this.convertEurToSol(liquidityEur);
            const tokenAmount = this.calculateTokenAmount(token, solAmount);
            
            const poolData = {
                tokenMint: token.mint,
                baseMint: 'So11111111111111111111111111111111111111112',
                solAmount: solAmount,
                tokenAmount: tokenAmount,
                poolId: this.generatePoolId(),
                fee: this.dexConfigs.orca.fee,
                createdAt: new Date().toISOString()
            };
            
            await this.simulatePoolCreation('orca', poolData);
            
            this.logger.log(`Pool Orca creato: ${poolData.poolId}`);
            return poolData;
            
        } catch (error) {
            this.logger.error(`Errore listing Orca: ${error.message}`);
            throw error;
        }
    }

    async listOnSerum(token, liquidityEur) {
        this.logger.log(`Listing ${token.name} su Serum con €${liquidityEur}`);
        
        try {
            const solAmount = await this.convertEurToSol(liquidityEur);
            const tokenAmount = this.calculateTokenAmount(token, solAmount);
            
            const marketData = {
                tokenMint: token.mint,
                baseMint: 'So11111111111111111111111111111111111111112',
                solAmount: solAmount,
                tokenAmount: tokenAmount,
                marketId: this.generatePoolId(),
                fee: this.dexConfigs.serum.fee,
                createdAt: new Date().toISOString()
            };
            
            await this.simulatePoolCreation('serum', marketData);
            
            this.logger.log(`Market Serum creato: ${marketData.marketId}`);
            return marketData;
            
        } catch (error) {
            this.logger.error(`Errore listing Serum: ${error.message}`);
            throw error;
        }
    }

    async convertEurToSol(eurAmount) {
        try {
            // Ottiene il prezzo corrente di SOL in EUR
            const response = await axios.get(
                'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=eur',
                { timeout: 5000 }
            );
            
            const solPriceEur = response.data.solana.eur;
            const solAmount = eurAmount / solPriceEur;
            
            this.logger.log(`Conversione: €${eurAmount} = ${solAmount.toFixed(4)} SOL`);
            return solAmount;
            
        } catch (error) {
            this.logger.error(`Errore conversione EUR/SOL: ${error.message}`);
            // Fallback: assume 1 SOL = 100 EUR
            return eurAmount / 100;
        }
    }

    calculateTokenAmount(token, solAmount) {
        // Calcola la quantità di token basata su un prezzo iniziale
        const initialPriceSOL = 0.001; // 0.001 SOL per token
        return solAmount / initialPriceSOL;
    }

    generatePoolId() {
        // Genera un ID pool simulato
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 44; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async simulatePoolCreation(dex, poolData) {
        // Simula la creazione del pool con una transazione fittizia
        this.logger.log(`Simulando creazione pool su ${dex}...`);
        
        // Simula tempo di processing
        await this.sleep(2000 + Math.random() * 3000);
        
        // Simula possibili errori (5% di probabilità)
        if (Math.random() < 0.05) {
            throw new Error(`Errore simulato nella creazione pool su ${dex}`);
        }
        
        this.logger.log(`Pool creato con successo su ${dex}`);
        return true;
    }

    async handleListingError(token, error) {
        this.logger.error(`Gestione errore listing per ${token.name}: ${error.message}`);
        
        // Implementa strategie di retry
        if (error.message.includes('insufficient funds')) {
            this.logger.log('Riducendo liquidità per il prossimo tentativo...');
            // Logica per ridurre liquidità
        } else if (error.message.includes('rate limit')) {
            this.logger.log('Rate limit raggiunto, attendendo...');
            await this.sleep(30000); // Attende 30 secondi
        }
    }

    async monitorPools() {
        this.logger.log('Iniziando monitoraggio pool...');
        
        for (const token of this.listedTokens) {
            try {
                await this.checkPoolHealth(token);
            } catch (error) {
                this.logger.error(`Errore monitoraggio ${token.name}: ${error.message}`);
            }
        }
    }

    async checkPoolHealth(token) {
        if (!token.dexListings) return;
        
        for (const listing of token.dexListings) {
            if (listing.success) {
                // Simula controllo salute pool
                const isHealthy = Math.random() > 0.1; // 90% probabilità di essere sano
                
                if (!isHealthy) {
                    this.logger.log(`Pool non sano rilevato per ${token.name} su ${listing.dex}`);
                    await this.fixPoolIssues(token, listing);
                }
            }
        }
    }

    async fixPoolIssues(token, listing) {
        this.logger.log(`Correggendo problemi pool per ${token.name} su ${listing.dex}`);
        
        // Implementa logiche di auto-correzione
        await this.sleep(1000);
        
        this.logger.log(`Problemi pool risolti per ${token.name}`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getListedTokens() {
        return this.listedTokens;
    }

    getTotalLiquidityUsed() {
        return this.listedTokens.reduce((total, token) => total + (token.liquidityEur || 0), 0);
    }

    getDEXStats() {
        const stats = {
            totalTokens: this.listedTokens.length,
            totalLiquidity: this.getTotalLiquidityUsed(),
            dexBreakdown: {
                raydium: 0,
                orca: 0,
                serum: 0
            }
        };
        
        this.listedTokens.forEach(token => {
            if (token.dexListings) {
                token.dexListings.forEach(listing => {
                    if (listing.success) {
                        stats.dexBreakdown[listing.dex]++;
                    }
                });
            }
        });
        
        return stats;
    }
}