const axios = require('axios');
const chalk = require('chalk');
const config = require('./config');
const logger = require('./logger');

class TokenValidator {
  constructor() {
    this.apis = config.apis;
  }

  // Verifica l'unicità del nome e simbolo del token
  async checkTokenUniqueness(name, symbol) {
    try {
      console.log(chalk.blue(`🔍 Controllo unicità per ${name} (${symbol})...`));
      
      const checks = await Promise.allSettled([
        this.checkSolscan(name, symbol),
        this.checkDexScreener(symbol),
        this.checkCoinGecko(name, symbol)
      ]);
      
      let conflicts = [];
      
      checks.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.conflict) {
          conflicts.push(result.value);
        }
      });
      
      if (conflicts.length > 0) {
        console.log(chalk.red('❌ Conflitti trovati:'));
        conflicts.forEach(conflict => {
          console.log(chalk.red(`   - ${conflict.source}: ${conflict.message}`));
        });
        return false;
      }
      
      console.log(chalk.green('✅ Nome e simbolo disponibili'));
      return true;
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nella validazione:'), error.message);
      logger.error('Token validation failed:', error);
      return false;
    }
  }

  // Controlla Solscan per token esistenti
  async checkSolscan(name, symbol) {
    try {
      const response = await axios.get(`${this.apis.solscan}/token/search`, {
        params: {
          q: symbol,
          limit: 10
        },
        timeout: 10000
      });
      
      if (response.data && response.data.data) {
        const tokens = response.data.data;
        
        for (const token of tokens) {
          if (token.symbol && token.symbol.toLowerCase() === symbol.toLowerCase()) {
            return {
              conflict: true,
              source: 'Solscan',
              message: `Token con simbolo ${symbol} già esistente: ${token.address}`
            };
          }
          
          if (token.name && token.name.toLowerCase() === name.toLowerCase()) {
            return {
              conflict: true,
              source: 'Solscan',
              message: `Token con nome ${name} già esistente: ${token.address}`
            };
          }
        }
      }
      
      return { conflict: false, source: 'Solscan' };
      
    } catch (error) {
      console.log(chalk.yellow('⚠️  Solscan non raggiungibile, continuando...'));
      logger.warn('Solscan check failed:', error.message);
      return { conflict: false, source: 'Solscan', error: error.message };
    }
  }

  // Controlla DexScreener per token esistenti
  async checkDexScreener(symbol) {
    try {
      const response = await axios.get(`${this.apis.dexscreener}/search`, {
        params: {
          q: symbol
        },
        timeout: 10000
      });
      
      if (response.data && response.data.pairs) {
        const pairs = response.data.pairs;
        
        for (const pair of pairs) {
          if (pair.baseToken && pair.baseToken.symbol && 
              pair.baseToken.symbol.toLowerCase() === symbol.toLowerCase() &&
              pair.chainId === 'solana') {
            return {
              conflict: true,
              source: 'DexScreener',
              message: `Token con simbolo ${symbol} già tradato su Solana: ${pair.baseToken.address}`
            };
          }
        }
      }
      
      return { conflict: false, source: 'DexScreener' };
      
    } catch (error) {
      console.log(chalk.yellow('⚠️  DexScreener non raggiungibile, continuando...'));
      logger.warn('DexScreener check failed:', error.message);
      return { conflict: false, source: 'DexScreener', error: error.message };
    }
  }

  // Controlla CoinGecko per token esistenti
  async checkCoinGecko(name, symbol) {
    try {
      const response = await axios.get(`${this.apis.coingecko}/search`, {
        params: {
          query: symbol
        },
        timeout: 10000
      });
      
      if (response.data && response.data.coins) {
        const coins = response.data.coins;
        
        for (const coin of coins) {
          if (coin.symbol && coin.symbol.toLowerCase() === symbol.toLowerCase()) {
            return {
              conflict: true,
              source: 'CoinGecko',
              message: `Token con simbolo ${symbol} già listato: ${coin.id}`
            };
          }
          
          if (coin.name && coin.name.toLowerCase() === name.toLowerCase()) {
            return {
              conflict: true,
              source: 'CoinGecko',
              message: `Token con nome ${name} già listato: ${coin.id}`
            };
          }
        }
      }
      
      return { conflict: false, source: 'CoinGecko' };
      
    } catch (error) {
      console.log(chalk.yellow('⚠️  CoinGecko non raggiungibile, continuando...'));
      logger.warn('CoinGecko check failed:', error.message);
      return { conflict: false, source: 'CoinGecko', error: error.message };
    }
  }

  // Valida i parametri del token
  validateTokenParameters(tokenConfig) {
    const errors = [];
    
    // Valida nome
    if (!tokenConfig.name || tokenConfig.name.length < 2) {
      errors.push('Il nome del token deve essere di almeno 2 caratteri');
    }
    
    if (tokenConfig.name && tokenConfig.name.length > 50) {
      errors.push('Il nome del token non può superare i 50 caratteri');
    }
    
    // Valida simbolo
    if (!tokenConfig.symbol || tokenConfig.symbol.length < 2) {
      errors.push('Il simbolo del token deve essere di almeno 2 caratteri');
    }
    
    if (tokenConfig.symbol && tokenConfig.symbol.length > 10) {
      errors.push('Il simbolo del token non può superare i 10 caratteri');
    }
    
    if (tokenConfig.symbol && !/^[A-Z0-9]+$/.test(tokenConfig.symbol)) {
      errors.push('Il simbolo del token può contenere solo lettere maiuscole e numeri');
    }
    
    // Valida decimali
    if (tokenConfig.decimals < 0 || tokenConfig.decimals > 18) {
      errors.push('I decimali devono essere tra 0 e 18');
    }
    
    // Valida supply
    if (!tokenConfig.totalSupply || tokenConfig.totalSupply <= 0) {
      errors.push('La supply totale deve essere maggiore di 0');
    }
    
    if (tokenConfig.totalSupply > 1e15) {
      errors.push('La supply totale è troppo elevata');
    }
    
    // Valida descrizione
    if (!tokenConfig.description || tokenConfig.description.length < 10) {
      errors.push('La descrizione deve essere di almeno 10 caratteri');
    }
    
    if (tokenConfig.description && tokenConfig.description.length > 1000) {
      errors.push('La descrizione non può superare i 1000 caratteri');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Verifica la validità degli URL social
  validateSocialLinks(tokenConfig) {
    const errors = [];
    
    const urlPattern = /^https?:\/\/.+/;
    
    if (tokenConfig.website && !urlPattern.test(tokenConfig.website)) {
      errors.push('URL del sito web non valido');
    }
    
    if (tokenConfig.twitter && !tokenConfig.twitter.includes('twitter.com') && !tokenConfig.twitter.includes('x.com')) {
      errors.push('URL Twitter non valido');
    }
    
    if (tokenConfig.telegram && !tokenConfig.telegram.includes('t.me')) {
      errors.push('URL Telegram non valido');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validazione completa del token
  async validateToken(tokenConfig) {
    try {
      console.log(chalk.blue('🔍 Validazione completa del token...'));
      
      // Valida parametri
      const paramValidation = this.validateTokenParameters(tokenConfig);
      if (!paramValidation.valid) {
        console.log(chalk.red('❌ Errori nei parametri:'));
        paramValidation.errors.forEach(error => {
          console.log(chalk.red(`   - ${error}`));
        });
        return false;
      }
      
      // Valida link social
      const socialValidation = this.validateSocialLinks(tokenConfig);
      if (!socialValidation.valid) {
        console.log(chalk.red('❌ Errori nei link social:'));
        socialValidation.errors.forEach(error => {
          console.log(chalk.red(`   - ${error}`));
        });
        return false;
      }
      
      // Verifica unicità
      const uniqueness = await this.checkTokenUniqueness(tokenConfig.name, tokenConfig.symbol);
      if (!uniqueness) {
        return false;
      }
      
      console.log(chalk.green('✅ Token validato con successo'));
      logger.info('Token validation completed successfully');
      return true;
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nella validazione:'), error.message);
      logger.error('Token validation failed:', error);
      return false;
    }
  }
}

module.exports = new TokenValidator();

// Esecuzione diretta per test
if (require.main === module) {
  const validator = new TokenValidator();
  validator.validateToken(config.token).then(result => {
    console.log('Risultato validazione:', result);
  });
}