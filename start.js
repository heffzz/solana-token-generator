import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Avvio Sistema Autonomo di Generazione Token SPL');
console.log('================================================');

// Verifica prerequisiti
const checkPrerequisites = async () => {
    console.log('\n📋 Verifica prerequisiti...');
    
    // Verifica file .env
    if (!fs.existsSync(path.join(__dirname, '.env'))) {
        console.error('❌ File .env non trovato!');
        console.log('   Esegui: node generate-keypair.js');
        return false;
    }
    
    // Verifica directory necessarie
    const requiredDirs = ['logs', 'data', 'exports', 'backups'];
    for (const dir of requiredDirs) {
        if (!fs.existsSync(path.join(__dirname, dir))) {
            console.log(`📁 Creazione directory ${dir}...`);
            fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
        }
    }
    
    // Verifica dipendenze npm
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        console.log(`✅ Package.json trovato (${Object.keys(packageJson.dependencies).length} dipendenze)`);
    } catch (error) {
        console.error('❌ Errore nel leggere package.json:', error.message);
        return false;
    }
    
    return true;
};

// Avvia il sistema
const startSystem = () => {
    console.log('\n🚀 Avvio sistema...');
    
    // Imposta npm start per eseguire index.js
    const packageJsonPath = path.join(__dirname, 'package.json');
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (!packageJson.scripts || !packageJson.scripts.start) {
            packageJson.scripts = packageJson.scripts || {};
            packageJson.scripts.start = 'node index.js';
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            console.log('✅ Script npm start configurato');
        }
    } catch (error) {
        console.error('⚠️ Impossibile configurare npm start:', error.message);
    }
    
    // Esegui il sistema
    console.log('\n🔄 Esecuzione sistema autonomo...');
    console.log('\n📊 Output sistema:');
    console.log('------------------------------------------------');
    
    const child = exec('node index.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`\n❌ Errore nell'esecuzione: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`\n⚠️ Stderr: ${stderr}`);
            return;
        }
        console.log(`\n✅ Sistema completato con successo!`);
    });
    
    // Mostra output in tempo reale
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    
    // Gestione interruzione
    process.on('SIGINT', () => {
        console.log('\n⚠️ Interruzione richiesta, chiusura sistema...');
        child.kill();
        process.exit(0);
    });
};

// Esecuzione principale
const main = async () => {
    const prerequisitesOk = await checkPrerequisites();
    
    if (prerequisitesOk) {
        console.log('\n✅ Tutti i prerequisiti soddisfatti!');
        startSystem();
    } else {
        console.error('\n❌ Prerequisiti non soddisfatti. Risolvi i problemi e riprova.');
        process.exit(1);
    }
};

// Avvio
main().catch(error => {
    console.error('\n❌ Errore fatale:', error.message);
    process.exit(1);
});