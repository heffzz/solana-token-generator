const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import sistema LUNACOIN
const config = require('../config');
const Logger = require('../logger');
const Monitor = require('../monitor');

class DashboardServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        this.port = process.env.PORT || 5000;
        this.logger = new Logger();
        this.monitor = null;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.initializeMonitor();
    }

    setupMiddleware() {
        // Security
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Static files
        this.app.use(express.static(path.join(__dirname, 'client/build')));
        
        // Logging
        this.app.use((req, res, next) => {
            this.logger.info(`${req.method} ${req.path}`, 'API');
            next();
        });
    }

    setupRoutes() {
        // API Routes
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'OK', timestamp: new Date().toISOString() });
        });

        // Token Info
        this.app.get('/api/token/info', async (req, res) => {
            try {
                const tokenInfo = {
                    name: config.token.name,
                    symbol: config.token.symbol,
                    decimals: config.token.decimals,
                    totalSupply: config.token.totalSupply,
                    description: config.token.description,
                    image: config.token.image,
                    socialLinks: config.token.socialLinks
                };
                res.json(tokenInfo);
            } catch (error) {
                this.logger.error(`Error getting token info: ${error.message}`, 'API');
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Token Stats
        this.app.get('/api/token/stats', async (req, res) => {
            try {
                if (!this.monitor) {
                    return res.status(503).json({ error: 'Monitor not initialized' });
                }
                
                const stats = await this.monitor.getStatus();
                res.json(stats);
            } catch (error) {
                this.logger.error(`Error getting token stats: ${error.message}`, 'API');
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Historical Data
        this.app.get('/api/token/history', async (req, res) => {
            try {
                const { period = '24h' } = req.query;
                const historyFile = path.join(__dirname, '../data/metrics-history.json');
                
                if (!fs.existsSync(historyFile)) {
                    return res.json([]);
                }
                
                const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
                const now = Date.now();
                let timeFilter;
                
                switch (period) {
                    case '1h':
                        timeFilter = now - (60 * 60 * 1000);
                        break;
                    case '24h':
                        timeFilter = now - (24 * 60 * 60 * 1000);
                        break;
                    case '7d':
                        timeFilter = now - (7 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        timeFilter = now - (24 * 60 * 60 * 1000);
                }
                
                const filteredHistory = history.filter(item => 
                    new Date(item.timestamp).getTime() > timeFilter
                );
                
                res.json(filteredHistory);
            } catch (error) {
                this.logger.error(`Error getting history: ${error.message}`, 'API');
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // DEX Pools
        this.app.get('/api/dex/pools', async (req, res) => {
            try {
                const pools = {
                    raydium: { status: 'active', liquidity: 0, volume24h: 0 },
                    orca: { status: 'active', liquidity: 0, volume24h: 0 },
                    jupiter: { status: 'active', liquidity: 0, volume24h: 0 }
                };
                res.json(pools);
            } catch (error) {
                this.logger.error(`Error getting DEX pools: ${error.message}`, 'API');
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Alerts Configuration
        this.app.get('/api/alerts', (req, res) => {
            try {
                const alertsFile = path.join(__dirname, '../data/alerts-config.json');
                if (fs.existsSync(alertsFile)) {
                    const alerts = JSON.parse(fs.readFileSync(alertsFile, 'utf8'));
                    res.json(alerts);
                } else {
                    res.json({ priceChange: 10, volumeThreshold: 1000, liquidityThreshold: 5000 });
                }
            } catch (error) {
                this.logger.error(`Error getting alerts: ${error.message}`, 'API');
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        this.app.post('/api/alerts', (req, res) => {
            try {
                const alertsFile = path.join(__dirname, '../data/alerts-config.json');
                fs.writeFileSync(alertsFile, JSON.stringify(req.body, null, 2));
                res.json({ success: true });
                this.logger.info('Alerts configuration updated', 'API');
            } catch (error) {
                this.logger.error(`Error updating alerts: ${error.message}`, 'API');
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Reports
        this.app.get('/api/reports', (req, res) => {
            try {
                const reportsDir = path.join(__dirname, '../reports');
                if (!fs.existsSync(reportsDir)) {
                    return res.json([]);
                }
                
                const reports = fs.readdirSync(reportsDir)
                    .filter(file => file.endsWith('.json'))
                    .map(file => {
                        const filePath = path.join(reportsDir, file);
                        const stats = fs.statSync(filePath);
                        return {
                            name: file,
                            size: stats.size,
                            created: stats.birthtime,
                            modified: stats.mtime
                        };
                    })
                    .sort((a, b) => b.modified - a.modified);
                
                res.json(reports);
            } catch (error) {
                this.logger.error(`Error getting reports: ${error.message}`, 'API');
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        this.app.get('/api/reports/:filename', (req, res) => {
            try {
                const filename = req.params.filename;
                const filePath = path.join(__dirname, '../reports', filename);
                
                if (!fs.existsSync(filePath)) {
                    return res.status(404).json({ error: 'Report not found' });
                }
                
                const report = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                res.json(report);
            } catch (error) {
                this.logger.error(`Error getting report: ${error.message}`, 'API');
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Serve React app
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'client/build/index.html'));
        });
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            this.logger.info(`Client connected: ${socket.id}`, 'WebSocket');
            
            socket.on('subscribe', (data) => {
                socket.join(data.channel);
                this.logger.info(`Client ${socket.id} subscribed to ${data.channel}`, 'WebSocket');
            });
            
            socket.on('unsubscribe', (data) => {
                socket.leave(data.channel);
                this.logger.info(`Client ${socket.id} unsubscribed from ${data.channel}`, 'WebSocket');
            });
            
            socket.on('disconnect', () => {
                this.logger.info(`Client disconnected: ${socket.id}`, 'WebSocket');
            });
        });
    }

    async initializeMonitor() {
        try {
            this.monitor = new Monitor();
            
            // Broadcast updates every 30 seconds
            setInterval(async () => {
                try {
                    const stats = await this.monitor.getStatus();
                    this.io.to('token-stats').emit('stats-update', stats);
                } catch (error) {
                    this.logger.error(`Error broadcasting stats: ${error.message}`, 'WebSocket');
                }
            }, 30000);
            
            this.logger.info('Monitor initialized for dashboard', 'Dashboard');
        } catch (error) {
            this.logger.error(`Error initializing monitor: ${error.message}`, 'Dashboard');
        }
    }

    start() {
        this.server.listen(this.port, () => {
            this.logger.success(`🌐 Dashboard server running on port ${this.port}`, 'Dashboard');
            this.logger.info(`📊 Dashboard URL: http://localhost:${this.port}`, 'Dashboard');
        });
    }

    stop() {
        this.server.close(() => {
            this.logger.info('Dashboard server stopped', 'Dashboard');
        });
    }
}

// Start server if run directly
if (require.main === module) {
    const dashboard = new DashboardServer();
    dashboard.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down dashboard server...');
        dashboard.stop();
        process.exit(0);
    });
}

module.exports = DashboardServer;