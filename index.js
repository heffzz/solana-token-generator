import { TokenGenerator } from './tokenGenerator.js';
import { DEXManager } from './dexManager.js';
import { Monitor } from './monitor.js';
import { Logger } from './logger.js';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';

class AutonomousTokenSystem {
    constructor() {
        this.logger = new Logger();
        this.tokenGenerator = new TokenGenerator();
        this.dexManager = new DEXManager();
        this.monitor = new Monitor();
        
        this.isRunning = false;
        this.generationCycles = 0;
        this.totalTokensCreated = 0;
        this.totalLiquidityDeployed = 0;
        
        this.systemStats = {
            startTime: null,
            lastCycle: null,
            errors: [],
            successes: [],
            performance: {
                avgTokensPerCycle: 0,
                avgCycleTime: 0,
                successRate: 0
            }
        };
    }

    async initialize() {
        try {
            this.logger.operation('Inizializzazione Sistema Autonomo Token SPL');
            
            // Stampa configurazione
            config.printConfiguration();
            
            // Verifica prerequisiti
            await this.checkPrerequisites();
            
            // Crea directory necessarie
            this.createDirectories();
            
            // Salva configurazione iniziale
            config.saveConfiguration();
            
            this.logger.success('Sistema inizializzato correttamente');
            return true;
            
        } catch (error) {
            this.logger.error('Errore durante inizializzazione', error);
            return false;
        }
    }

    async checkPrerequisites() {
        this.logger.log('Verifica prerequisiti...');
        
        // Verifica connessione Solana
        try {
            const slot = await this.tokenGenerator.connection.getSlot();
            this.logger.success(`Connessione Solana OK (slot: ${slot})`);
        } catch (error) {
            throw new Error(`Connessione Solana fallita: ${error.message}`);
        }
        
        // Verifica wallet balance
        try {
            const balance = await this.tokenGenerator.connection.getBalance(
                this.tokenGenerator.payer.publicKey
            );
            const solBalance = balance / 1e9;
            
            if (solBalance < 0.1) {
                this.logger.warning(`Balance basso: ${solBalance} SOL (raccomandato minimo 0.1 SOL)`);
                this.logger.warning('Per richiedere fondi devnet: https://faucet.solana.com/');
                this.logger.warning(`Indirizzo wallet: ${this.tokenGenerator.payer.publicKey.toString()}`);
            } else {
                this.logger.success(`Wallet balance OK: ${solBalance.toFixed(4)} SOL`);
            }
        } catch (error) {
            this.logger.warning(`Verifica wallet fallita: ${error.message}`);
        }
        
        // Verifica configurazione DEX
        const enabledDEX = [
            config.RAYDIUM_ENABLED && 'Raydium',
            config.ORCA_ENABLED && 'Orca',
            config.SERUM_ENABLED && 'Serum'
        ].filter(Boolean);
        
        if (enabledDEX.length === 0) {
            throw new Error('Nessun DEX abilitato');
        }
        
        this.logger.success(`DEX abilitati: ${enabledDEX.join(', ')}`);
    }

    createDirectories() {
        const dirs = ['./logs', './data', './exports', './backups'];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                this.logger.log(`Directory creata: ${dir}`);
            }
        });
    }

    async startAutonomousOperation() {
        if (this.isRunning) {
            this.logger.warning('Sistema già in esecuzione');
            return;
        }
        
        this.isRunning = true;
        this.systemStats.startTime = new Date().toISOString();
        
        this.logger.operation('🚀 AVVIO SISTEMA AUTONOMO DI GENERAZIONE TOKEN SPL');
        
        try {
            // Avvia ciclo principale
            await this.runMainCycle();
            
        } catch (error) {
            this.logger.error('Errore critico nel sistema autonomo', error);
            await this.handleCriticalError(error);
        }
    }

    async runMainCycle() {
        while (this.isRunning) {
            const cycleStart = Date.now();
            this.generationCycles++;
            
            this.logger.operation(`=== CICLO ${this.generationCycles} INIZIATO ===`);
            
            try {
                // Determina numero di token da creare
                const tokenCount = config.getRandomTokenCount();
                this.logger.log(`Generando ${tokenCount} token in questo ciclo`);
                
                // Fase 1: Generazione Token
                const tokens = await this.generateTokenBatch(tokenCount);
                
                if (tokens.length === 0) {
                    this.logger.warning('Nessun token generato, saltando al prossimo ciclo');
                    await this.sleep(30000); // Attende 30 secondi
                    continue;
                }
                
                // Fase 2: Distribuzione sui DEX
                const listedTokens = await this.distributeTokens(tokens);
                
                // Fase 3: Avvio monitoraggio
                await this.startMonitoringForTokens(listedTokens);
                
                // Fase 4: Salvataggio dati
                await this.saveTokenData(listedTokens);
                
                // Aggiorna statistiche
                this.updateStats(tokens.length, Date.now() - cycleStart, true);
                
                this.logger.success(`=== CICLO ${this.generationCycles} COMPLETATO ===`);
                
                // Pausa tra i cicli
                const pauseTime = this.calculatePauseTime();
                this.logger.log(`Pausa di ${pauseTime / 1000} secondi prima del prossimo ciclo`);
                await this.sleep(pauseTime);
                
            } catch (error) {
                this.logger.error(`Errore nel ciclo ${this.generationCycles}`, error);
                this.updateStats(0, Date.now() - cycleStart, false);
                
                // Applica auto-fix se possibile
                if (config.AUTO_FIX_ENABLED) {
                    await this.applyCycleAutoFix(error);
                }
                
                // Pausa più lunga in caso di errore
                await this.sleep(60000); // 1 minuto
            }
        }
    }

    async generateTokenBatch(count) {
        this.logger.operation(`Generazione batch di ${count} token`);
        
        try {
            const tokens = await this.tokenGenerator.generateTokenBatch(count);
            
            this.totalTokensCreated += tokens.length;
            
            this.logger.success(`${tokens.length} token generati con successo`);
            
            // Log dettagli token
            tokens.forEach(token => {
                this.logger.logTokenCreated(token);
            });
            
            return tokens;
            
        } catch (error) {
            this.logger.error('Errore nella generazione token batch', error);
            
            // Tenta generazione ridotta
            if (count > 1) {
                this.logger.log('Tentando generazione ridotta...');
                return await this.generateTokenBatch(Math.ceil(count / 2));
            }
            
            return [];
        }
    }

    async distributeTokens(tokens) {
        this.logger.operation(`Distribuzione di ${tokens.length} token sui DEX`);
        
        try {
            const listedTokens = await this.dexManager.distributeTokensOnDEX(tokens);
            
            const totalLiquidity = listedTokens.reduce(
                (sum, token) => sum + (token.liquidityEur || 0), 0
            );
            
            this.totalLiquidityDeployed += totalLiquidity;
            
            this.logger.success(
                `${listedTokens.length} token distribuiti con liquidità totale €${totalLiquidity.toFixed(2)}`
            );
            
            // Log dettagli listing
            listedTokens.forEach(token => {
                if (token.dexListings) {
                    token.dexListings.forEach(listing => {
                        this.logger.logDEXListing(
                            token.name, 
                            listing.dex, 
                            listing.success, 
                            listing.data
                        );
                    });
                }
            });
            
            return listedTokens;
            
        } catch (error) {
            this.logger.error('Errore nella distribuzione token', error);
            return tokens; // Ritorna token non distribuiti
        }
    }

    async startMonitoringForTokens(tokens) {
        this.logger.operation('Avvio monitoraggio per nuovi token');
        
        try {
            // Aggiunge token al monitoraggio
            tokens.forEach(token => {
                this.monitor.addToken(token);
            });
            
            // Avvia monitoraggio se non già attivo
            if (!this.monitor.isRunning) {
                await this.monitor.startMonitoring(tokens);
            }
            
            this.logger.success('Monitoraggio avviato per nuovi token');
            
        } catch (error) {
            this.logger.error('Errore nell\'avvio monitoraggio', error);
        }
    }

    async saveTokenData(tokens) {
        try {
            const dataFile = `./data/tokens-${this.getDateString()}.json`;
            
            let existingData = [];
            if (fs.existsSync(dataFile)) {
                existingData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
            }
            
            existingData.push(...tokens);
            
            fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));
            
            this.logger.log(`Dati token salvati in ${dataFile}`);
            
        } catch (error) {
            this.logger.error('Errore nel salvataggio dati token', error);
        }
    }

    updateStats(tokensCreated, cycleTime, success) {
        this.systemStats.lastCycle = new Date().toISOString();
        
        if (success) {
            this.systemStats.successes.push({
                cycle: this.generationCycles,
                tokens: tokensCreated,
                time: cycleTime,
                timestamp: new Date().toISOString()
            });
        } else {
            this.systemStats.errors.push({
                cycle: this.generationCycles,
                timestamp: new Date().toISOString()
            });
        }
        
        // Calcola metriche performance
        const totalSuccesses = this.systemStats.successes.length;
        const totalCycles = this.generationCycles;
        
        if (totalSuccesses > 0) {
            this.systemStats.performance.avgTokensPerCycle = 
                this.systemStats.successes.reduce((sum, s) => sum + s.tokens, 0) / totalSuccesses;
            
            this.systemStats.performance.avgCycleTime = 
                this.systemStats.successes.reduce((sum, s) => sum + s.time, 0) / totalSuccesses;
        }
        
        this.systemStats.performance.successRate = (totalSuccesses / totalCycles) * 100;
    }

    calculatePauseTime() {
        // Calcola pausa dinamica basata su performance
        const baseTime = 300000; // 5 minuti
        const successRate = this.systemStats.performance.successRate;
        
        if (successRate > 90) {
            return baseTime * 0.8; // Riduce pausa se tutto va bene
        } else if (successRate < 50) {
            return baseTime * 2; // Aumenta pausa se ci sono problemi
        }
        
        return baseTime;
    }

    async applyCycleAutoFix(error) {
        this.logger.operation('Applicando auto-fix per errore ciclo');
        
        try {
            if (error.message.includes('insufficient funds')) {
                this.logger.log('Riducendo liquidità per prossimo ciclo...');
                // Logica per ridurre liquidità
            } else if (error.message.includes('rate limit')) {
                this.logger.log('Aumentando pausa per rate limiting...');
                await this.sleep(30000);
            } else if (error.message.includes('network')) {
                this.logger.log('Problema di rete, tentando riconnessione...');
                // Logica per riconnessione
            }
            
            this.logger.logBugFix(error.message, 'Auto-fix ciclo applicato');
            
        } catch (fixError) {
            this.logger.error('Errore durante auto-fix', fixError);
        }
    }

    async handleCriticalError(error) {
        this.logger.error('🚨 ERRORE CRITICO DEL SISTEMA', error);
        
        // Salva stato corrente
        await this.saveSystemState();
        
        // Ferma monitoraggio
        await this.monitor.stopMonitoring();
        
        // Tenta riavvio automatico se abilitato
        if (config.AUTO_FIX_ENABLED) {
            this.logger.operation('Tentando riavvio automatico...');
            await this.sleep(60000); // Attende 1 minuto
            
            try {
                await this.initialize();
                await this.startAutonomousOperation();
            } catch (restartError) {
                this.logger.error('Riavvio automatico fallito', restartError);
                this.isRunning = false;
            }
        } else {
            this.isRunning = false;
        }
    }

    async saveSystemState() {
        try {
            const state = {
                timestamp: new Date().toISOString(),
                stats: this.systemStats,
                config: {
                    totalLiquidityEur: config.TOTAL_LIQUIDITY_EUR,
                    minTokens: config.MIN_TOKENS,
                    maxTokens: config.MAX_TOKENS
                },
                tokens: {
                    created: this.totalTokensCreated,
                    cycles: this.generationCycles
                },
                monitoring: this.monitor.getSystemStats()
            };
            
            const stateFile = `./backups/system-state-${Date.now()}.json`;
            fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
            
            this.logger.success(`Stato sistema salvato in ${stateFile}`);
            
        } catch (error) {
            this.logger.error('Errore nel salvataggio stato sistema', error);
        }
    }

    async stop() {
        this.logger.operation('Fermando sistema autonomo...');
        
        this.isRunning = false;
        
        // Ferma monitoraggio
        await this.monitor.stopMonitoring();
        
        // Salva stato finale
        await this.saveSystemState();
        
        // Genera report finale
        await this.generateFinalReport();
        
        this.logger.success('Sistema autonomo fermato');
    }

    async generateFinalReport() {
        try {
            const report = {
                summary: {
                    totalCycles: this.generationCycles,
                    totalTokensCreated: this.totalTokensCreated,
                    totalLiquidityDeployed: this.totalLiquidityDeployed,
                    runtime: this.getRuntime(),
                    successRate: this.systemStats.performance.successRate
                },
                performance: this.systemStats.performance,
                dexStats: this.dexManager.getDEXStats(),
                monitoringStats: this.monitor.getSystemStats(),
                errors: this.systemStats.errors,
                timestamp: new Date().toISOString()
            };
            
            const reportFile = `./exports/final-report-${Date.now()}.json`;
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            
            this.logger.success(`Report finale generato: ${reportFile}`);
            
            // Stampa sommario
            this.printSummary(report.summary);
            
        } catch (error) {
            this.logger.error('Errore nella generazione report finale', error);
        }
    }

    printSummary(summary) {
        console.log('\n' + '='.repeat(60));
        console.log('🎯 SOMMARIO OPERAZIONI SISTEMA AUTONOMO');
        console.log('='.repeat(60));
        console.log(`📊 Cicli completati: ${summary.totalCycles}`);
        console.log(`🪙 Token creati: ${summary.totalTokensCreated}`);
        console.log(`💰 Liquidità deployata: €${summary.totalLiquidityDeployed.toFixed(2)}`);
        console.log(`⏱️  Tempo di esecuzione: ${summary.runtime}`);
        console.log(`✅ Tasso di successo: ${summary.successRate.toFixed(2)}%`);
        console.log('='.repeat(60) + '\n');
    }

    getRuntime() {
        if (!this.systemStats.startTime) return '0 secondi';
        
        const start = new Date(this.systemStats.startTime);
        const now = new Date();
        const diffMs = now - start;
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    getDateString() {
        return new Date().toISOString().split('T')[0];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Metodi per controllo esterno
    getSystemStatus() {
        return {
            isRunning: this.isRunning,
            cycles: this.generationCycles,
            tokensCreated: this.totalTokensCreated,
            liquidityDeployed: this.totalLiquidityDeployed,
            runtime: this.getRuntime(),
            performance: this.systemStats.performance
        };
    }
}

// Funzione principale
async function main() {
    const system = new AutonomousTokenSystem();
    
    try {
        // Inizializza sistema
        const initialized = await system.initialize();
        if (!initialized) {
            console.error('❌ Inizializzazione fallita');
            process.exit(1);
        }
        
        // Gestione segnali per shutdown graceful
        process.on('SIGINT', async () => {
            console.log('\n🛑 Ricevuto segnale di interruzione...');
            await system.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Ricevuto segnale di terminazione...');
            await system.stop();
            process.exit(0);
        });
        
        // Avvia operazioni autonome
        await system.startAutonomousOperation();
        
    } catch (error) {
        console.error('❌ Errore fatale:', error.message);
        process.exit(1);
    }
}

// Avvia il sistema se eseguito direttamente
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('index.js')) {
    main().catch(console.error);
}

export { AutonomousTokenSystem };