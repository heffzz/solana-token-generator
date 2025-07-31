import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { config } from './config.js';
import { Logger } from './logger.js';
import { TokenValidator } from './tokenValidator.js';
import { DEXManager } from './dexManager.js';
import bs58 from 'bs58';
import axios from 'axios';

export class Monitor {
    constructor() {
        this.connection = new Connection(config.SOLANA_RPC_URL, 'confirmed');
        this.logger = new Logger();
        this.validator = new TokenValidator();
        this.dexManager = new DEXManager();
        
        this.isRunning = false;
        this.monitoringInterval = null;
        this.tokens = [];
        this.healthChecks = [];
        this.autoFixHistory = [];
        
        // Configurazione monitoraggio
        this.checkInterval = config.MONITORING_INTERVAL_MS;
        this.autoFixEnabled = config.AUTO_FIX_ENABLED;
        this.maxAutoFixAttempts = config.AUTO_FIX_CONFIG.maxAttempts;
    }

    async startMonitoring(tokens = []) {
        if (this.isRunning) {
            this.logger.warning('Monitoraggio già in corso');
            return;
        }
        
        this.tokens = tokens;
        this.isRunning = true;
        
        this.logger.operation('Avvio sistema di monitoraggio', {
            tokenCount: tokens.length,
            interval: this.checkInterval,
            autoFixEnabled: this.autoFixEnabled
        });
        
        // Primo controllo immediato
        await this.performHealthCheck();
        
        // Avvia monitoraggio periodico
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.performHealthCheck();
            } catch (error) {
                this.logger.error('Errore durante controllo periodico', error);
            }
        }, this.checkInterval);
        
        this.logger.success('Sistema di monitoraggio avviato');
    }

    async stopMonitoring() {
        if (!this.isRunning) {
            this.logger.warning('Monitoraggio non in corso');
            return;
        }
        
        this.isRunning = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.logger.operation('Sistema di monitoraggio fermato');
    }

    async performHealthCheck() {
        this.logger.log('Iniziando controllo salute sistema...');
        
        const checkResults = {
            timestamp: new Date().toISOString(),
            tokenChecks: [],
            dexChecks: [],
            systemChecks: [],
            issuesFound: [],
            autoFixesApplied: []
        };
        
        try {
            // Controlla salute dei token
            for (const token of this.tokens) {
                const tokenHealth = await this.checkTokenHealth(token);
                checkResults.tokenChecks.push(tokenHealth);
                
                if (!tokenHealth.healthy) {
                    checkResults.issuesFound.push({
                        type: 'token',
                        token: token.name,
                        issues: tokenHealth.issues
                    });
                    
                    // Applica auto-fix se abilitato
                    if (this.autoFixEnabled) {
                        const fixes = await this.autoFixTokenIssues(token, tokenHealth.issues);
                        checkResults.autoFixesApplied.push(...fixes);
                    }
                }
            }
            
            // Controlla salute DEX
            const dexHealth = await this.checkDEXHealth();
            checkResults.dexChecks.push(dexHealth);
            
            if (!dexHealth.healthy && this.autoFixEnabled) {
                const dexFixes = await this.autoFixDEXIssues(dexHealth.issues);
                checkResults.autoFixesApplied.push(...dexFixes);
            }
            
            // Controlla salute sistema
            const systemHealth = await this.checkSystemHealth();
            checkResults.systemChecks.push(systemHealth);
            
            if (!systemHealth.healthy && this.autoFixEnabled) {
                const systemFixes = await this.autoFixSystemIssues(systemHealth.issues);
                checkResults.autoFixesApplied.push(...systemFixes);
            }
            
            // Salva risultati
            this.healthChecks.push(checkResults);
            
            // Log risultati
            this.logHealthCheckResults(checkResults);
            
            return checkResults;
            
        } catch (error) {
            this.logger.error('Errore durante controllo salute', error);
            return null;
        }
    }

    async checkTokenHealth(token) {
        const health = {
            token: token.name,
            mint: token.mint,
            healthy: true,
            issues: [],
            checks: {
                mintExists: false,
                balanceCorrect: false,
                metadataValid: false,
                tradingActive: false
            }
        };
        
        try {
            // Controlla esistenza mint
            try {
                const mintInfo = await this.connection.getParsedAccountInfo(new PublicKey(token.mint));
                health.checks.mintExists = mintInfo.value !== null;
                
                if (!health.checks.mintExists) {
                    health.issues.push('Mint non trovato');
                    health.healthy = false;
                }
            } catch (error) {
                health.issues.push(`Errore controllo mint: ${error.message}`);
                health.healthy = false;
            }
            
            // Controlla balance
            try {
                if (token.tokenAccount) {
                    const balance = await this.connection.getTokenAccountBalance(new PublicKey(token.tokenAccount));
                    health.checks.balanceCorrect = balance.value.uiAmount > 0;
                    
                    if (!health.checks.balanceCorrect) {
                        health.issues.push('Balance token zero o negativo');
                        health.healthy = false;
                    }
                }
            } catch (error) {
                health.issues.push(`Errore controllo balance: ${error.message}`);
                health.healthy = false;
            }
            
            // Controlla metadata
            try {
                const metadataValid = await this.validator.validateTokenMint(token.mint);
                health.checks.metadataValid = metadataValid;
                
                if (!metadataValid) {
                    health.issues.push('Metadata non validi');
                    health.healthy = false;
                }
            } catch (error) {
                health.issues.push(`Errore controllo metadata: ${error.message}`);
            }
            
            // Controlla trading attivo
            try {
                const tradingActive = await this.checkTokenTrading(token);
                health.checks.tradingActive = tradingActive;
                
                if (!tradingActive) {
                    health.issues.push('Trading non attivo sui DEX');
                    // Non marca come unhealthy, potrebbe essere normale per token nuovi
                }
            } catch (error) {
                health.issues.push(`Errore controllo trading: ${error.message}`);
            }
            
        } catch (error) {
            health.issues.push(`Errore generale: ${error.message}`);
            health.healthy = false;
        }
        
        return health;
    }

    async checkTokenTrading(token) {
        // Simula controllo trading sui DEX
        // In un ambiente reale, controllerebbe le API dei DEX
        try {
            await this.sleep(100); // Simula chiamata API
            return Math.random() > 0.2; // 80% probabilità di trading attivo
        } catch (error) {
            return false;
        }
    }

    async checkDEXHealth() {
        const health = {
            healthy: true,
            issues: [],
            dexStatus: {
                raydium: { online: false, responseTime: 0 },
                orca: { online: false, responseTime: 0 },
                serum: { online: false, responseTime: 0 }
            }
        };
        
        // Controlla Raydium
        if (config.RAYDIUM_ENABLED) {
            try {
                const start = Date.now();
                // Simula chiamata API Raydium
                await this.sleep(Math.random() * 1000);
                health.dexStatus.raydium.online = Math.random() > 0.05; // 95% uptime
                health.dexStatus.raydium.responseTime = Date.now() - start;
                
                if (!health.dexStatus.raydium.online) {
                    health.issues.push('Raydium non disponibile');
                    health.healthy = false;
                }
            } catch (error) {
                health.issues.push(`Errore Raydium: ${error.message}`);
                health.healthy = false;
            }
        }
        
        // Controlla Orca
        if (config.ORCA_ENABLED) {
            try {
                const start = Date.now();
                await this.sleep(Math.random() * 1000);
                health.dexStatus.orca.online = Math.random() > 0.05;
                health.dexStatus.orca.responseTime = Date.now() - start;
                
                if (!health.dexStatus.orca.online) {
                    health.issues.push('Orca non disponibile');
                    health.healthy = false;
                }
            } catch (error) {
                health.issues.push(`Errore Orca: ${error.message}`);
                health.healthy = false;
            }
        }
        
        // Controlla Serum
        if (config.SERUM_ENABLED) {
            try {
                const start = Date.now();
                await this.sleep(Math.random() * 1000);
                health.dexStatus.serum.online = Math.random() > 0.05;
                health.dexStatus.serum.responseTime = Date.now() - start;
                
                if (!health.dexStatus.serum.online) {
                    health.issues.push('Serum non disponibile');
                    health.healthy = false;
                }
            } catch (error) {
                health.issues.push(`Errore Serum: ${error.message}`);
                health.healthy = false;
            }
        }
        
        return health;
    }

    async checkSystemHealth() {
        const health = {
            healthy: true,
            issues: [],
            checks: {
                rpcConnection: false,
                walletBalance: false,
                diskSpace: false,
                memoryUsage: false
            }
        };
        
        try {
            // Controlla connessione RPC
            try {
                const slot = await this.connection.getSlot();
                health.checks.rpcConnection = slot > 0;
                
                if (!health.checks.rpcConnection) {
                    health.issues.push('Connessione RPC non funzionante');
                    health.healthy = false;
                }
            } catch (error) {
                health.issues.push(`Errore RPC: ${error.message}`);
                health.healthy = false;
            }
            
            // Controlla balance wallet
            try {
                const payer = this.dexManager.payer;
                const balance = await this.connection.getBalance(payer.publicKey);
                health.checks.walletBalance = balance > 0.01 * 1e9; // Almeno 0.01 SOL
                
                if (!health.checks.walletBalance) {
                    health.issues.push('Balance wallet insufficiente');
                    health.healthy = false;
                }
            } catch (error) {
                health.issues.push(`Errore controllo wallet: ${error.message}`);
                health.healthy = false;
            }
            
            // Controlla uso memoria (simulato)
            const memoryUsage = process.memoryUsage();
            const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
            health.checks.memoryUsage = memoryUsageMB < 500; // Meno di 500MB
            
            if (!health.checks.memoryUsage) {
                health.issues.push(`Uso memoria elevato: ${memoryUsageMB.toFixed(2)}MB`);
                // Non marca come unhealthy, solo warning
            }
            
        } catch (error) {
            health.issues.push(`Errore controllo sistema: ${error.message}`);
            health.healthy = false;
        }
        
        return health;
    }

    async autoFixTokenIssues(token, issues) {
        const fixes = [];
        
        for (const issue of issues) {
            try {
                let fixApplied = false;
                
                if (issue.includes('Balance token zero')) {
                    // Tenta di rimintare token
                    fixApplied = await this.fixTokenBalance(token);
                    if (fixApplied) {
                        fixes.push({
                            token: token.name,
                            issue: issue,
                            fix: 'Token rimintati',
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                
                if (issue.includes('Trading non attivo')) {
                    // Tenta di riattivare trading
                    fixApplied = await this.fixTokenTrading(token);
                    if (fixApplied) {
                        fixes.push({
                            token: token.name,
                            issue: issue,
                            fix: 'Trading riattivato',
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                
                if (fixApplied) {
                    this.logger.logBugFix(issue, `Auto-fix applicato per ${token.name}`);
                }
                
            } catch (error) {
                this.logger.error(`Errore auto-fix per ${token.name}: ${error.message}`);
            }
        }
        
        return fixes;
    }

    async fixTokenBalance(token) {
        // Simula fix del balance
        this.logger.log(`Applicando fix balance per ${token.name}`);
        await this.sleep(1000);
        return Math.random() > 0.3; // 70% successo
    }

    async fixTokenTrading(token) {
        // Simula riattivazione trading
        this.logger.log(`Riattivando trading per ${token.name}`);
        await this.sleep(2000);
        return Math.random() > 0.2; // 80% successo
    }

    async autoFixDEXIssues(issues) {
        const fixes = [];
        
        for (const issue of issues) {
            if (issue.includes('non disponibile')) {
                // Tenta di riconnettere al DEX
                const dexName = issue.split(' ')[0].toLowerCase();
                const fixed = await this.reconnectToDEX(dexName);
                
                if (fixed) {
                    fixes.push({
                        issue: issue,
                        fix: `Riconnessione a ${dexName}`,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
        
        return fixes;
    }

    async reconnectToDEX(dexName) {
        this.logger.log(`Tentando riconnessione a ${dexName}`);
        await this.sleep(3000);
        return Math.random() > 0.4; // 60% successo
    }

    async autoFixSystemIssues(issues) {
        const fixes = [];
        
        for (const issue of issues) {
            if (issue.includes('Connessione RPC')) {
                const fixed = await this.fixRPCConnection();
                if (fixed) {
                    fixes.push({
                        issue: issue,
                        fix: 'Connessione RPC ripristinata',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
        
        return fixes;
    }

    async fixRPCConnection() {
        this.logger.log('Tentando ripristino connessione RPC');
        await this.sleep(2000);
        return Math.random() > 0.3; // 70% successo
    }

    logHealthCheckResults(results) {
        const totalIssues = results.issuesFound.length;
        const totalFixes = results.autoFixesApplied.length;
        
        if (totalIssues === 0) {
            this.logger.success('Controllo salute completato - Nessun problema rilevato');
        } else {
            this.logger.warning(`Controllo salute completato - ${totalIssues} problemi rilevati, ${totalFixes} fix applicati`);
        }
        
        this.logger.logMonitoringCheck({
            tokenChecks: results.tokenChecks.length,
            issuesFound: totalIssues,
            autoFixesApplied: totalFixes
        });
    }

    getHealthHistory(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.healthChecks.filter(check => 
            new Date(check.timestamp) > cutoff
        );
    }

    getSystemStats() {
        const recentChecks = this.getHealthHistory(24);
        
        return {
            monitoring: {
                isRunning: this.isRunning,
                totalChecks: this.healthChecks.length,
                recentChecks: recentChecks.length,
                interval: this.checkInterval
            },
            health: {
                totalIssues: recentChecks.reduce((sum, check) => sum + check.issuesFound.length, 0),
                totalFixes: recentChecks.reduce((sum, check) => sum + check.autoFixesApplied.length, 0),
                autoFixEnabled: this.autoFixEnabled
            },
            tokens: {
                monitored: this.tokens.length,
                healthy: recentChecks.length > 0 ? 
                    recentChecks[recentChecks.length - 1].tokenChecks.filter(t => t.healthy).length : 0
            }
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    addToken(token) {
        this.tokens.push(token);
        this.logger.log(`Token ${token.name} aggiunto al monitoraggio`);
    }

    removeToken(tokenMint) {
        const index = this.tokens.findIndex(t => t.mint === tokenMint);
        if (index !== -1) {
            const removed = this.tokens.splice(index, 1)[0];
            this.logger.log(`Token ${removed.name} rimosso dal monitoraggio`);
            return true;
        }
        return false;
    }

    async loadHistoricalMetrics(timeRange = '24h') {
        try {
            this.logger.log(`Caricamento metriche storiche per periodo: ${timeRange}`);
            
            const now = Date.now();
            let startTime;
            
            // Calcola il periodo di tempo
            switch (timeRange) {
                case '1h':
                    startTime = now - (60 * 60 * 1000);
                    break;
                case '6h':
                    startTime = now - (6 * 60 * 60 * 1000);
                    break;
                case '24h':
                    startTime = now - (24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startTime = now - (7 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startTime = now - (24 * 60 * 60 * 1000);
            }
            
            // Filtra i controlli di salute nel periodo specificato
            const historicalChecks = this.healthChecks.filter(check => 
                check.timestamp >= startTime
            );
            
            // Calcola metriche aggregate
            const metrics = {
                period: timeRange,
                startTime: new Date(startTime),
                endTime: new Date(now),
                totalChecks: historicalChecks.length,
                totalIssues: historicalChecks.reduce((sum, check) => sum + check.issuesFound.length, 0),
                totalFixes: historicalChecks.reduce((sum, check) => sum + check.autoFixesApplied.length, 0),
                averageIssuesPerCheck: historicalChecks.length > 0 ? 
                    historicalChecks.reduce((sum, check) => sum + check.issuesFound.length, 0) / historicalChecks.length : 0,
                tokenMetrics: this.calculateTokenMetrics(historicalChecks),
                dexMetrics: this.calculateDEXMetrics(historicalChecks),
                systemMetrics: this.calculateSystemMetrics(historicalChecks),
                trends: this.calculateTrends(historicalChecks)
            };
            
            this.logger.log(`Metriche storiche caricate: ${metrics.totalChecks} controlli, ${metrics.totalIssues} problemi`);
            return metrics;
            
        } catch (error) {
            this.logger.error(`Errore nel caricamento metriche storiche: ${error.message}`);
            return {
                period: timeRange,
                error: error.message,
                totalChecks: 0,
                totalIssues: 0,
                totalFixes: 0
            };
        }
    }

    calculateTokenMetrics(checks) {
        const tokenStats = {};
        
        checks.forEach(check => {
            check.tokenChecks.forEach(tokenCheck => {
                if (!tokenStats[tokenCheck.token]) {
                    tokenStats[tokenCheck.token] = {
                        totalChecks: 0,
                        healthyChecks: 0,
                        issues: []
                    };
                }
                
                tokenStats[tokenCheck.token].totalChecks++;
                if (tokenCheck.healthy) {
                    tokenStats[tokenCheck.token].healthyChecks++;
                }
                tokenStats[tokenCheck.token].issues.push(...tokenCheck.issues);
            });
        });
        
        return tokenStats;
    }

    calculateDEXMetrics(checks) {
        let totalDEXChecks = 0;
        let healthyDEXChecks = 0;
        const dexIssues = [];
        
        checks.forEach(check => {
            check.dexChecks.forEach(dexCheck => {
                totalDEXChecks++;
                if (dexCheck.healthy) {
                    healthyDEXChecks++;
                }
                dexIssues.push(...dexCheck.issues || []);
            });
        });
        
        return {
            totalChecks: totalDEXChecks,
            healthyChecks: healthyDEXChecks,
            healthRate: totalDEXChecks > 0 ? (healthyDEXChecks / totalDEXChecks) * 100 : 0,
            commonIssues: this.getCommonIssues(dexIssues)
        };
    }

    calculateSystemMetrics(checks) {
        let totalSystemChecks = 0;
        let healthySystemChecks = 0;
        const systemIssues = [];
        
        checks.forEach(check => {
            check.systemChecks.forEach(systemCheck => {
                totalSystemChecks++;
                if (systemCheck.healthy) {
                    healthySystemChecks++;
                }
                systemIssues.push(...systemCheck.issues || []);
            });
        });
        
        return {
            totalChecks: totalSystemChecks,
            healthyChecks: healthySystemChecks,
            healthRate: totalSystemChecks > 0 ? (healthySystemChecks / totalSystemChecks) * 100 : 0,
            commonIssues: this.getCommonIssues(systemIssues)
        };
    }

    calculateTrends(checks) {
        if (checks.length < 2) {
            return { insufficient_data: true };
        }
        
        const sortedChecks = checks.sort((a, b) => a.timestamp - b.timestamp);
        const firstHalf = sortedChecks.slice(0, Math.floor(sortedChecks.length / 2));
        const secondHalf = sortedChecks.slice(Math.floor(sortedChecks.length / 2));
        
        const firstHalfAvgIssues = firstHalf.reduce((sum, check) => sum + check.issuesFound.length, 0) / firstHalf.length;
        const secondHalfAvgIssues = secondHalf.reduce((sum, check) => sum + check.issuesFound.length, 0) / secondHalf.length;
        
        return {
            issuesTrend: secondHalfAvgIssues > firstHalfAvgIssues ? 'increasing' : 
                        secondHalfAvgIssues < firstHalfAvgIssues ? 'decreasing' : 'stable',
            trendPercentage: firstHalfAvgIssues > 0 ? 
                ((secondHalfAvgIssues - firstHalfAvgIssues) / firstHalfAvgIssues) * 100 : 0
        };
    }

    getCommonIssues(issues) {
        const issueCount = {};
        issues.forEach(issue => {
            issueCount[issue] = (issueCount[issue] || 0) + 1;
        });
        
        return Object.entries(issueCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([issue, count]) => ({ issue, count }));
    }
}