
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
        this.loadWalletConfig();
    }

    // Carica configurazione wallet salvata
    loadWalletConfig() {
        try {
            if (fs.existsSync('./phantom-wallet-config.json')) {
                const config = JSON.parse(fs.readFileSync('./phantom-wallet-config.json', 'utf8'));
                this.walletConfig = config;
                console.log('✅ Configurazione Phantom caricata:', config.wallet.publicKey);
            } else {
                console.log('⚠️ Nessuna configurazione Phantom trovata');
            }
        } catch (error) {
            console.error('❌ Errore caricamento configurazione:', error.message);
        }
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

// Ottieni configurazione wallet corrente
app.get('/api/wallet-config', (req, res) => {
    if (phantomBackend.walletConfig) {
        res.json({
            success: true,
            config: phantomBackend.walletConfig
        });
    } else {
        res.json({
            success: false,
            message: 'Nessuna configurazione wallet trovata'
        });
    }
});

// Ottieni saldo del wallet configurato
app.get('/api/my-balance', async (req, res) => {
    if (!phantomBackend.walletConfig) {
        return res.json({
            success: false,
            error: 'Nessun wallet configurato'
        });
    }
    
    const { publicKey, network } = phantomBackend.walletConfig.wallet;
    const result = await phantomBackend.getWalletBalance(publicKey, network);
    res.json(result);
});

// Serve l'interfaccia HTML
app.get('/', (req, res) => {
    try {
        const htmlContent = fs.readFileSync('phantom-wallet-interface.html', 'utf8');
        res.send(htmlContent);
    } catch (error) {
        res.status(500).send('Errore nel caricamento dell\'interfaccia Phantom');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server Phantom Integration avviato su http://localhost:${PORT}`);
    console.log('🦄 Apri il browser per connettere Phantom Wallet');
});

export default PhantomBackend;
        