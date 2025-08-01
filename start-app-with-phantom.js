#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AppLauncher {
    constructor() {
        this.processes = [];
        this.isShuttingDown = false;
    }

    async start() {
        console.log('🚀 Avvio Sistema Completo con Phantom Integration...');
        
        try {
            // Avvia il server Phantom backend
            await this.startPhantomServer();
            
            // Aspetta che il server sia pronto
            await this.waitForServer();
            
            // Avvia la GUI React
            await this.startReactGUI();
            
            // Gestisci la chiusura
            this.setupGracefulShutdown();
            
        } catch (error) {
            console.error('❌ Errore durante l\'avvio:', error.message);
            await this.shutdown();
            process.exit(1);
        }
    }

    async startPhantomServer() {
        console.log('🦄 Avvio server Phantom backend...');
        
        const serverProcess = spawn('node', ['phantom-backend-server.js'], {
            cwd: __dirname,
            stdio: ['inherit', 'pipe', 'pipe']
        });

        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`[Phantom Server] ${output.trim()}`);
        });

        serverProcess.stderr.on('data', (data) => {
            const error = data.toString();
            console.error(`[Phantom Server Error] ${error.trim()}`);
        });

        serverProcess.on('close', (code) => {
            if (!this.isShuttingDown) {
                console.log(`❌ Server Phantom terminato con codice ${code}`);
            }
        });

        this.processes.push({
            name: 'Phantom Server',
            process: serverProcess
        });

        return new Promise((resolve) => {
            setTimeout(resolve, 3000); // Aspetta 3 secondi per l'avvio
        });
    }

    async waitForServer() {
        console.log('⏳ Verifica disponibilità server...');
        
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            try {
                const response = await fetch('http://localhost:3000');
                if (response.ok) {
                    console.log('✅ Server Phantom pronto!');
                    return;
                }
            } catch (error) {
                // Server non ancora pronto
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        throw new Error('Server Phantom non risponde dopo 10 tentativi');
    }

    async startReactGUI() {
        console.log('⚛️ Avvio GUI React...');
        
        const guiProcess = spawn('npm', ['start'], {
            cwd: join(__dirname, 'gui'),
            stdio: ['inherit', 'pipe', 'pipe'],
            shell: true,
            env: { ...process.env, PORT: '10000' }
        });

        guiProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`[React GUI] ${output.trim()}`);
            
            // Rileva quando React è pronto
            if (output.includes('webpack compiled') || output.includes('Local:')) {
                console.log('🎉 GUI React pronta!');
                console.log('\n📱 Accesso all\'applicazione:');
                console.log('   • GUI React: http://localhost:10000');
                console.log('   • Phantom API: http://localhost:3000');
                console.log('\n🦄 Phantom Wallet integrato nella GUI!');
                console.log('   Vai su: http://localhost:10000/phantom-wallet\n');
            }
        });

        guiProcess.stderr.on('data', (data) => {
            const error = data.toString();
            if (!error.includes('Warning')) {
                console.error(`[React GUI Error] ${error.trim()}`);
            }
        });

        guiProcess.on('close', (code) => {
            if (!this.isShuttingDown) {
                console.log(`❌ GUI React terminata con codice ${code}`);
            }
        });

        this.processes.push({
            name: 'React GUI',
            process: guiProcess
        });
    }

    setupGracefulShutdown() {
        const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
        
        signals.forEach(signal => {
            process.on(signal, async () => {
                console.log(`\n🛑 Ricevuto segnale ${signal}, chiusura in corso...`);
                await this.shutdown();
                process.exit(0);
            });
        });
    }

    async shutdown() {
        if (this.isShuttingDown) return;
        
        this.isShuttingDown = true;
        console.log('🔄 Chiusura processi...');
        
        for (const { name, process } of this.processes) {
            try {
                console.log(`   Chiusura ${name}...`);
                process.kill('SIGTERM');
                
                // Aspetta un po' per la chiusura graceful
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Forza la chiusura se necessario
                if (!process.killed) {
                    process.kill('SIGKILL');
                }
            } catch (error) {
                console.error(`Errore nella chiusura di ${name}:`, error.message);
            }
        }
        
        console.log('✅ Tutti i processi chiusi');
    }
}

// Avvia l'applicazione
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('start-app-with-phantom.js')) {
    const launcher = new AppLauncher();
    launcher.start().catch(console.error);
}

export default AppLauncher;