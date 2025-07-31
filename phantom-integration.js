#!/usr/bin/env node

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

// Configurazione per l'integrazione Phantom
class PhantomIntegration {
    constructor() {
        this.connection = null;
        this.wallet = null;
        this.isConnected = false;
        this.network = 'devnet'; // default devnet per sicurezza
    }

    // Inizializza la connessione Solana
    async initializeConnection(network = 'devnet') {
        this.network = network;
        const rpcUrl = network === 'mainnet' 
            ? 'https://api.mainnet-beta.solana.com'
            : 'https://api.devnet.solana.com';
        
        this.connection = new Connection(rpcUrl, 'confirmed');
        console.log(`🌐 Connesso a Solana ${network.toUpperCase()}`);
        return this.connection;
    }

    // Genera il codice HTML per l'integrazione Phantom
    generatePhantomHTML() {
        return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🦄 Integrazione Phantom Wallet</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        
        .logo {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        
        h1 {
            margin-bottom: 30px;
            font-size: 2rem;
        }
        
        .wallet-info {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            display: none;
        }
        
        .wallet-info.show {
            display: block;
        }
        
        .btn {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            color: white;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
            min-width: 200px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .btn:disabled {
            background: #666;
            cursor: not-allowed;
            transform: none;
        }
        
        .btn.connected {
            background: linear-gradient(45deg, #00b894, #00a085);
        }
        
        .status {
            margin: 20px 0;
            padding: 15px;
            border-radius: 10px;
            font-weight: bold;
        }
        
        .status.success {
            background: rgba(0, 184, 148, 0.3);
            border: 2px solid #00b894;
        }
        
        .status.error {
            background: rgba(255, 107, 107, 0.3);
            border: 2px solid #ff6b6b;
        }
        
        .status.warning {
            background: rgba(255, 193, 7, 0.3);
            border: 2px solid #ffc107;
            color: #333;
        }
        
        .network-selector {
            margin: 20px 0;
        }
        
        .network-selector select {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 10px;
            padding: 10px 15px;
            color: white;
            font-size: 1rem;
        }
        
        .network-selector select option {
            background: #333;
            color: white;
        }
        
        .balance {
            font-size: 1.5rem;
            margin: 15px 0;
        }
        
        .address {
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 8px;
            word-break: break-all;
            margin: 10px 0;
        }
        
        .actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🦄</div>
        <h1>Phantom Wallet Integration</h1>
        
        <div class="network-selector">
            <label for="network">🌐 Network:</label>
            <select id="network" onchange="switchNetwork()">
                <option value="devnet">Devnet (Test)</option>
                <option value="mainnet">Mainnet (Produzione)</option>
            </select>
        </div>
        
        <div id="status" class="status warning">
            ⚠️ Phantom non rilevato. Installa l'estensione Phantom.
        </div>
        
        <button id="connectBtn" class="btn" onclick="connectWallet()">
            🔗 Connetti Phantom
        </button>
        
        <div id="walletInfo" class="wallet-info">
            <h3>💼 Wallet Connesso</h3>
            <div class="address" id="walletAddress"></div>
            <div class="balance" id="walletBalance">💰 Caricamento...</div>
            
            <div class="actions">
                <button class="btn" onclick="refreshBalance()">🔄 Aggiorna Saldo</button>
                <button class="btn" onclick="requestAirdrop()" id="airdropBtn">💧 Richiedi Airdrop (Devnet)</button>
                <button class="btn" onclick="saveConfiguration()">💾 Salva Configurazione</button>
                <button class="btn" onclick="disconnectWallet()">🔌 Disconnetti</button>
            </div>
        </div>
    </div>

    <script>
        let wallet = null;
        let connection = null;
        let currentNetwork = 'devnet';
        
        // Inizializza l'app
        window.onload = function() {
            checkPhantom();
            initializeConnection();
        };
        
        // Controlla se Phantom è installato
        function checkPhantom() {
            const status = document.getElementById('status');
            
            if (window.solana && window.solana.isPhantom) {
                status.className = 'status success';
                status.innerHTML = '✅ Phantom rilevato! Pronto per la connessione.';
                document.getElementById('connectBtn').disabled = false;
            } else {
                status.className = 'status error';
                status.innerHTML = '❌ Phantom non trovato. <a href="https://phantom.app" target="_blank" style="color: #fff;">Installa Phantom</a>';
                document.getElementById('connectBtn').disabled = true;
            }
        }
        
        // Inizializza connessione Solana
        function initializeConnection() {
            const rpcUrl = currentNetwork === 'mainnet' 
                ? 'https://api.mainnet-beta.solana.com'
                : 'https://api.devnet.solana.com';
            
            // Simula connessione (in un'app reale useresti @solana/web3.js)
            console.log(\`Connesso a Solana \${currentNetwork.toUpperCase()}\`);
        }
        
        // Cambia network
        function switchNetwork() {
            const networkSelect = document.getElementById('network');
            currentNetwork = networkSelect.value;
            
            const airdropBtn = document.getElementById('airdropBtn');
            if (currentNetwork === 'mainnet') {
                airdropBtn.style.display = 'none';
            } else {
                airdropBtn.style.display = 'block';
            }
            
            initializeConnection();
            
            if (wallet) {
                refreshBalance();
            }
        }
        
        // Connetti wallet
        async function connectWallet() {
            try {
                const response = await window.solana.connect();
                wallet = response.publicKey.toString();
                
                document.getElementById('walletAddress').textContent = wallet;
                document.getElementById('walletInfo').classList.add('show');
                document.getElementById('connectBtn').textContent = '✅ Connesso';
                document.getElementById('connectBtn').className = 'btn connected';
                document.getElementById('connectBtn').disabled = true;
                
                const status = document.getElementById('status');
                status.className = 'status success';
                status.innerHTML = '🎉 Wallet connesso con successo!';
                
                await refreshBalance();
                
            } catch (error) {
                console.error('Errore connessione:', error);
                const status = document.getElementById('status');
                status.className = 'status error';
                status.innerHTML = '❌ Errore connessione: ' + error.message;
            }
        }
        
        // Aggiorna saldo
        async function refreshBalance() {
            if (!wallet) return;
            
            try {
                // In un'app reale, qui faresti una chiamata API al backend
                // che interroga la blockchain Solana
                const balanceElement = document.getElementById('walletBalance');
                balanceElement.textContent = '💰 Caricamento...';
                
                // Simula chiamata API
                setTimeout(() => {
                    const mockBalance = (Math.random() * 10).toFixed(4);
                    balanceElement.textContent = \`💰 \${mockBalance} SOL\`;
                }, 1000);
                
            } catch (error) {
                console.error('Errore aggiornamento saldo:', error);
                document.getElementById('walletBalance').textContent = '❌ Errore caricamento saldo';
            }
        }
        
        // Richiedi airdrop (solo devnet)
        async function requestAirdrop() {
            if (currentNetwork !== 'devnet') {
                alert('Airdrop disponibile solo su Devnet!');
                return;
            }
            
            try {
                const status = document.getElementById('status');
                status.className = 'status warning';
                status.innerHTML = '💧 Richiedendo airdrop...';
                
                // In un'app reale, qui faresti una chiamata al faucet
                setTimeout(() => {
                    status.className = 'status success';
                    status.innerHTML = '✅ Airdrop completato! Aggiorna il saldo.';
                    refreshBalance();
                }, 3000);
                
            } catch (error) {
                console.error('Errore airdrop:', error);
                const status = document.getElementById('status');
                status.className = 'status error';
                status.innerHTML = '❌ Errore airdrop: ' + error.message;
            }
        }
        
        // Salva configurazione
        function saveConfiguration() {
            if (!wallet) return;
            
            const config = {
                mode: 'phantom_integration',
                wallet: {
                    publicKey: wallet,
                    network: currentNetwork,
                    note: 'Configurazione Phantom - Solo indirizzo pubblico salvato'
                },
                createdAt: new Date().toISOString()
            };
            
            // In un'app reale, invieresti questa configurazione al backend
            console.log('Configurazione salvata:', config);
            
            const status = document.getElementById('status');
            status.className = 'status success';
            status.innerHTML = '💾 Configurazione salvata con successo!';
            
            // Simula salvataggio file
            const dataStr = JSON.stringify(config, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'phantom-wallet-config.json';
            link.click();
        }
        
        // Disconnetti wallet
        function disconnectWallet() {
            if (window.solana && window.solana.disconnect) {
                window.solana.disconnect();
            }
            
            wallet = null;
            document.getElementById('walletInfo').classList.remove('show');
            document.getElementById('connectBtn').textContent = '🔗 Connetti Phantom';
            document.getElementById('connectBtn').className = 'btn';
            document.getElementById('connectBtn').disabled = false;
            
            const status = document.getElementById('status');
            status.className = 'status warning';
            status.innerHTML = '🔌 Wallet disconnesso.';
        }
        
        // Gestisci eventi Phantom
        if (window.solana) {
            window.solana.on('connect', () => {
                console.log('Phantom connesso');
            });
            
            window.solana.on('disconnect', () => {
                console.log('Phantom disconnesso');
                disconnectWallet();
            });
            
            window.solana.on('accountChanged', (publicKey) => {
                if (publicKey) {
                    wallet = publicKey.toString();
                    document.getElementById('walletAddress').textContent = wallet;
                    refreshBalance();
                } else {
                    disconnectWallet();
                }
            });
        }
    </script>
</body>
</html>
        `;
    }

    // Genera il backend per l'integrazione
    generateBackendIntegration() {
        return `
// Backend Integration per Phantom Wallet
import express from 'express';
import cors from 'cors';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

class PhantomBackend {
    constructor() {
        this.connections = {
            devnet: new Connection('https://api.devnet.solana.com', 'confirmed'),
            mainnet: new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
        };
    }

    // Ottieni saldo wallet
    async getWalletBalance(publicKey, network = 'devnet') {
        try {
            const connection = this.connections[network];
            const pubKey = new PublicKey(publicKey);
            const balance = await connection.getBalance(pubKey);
            return {
                success: true,
                balance: balance / LAMPORTS_PER_SOL,
                network: network
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Richiedi airdrop (solo devnet)
    async requestAirdrop(publicKey) {
        try {
            const connection = this.connections.devnet;
            const pubKey = new PublicKey(publicKey);
            const signature = await connection.requestAirdrop(pubKey, LAMPORTS_PER_SOL);
            await connection.confirmTransaction(signature);
            
            return {
                success: true,
                signature: signature,
                amount: 1
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Salva configurazione wallet
    saveWalletConfig(config) {
        try {
            const configPath = './phantom-wallet-config.json';
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            return { success: true, path: configPath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

const phantomBackend = new PhantomBackend();

// Routes API
app.get('/api/balance/:publicKey/:network?', async (req, res) => {
    const { publicKey, network = 'devnet' } = req.params;
    const result = await phantomBackend.getWalletBalance(publicKey, network);
    res.json(result);
});

app.post('/api/airdrop', async (req, res) => {
    const { publicKey } = req.body;
    const result = await phantomBackend.requestAirdrop(publicKey);
    res.json(result);
});

app.post('/api/save-config', (req, res) => {
    const config = req.body;
    const result = phantomBackend.saveWalletConfig(config);
    res.json(result);
});

// Serve l'interfaccia HTML
app.get('/', (req, res) => {
    res.send(new PhantomIntegration().generatePhantomHTML());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\`🚀 Server Phantom Integration avviato su http://localhost:\${PORT}\`);
    console.log('🦄 Apri il browser per connettere Phantom Wallet');
});

export default PhantomBackend;
        `;
    }

    // Crea i file necessari per l'integrazione
    async createIntegrationFiles() {
        try {
            // Crea l'interfaccia HTML
            const htmlContent = this.generatePhantomHTML();
            fs.writeFileSync('./phantom-wallet-interface.html', htmlContent);
            
            // Crea il backend
            const backendContent = this.generateBackendIntegration();
            fs.writeFileSync('./phantom-backend-server.js', backendContent);
            
            // Crea script di avvio
            const startScript = `
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
    console.log('\n🛑 Chiusura server...');
    server.kill();
    process.exit();
});
            `;
            
            fs.writeFileSync('./start-phantom-integration.js', startScript);
            
            console.log('✅ File di integrazione Phantom creati:');
            console.log('  - phantom-wallet-interface.html');
            console.log('  - phantom-backend-server.js');
            console.log('  - start-phantom-integration.js');
            
            return true;
        } catch (error) {
            console.error('❌ Errore creazione file:', error);
            return false;
        }
    }
}

// Esegui se chiamato direttamente
const integration = new PhantomIntegration();
integration.createIntegrationFiles();

export default PhantomIntegration;