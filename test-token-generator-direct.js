import TokenGenerator from './token_project/tokenGenerator.js';
import chalk from 'chalk';

async function testTokenGenerator() {
  try {
    console.log(chalk.blue('🧪 Test diretto del Token Generator...'));
    
    const generator = new TokenGenerator();
    
    console.log(chalk.yellow('📋 Inizializzazione...'));
    await generator.initialize();
    
    console.log(chalk.green('✅ Token Generator inizializzato con successo!'));
    
  } catch (error) {
    console.error(chalk.red('❌ Errore nel test:'), error.message);
    console.error(chalk.red('Stack trace:'), error.stack);
  }
}

testTokenGenerator();