
#!/usr/bin/env node

// Script di avvio per l'integrazione Phantom
import { spawn } from 'child_process';
import open from 'open';

console.log('🦄 Avvio integrazione Phantom Wallet...');

// Avvia il server backend
const server = spawn('node', ['phantom-backend-server.js'], {
    stdio: 'inherit'
});

// Aspetta che il server si avvii
setTimeout(() => {
    console.log('🌐 Apertura interfaccia web...');
    open('http://localhost:3000');
}, 2000);

// Gestisci chiusura
process.on('SIGINT', () => {
    console.log('
🛑 Chiusura server...');
    server.kill();
    process.exit();
});
            