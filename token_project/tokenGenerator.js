const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { createMint, getOrCreateAssociatedTokenAccount, mintTo, setAuthority, AuthorityType } = require('@solana/spl-token');
const fs = require('fs-extra');
const chalk = require('chalk');
const config = require('./config');
const logger = require('./logger');
const validator = require('./tokenValidator');

class TokenGenerator {
  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, config.solana.commitment);
    this.payer = null;
    this.mintKeypair = null;
    this.tokenMint = null;
  }

  // Inizializza il generatore con una keypair esistente o ne crea una nuova
  async initialize() {
    try {
      console.log(chalk.blue('🚀 Inizializzazione del generatore di token...'));
      
      // Carica o genera la keypair del pagatore
      await this.loadOrGenerateKeypair();
      
      // Verifica il saldo SOL
      await this.checkBalance();
      
      // Genera la keypair per il mint del token
      this.mintKeypair = Keypair.generate();
      
      console.log(chalk.green('✅ Generatore inizializzato con successo'));
      logger.info('Token generator initialized successfully');
      return true;
      
    } catch (error) {
      console.error(chalk.red('❌ Errore durante l\'inizializzazione:'), error.message);
      logger.error('Initialization failed:', error);
      throw error;
    }
  }

  // Carica una keypair esistente o ne genera una nuova
  async loadOrGenerateKeypair() {
    const keypairPath = './keypair.json';
    
    try {
      if (await fs.pathExists(keypairPath)) {
        console.log(chalk.yellow('📁 Caricamento keypair esistente...'));
        const keypairData = await fs.readJson(keypairPath);
        this.payer = Keypair.fromSecretKey(new Uint8Array(keypairData));
        console.log(chalk.green(`✅ Keypair caricata: ${this.payer.publicKey.toString()}`));
      } else {
        console.log(chalk.yellow('🔑 Generazione nuova keypair...'));
        this.payer = Keypair.generate();
        await fs.writeJson(keypairPath, Array.from(this.payer.secretKey));
        console.log(chalk.green(`✅ Nuova keypair generata: ${this.payer.publicKey.toString()}`));
        console.log(chalk.red('⚠️  IMPORTANTE: Salva la tua keypair in un luogo sicuro!'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Errore nella gestione della keypair:'), error.message);
      throw error;
    }
  }

  // Verifica il saldo SOL del wallet
  async checkBalance() {
    try {
      const balance = await this.connection.getBalance(this.payer.publicKey);
      const solBalance = balance / 1e9;
      
      console.log(chalk.blue(`💰 Saldo SOL: ${solBalance.toFixed(4)} SOL`));
      
      if (solBalance < 0.1) {
        console.log(chalk.red('⚠️  Saldo SOL insufficiente per le operazioni'));
        
        if (config.solana.network === 'devnet') {
          console.log(chalk.yellow('🚰 Richiedo airdrop automatico...'));
          try {
            const airdropSignature = await this.connection.requestAirdrop(
              this.payer.publicKey,
              2 * 1e9 // 2 SOL
            );
            
            await this.connection.confirmTransaction(airdropSignature);
            
            const newBalance = await this.connection.getBalance(this.payer.publicKey);
            const newSolBalance = newBalance / 1e9;
            
            console.log(chalk.green(`✅ Airdrop completato! Nuovo saldo: ${newSolBalance.toFixed(4)} SOL`));
            logger.info(`Airdrop completed. New balance: ${newSolBalance} SOL`);
            return;
          } catch (airdropError) {
            console.log(chalk.red('❌ Airdrop fallito:'), airdropError.message);
          }
        }
        
        console.log(chalk.yellow(`📝 Invia SOL a: ${this.payer.publicKey.toString()}`));
        throw new Error('Saldo insufficiente');
      }
      
      logger.info(`SOL balance: ${solBalance} SOL`);
    } catch (error) {
      if (error.message === 'Saldo insufficiente') {
        throw error;
      }
      console.error(chalk.red('❌ Errore nel controllo del saldo:'), error.message);
      throw error;
    }
  }

  // Valida l'unicità del nome e simbolo del token
  async validateTokenUniqueness() {
    try {
      console.log(chalk.blue('🔍 Validazione unicità del token...'));
      
      const isUnique = await validator.checkTokenUniqueness(
        config.token.name,
        config.token.symbol
      );
      
      if (!isUnique) {
        throw new Error('Nome o simbolo del token già esistente');
      }
      
      console.log(chalk.green('✅ Token validato come unico'));
      logger.info('Token uniqueness validated');
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nella validazione:'), error.message);
      throw error;
    }
  }

  // Crea il token SPL
  async createToken() {
    try {
      console.log(chalk.blue('🏗️  Creazione del token SPL...'));
      
      // Crea il mint del token
      this.tokenMint = await createMint(
        this.connection,
        this.payer,
        this.payer.publicKey, // mint authority
        this.payer.publicKey, // freeze authority
        config.token.decimals,
        this.mintKeypair
      );
      
      console.log(chalk.green(`✅ Token creato con successo!`));
      console.log(chalk.blue(`📍 Indirizzo del token: ${this.tokenMint.toString()}`));
      
      // Salva le informazioni del token
      await this.saveTokenInfo();
      
      logger.info(`Token created: ${this.tokenMint.toString()}`);
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nella creazione del token:'), error.message);
      throw error;
    }
  }

  // Minta i token secondo la distribuzione configurata
  async mintTokens() {
    try {
      console.log(chalk.blue('🪙 Minting dei token...'));
      
      // Crea l'account token associato per il creatore
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.payer,
        this.tokenMint,
        this.payer.publicKey
      );
      
      // Minta la supply totale
      const totalSupply = config.token.totalSupply * Math.pow(10, config.token.decimals);
      
      await mintTo(
        this.connection,
        this.payer,
        this.tokenMint,
        tokenAccount.address,
        this.payer.publicKey,
        totalSupply
      );
      
      console.log(chalk.green(`✅ ${config.token.totalSupply.toLocaleString()} ${config.token.symbol} mintati con successo!`));
      logger.info(`Minted ${config.token.totalSupply} tokens`);
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nel minting:'), error.message);
      throw error;
    }
  }

  // Rinuncia alle autorità del token per aumentare la fiducia
  async renounceAuthorities() {
    try {
      if (!config.security.renounceAuthorities.mint && 
          !config.security.renounceAuthorities.freeze && 
          !config.security.renounceAuthorities.update) {
        console.log(chalk.yellow('⚠️  Nessuna autorità da rinunciare configurata'));
        return;
      }
      
      console.log(chalk.blue('🔒 Rinuncia alle autorità del token...'));
      
      // Rinuncia all'autorità di mint
      if (config.security.renounceAuthorities.mint) {
        await setAuthority(
          this.connection,
          this.payer,
          this.tokenMint,
          this.payer.publicKey,
          AuthorityType.MintTokens,
          null
        );
        console.log(chalk.green('✅ Autorità di mint rinunciata'));
      }
      
      // Rinuncia all'autorità di freeze
      if (config.security.renounceAuthorities.freeze) {
        await setAuthority(
          this.connection,
          this.payer,
          this.tokenMint,
          this.payer.publicKey,
          AuthorityType.FreezeAccount,
          null
        );
        console.log(chalk.green('✅ Autorità di freeze rinunciata'));
      }
      
      logger.info('Token authorities renounced');
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nella rinuncia alle autorità:'), error.message);
      throw error;
    }
  }

  // Salva le informazioni del token in un file
  async saveTokenInfo() {
    try {
      const tokenInfo = {
        name: config.token.name,
        symbol: config.token.symbol,
        decimals: config.token.decimals,
        totalSupply: config.token.totalSupply,
        mintAddress: this.tokenMint.toString(),
        creatorAddress: this.payer.publicKey.toString(),
        createdAt: new Date().toISOString(),
        network: config.solana.network,
        description: config.token.description,
        website: config.token.website,
        twitter: config.token.twitter,
        telegram: config.token.telegram
      };
      
      await fs.writeJson('./token-info.json', tokenInfo, { spaces: 2 });
      console.log(chalk.green('✅ Informazioni del token salvate in token-info.json'));
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nel salvataggio:'), error.message);
      throw error;
    }
  }

  // Processo completo di generazione del token
  async generateToken() {
    try {
      console.log(chalk.magenta('🌙 === LUNACOIN TOKEN GENERATOR === 🌙'));
      console.log(chalk.blue(`📋 Nome: ${config.token.name}`));
      console.log(chalk.blue(`🏷️  Simbolo: ${config.token.symbol}`));
      console.log(chalk.blue(`📊 Supply: ${config.token.totalSupply.toLocaleString()}`));
      console.log(chalk.blue(`🌐 Network: ${config.solana.network}`));
      console.log('');
      
      // Inizializzazione
      await this.initialize();
      
      // Validazione unicità
      await this.validateTokenUniqueness();
      
      // Creazione token
      await this.createToken();
      
      // Minting
      await this.mintTokens();
      
      // Rinuncia autorità
      await this.renounceAuthorities();
      
      console.log('');
      console.log(chalk.green('🎉 TOKEN GENERATO CON SUCCESSO! 🎉'));
      console.log(chalk.blue(`📍 Indirizzo: ${this.tokenMint.toString()}`));
      console.log(chalk.yellow('📝 Prossimi passi:'));
      console.log(chalk.yellow('   1. Creare pool di liquidità'));
      console.log(chalk.yellow('   2. Listare sui DEX'));
      console.log(chalk.yellow('   3. Avviare campagna marketing'));
      
      return {
        success: true,
        tokenAddress: this.tokenMint.toString(),
        creatorAddress: this.payer.publicKey.toString()
      };
      
    } catch (error) {
      console.error(chalk.red('💥 ERRORE NELLA GENERAZIONE DEL TOKEN:'), error.message);
      logger.error('Token generation failed:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = TokenGenerator;

// Esecuzione diretta se il file viene chiamato direttamente
if (require.main === module) {
  const generator = new TokenGenerator();
  generator.generateToken();
}