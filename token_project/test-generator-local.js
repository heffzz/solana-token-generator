const TokenGenerator = require('./tokenGenerator');

async function testTokenGenerator() {
    console.log('🧪 Test locale del Token Generator...');
    
    try {
        const generator = new TokenGenerator();
        console.log('✅ TokenGenerator creato');
        
        const initResult = await generator.initialize();
        console.log('✅ Inizializzazione completata:', initResult);
        
        const balance = await generator.checkBalance();
        console.log('✅ Balance check completato:', balance);
        
        console.log('🎉 Test completato con successo!');
    } catch (error) {
        console.error('❌ Errore nel test:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

testTokenGenerator();