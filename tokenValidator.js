import axios from 'axios';
import { Logger } from './logger.js';

export class TokenValidator {
    constructor() {
        this.logger = new Logger();
        this.checkedTokens = new Set();
        this.solscanBaseUrl = 'https://public-api.solscan.io';
        this.jupiterBaseUrl = 'https://quote-api.jup.ag/v6';
    }

    async validateUniqueness(name, symbol) {
        try {
            this.logger.log(`Validando unicità per: ${name} (${symbol})`);
            
            // Controlla cache locale
            const cacheKey = `${name.toLowerCase()}_${symbol.toLowerCase()}`;
            if (this.checkedTokens.has(cacheKey)) {
                this.logger.log('Token già controllato in precedenza');
                return false;
            }
            
            // Controlla su multiple fonti
            const checks = await Promise.allSettled([
                this.checkSolscan(symbol),
                this.checkJupiter(symbol),
                this.checkSimilarNames(name, symbol)
            ]);
            
            const isUnique = checks.every(result => 
                result.status === 'fulfilled' && result.value === true
            );
            
            if (!isUnique) {
                this.checkedTokens.add(cacheKey);
            }
            
            this.logger.log(`Risultato validazione: ${isUnique ? 'UNICO' : 'DUPLICATO'}`);
            return isUnique;
            
        } catch (error) {
            this.logger.error(`Errore nella validazione: ${error.message}`);
            // In caso di errore, assumiamo che sia unico per non bloccare il processo
            return true;
        }
    }

    async checkSolscan(symbol) {
        try {
            const response = await axios.get(
                `${this.solscanBaseUrl}/token/search?keyword=${symbol}`,
                {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'TokenGenerator/1.0'
                    }
                }
            );
            
            if (response.data && response.data.data) {
                const exactMatches = response.data.data.filter(token => 
                    token.symbol && token.symbol.toLowerCase() === symbol.toLowerCase()
                );
                
                return exactMatches.length === 0;
            }
            
            return true;
        } catch (error) {
            this.logger.error(`Errore controllo Solscan: ${error.message}`);
            return true; // Assume unico se API non disponibile
        }
    }

    async checkJupiter(symbol) {
        try {
            const response = await axios.get(
                `${this.jupiterBaseUrl}/tokens`,
                {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'TokenGenerator/1.0'
                    }
                }
            );
            
            if (response.data) {
                const tokens = Array.isArray(response.data) ? response.data : response.data.tokens || [];
                const exactMatches = tokens.filter(token => 
                    token.symbol && token.symbol.toLowerCase() === symbol.toLowerCase()
                );
                
                return exactMatches.length === 0;
            }
            
            return true;
        } catch (error) {
            this.logger.error(`Errore controllo Jupiter: ${error.message}`);
            return true;
        }
    }

    async checkSimilarNames(name, symbol) {
        try {
            // Lista di nomi e simboli comuni da evitare
            const reservedNames = [
                'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'usdc', 'usdt',
                'bnb', 'ada', 'dot', 'link', 'ltc', 'bch', 'xlm', 'vet', 'theta',
                'doge', 'shib', 'matic', 'avax', 'luna', 'atom', 'near', 'algo',
                'mana', 'sand', 'axs', 'gala', 'enj', 'chz', 'bat', 'zrx'
            ];
            
            const nameLower = name.toLowerCase();
            const symbolLower = symbol.toLowerCase();
            
            // Controlla nomi riservati
            const hasReservedName = reservedNames.some(reserved => 
                nameLower.includes(reserved) || symbolLower.includes(reserved)
            );
            
            if (hasReservedName) {
                this.logger.log(`Nome/simbolo contiene termine riservato: ${name}/${symbol}`);
                return false;
            }
            
            // Controlla similarità con token già creati
            const similarToCreated = Array.from(this.checkedTokens).some(cached => {
                const [cachedName, cachedSymbol] = cached.split('_');
                return this.calculateSimilarity(nameLower, cachedName) > 0.8 ||
                       this.calculateSimilarity(symbolLower, cachedSymbol) > 0.8;
            });
            
            return !similarToCreated;
            
        } catch (error) {
            this.logger.error(`Errore controllo similarità: ${error.message}`);
            return true;
        }
    }

    calculateSimilarity(str1, str2) {
        // Implementazione semplice di Levenshtein distance
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0) return len2;
        if (len2 === 0) return len1;
        
        // Inizializza matrice
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        // Calcola distanza
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }
        
        const distance = matrix[len1][len2];
        const maxLen = Math.max(len1, len2);
        return 1 - (distance / maxLen);
    }

    async validateTokenMint(mintAddress) {
        try {
            const response = await axios.get(
                `${this.solscanBaseUrl}/token/meta?tokenAddress=${mintAddress}`,
                {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'TokenGenerator/1.0'
                    }
                }
            );
            
            return response.data && response.data.symbol;
        } catch (error) {
            this.logger.error(`Errore validazione mint: ${error.message}`);
            return false;
        }
    }

    async getTokenInfo(mintAddress) {
        try {
            const response = await axios.get(
                `${this.solscanBaseUrl}/token/meta?tokenAddress=${mintAddress}`,
                { timeout: 5000 }
            );
            
            return response.data;
        } catch (error) {
            this.logger.error(`Errore recupero info token: ${error.message}`);
            return null;
        }
    }

    clearCache() {
        this.checkedTokens.clear();
        this.logger.log('Cache validazione pulita');
    }

    getCacheSize() {
        return this.checkedTokens.size;
    }

    validateTokenParams(tokenConfig) {
        try {
            const errors = [];
            
            // Validazione nome
            if (!tokenConfig.name || typeof tokenConfig.name !== 'string') {
                errors.push('Nome token mancante o non valido');
            } else if (tokenConfig.name.length < 2 || tokenConfig.name.length > 32) {
                errors.push('Nome token deve essere tra 2 e 32 caratteri');
            }
            
            // Validazione simbolo
            if (!tokenConfig.symbol || typeof tokenConfig.symbol !== 'string') {
                errors.push('Simbolo token mancante o non valido');
            } else if (tokenConfig.symbol.length < 2 || tokenConfig.symbol.length > 10) {
                errors.push('Simbolo token deve essere tra 2 e 10 caratteri');
            }
            
            // Validazione supply
            if (!tokenConfig.supply || typeof tokenConfig.supply !== 'number') {
                errors.push('Supply token mancante o non valido');
            } else if (tokenConfig.supply <= 0 || tokenConfig.supply > 1000000000) {
                errors.push('Supply token deve essere tra 1 e 1,000,000,000');
            }
            
            // Validazione decimali
            if (tokenConfig.decimals !== undefined) {
                if (typeof tokenConfig.decimals !== 'number' || tokenConfig.decimals < 0 || tokenConfig.decimals > 9) {
                    errors.push('Decimali devono essere tra 0 e 9');
                }
            }
            
            // Validazione descrizione (opzionale)
            if (tokenConfig.description && typeof tokenConfig.description !== 'string') {
                errors.push('Descrizione deve essere una stringa');
            } else if (tokenConfig.description && tokenConfig.description.length > 500) {
                errors.push('Descrizione non può superare 500 caratteri');
            }
            
            this.logger.log(`Validazione parametri token: ${errors.length === 0 ? 'SUCCESSO' : 'ERRORI TROVATI'}`);
            
            return {
                isValid: errors.length === 0,
                errors: errors
            };
            
        } catch (error) {
            this.logger.error(`Errore nella validazione parametri: ${error.message}`);
            return {
                isValid: false,
                errors: ['Errore interno nella validazione']
            };
        }
    }
}