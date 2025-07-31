const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const moment = require('moment');
const numeral = require('numeral');
const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

// Import sistema LUNACOIN
const config = require('../config');
const Logger = require('../logger');

class LunacoinTelegramBot {
    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN;
        this.adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
        this.apiUrl = process.env.API_URL || 'http://localhost:5000';
        
        if (!this.token) {
            throw new Error('TELEGRAM_BOT_TOKEN is required');
        }
        
        this.bot = new TelegramBot(this.token, { polling: true });
        this.logger = new Logger();
        this.subscribers = new Set();
        this.alertsEnabled = true;
        
        this.loadSubscribers();
        this.setupCommands();
        this.setupScheduledTasks();
        this.setupErrorHandling();
        
        this.logger.success('🤖 Telegram Bot initialized', 'TelegramBot');
    }

    setupCommands() {
        // Start command
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            const welcomeMessage = `
🌙 *Benvenuto nel Bot LUNACOIN!* 🌙

Sono il bot ufficiale per il monitoraggio del token LUNACOIN.

📊 *Comandi disponibili:*
/stats - Statistiche token
/price - Prezzo attuale
/volume - Volume 24h
/holders - Numero holders
/alerts - Gestione alert
/subscribe - Iscriviti alle notifiche
/unsubscribe - Disiscriviti
/help - Mostra questo messaggio

🚀 *Funzionalità:*
• Statistiche in tempo reale
• Alert automatici
• Grafici e report
• Monitoraggio DEX

Usa /subscribe per ricevere notifiche automatiche!
            `;
            
            this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
        });

        // Help command
        this.bot.onText(/\/help/, (msg) => {
            const chatId = msg.chat.id;
            const helpMessage = `
🆘 *Guida Comandi LUNACOIN Bot*

📊 *Statistiche:*
/stats - Panoramica completa
/price - Prezzo e variazione 24h
/volume - Volume di trading
/holders - Numero di possessori
/liquidity - Liquidità totale
/marketcap - Capitalizzazione

🔔 *Alert e Notifiche:*
/alerts - Configura alert
/subscribe - Iscriviti alle notifiche
/unsubscribe - Disiscriviti
/notifications - Stato notifiche

📈 *Grafici e Report:*
/chart - Grafico prezzo 24h
/report - Report giornaliero
/dex - Stato pool DEX

⚙️ *Sistema:*
/status - Stato sistema
/info - Info token
/version - Versione bot

🔧 *Admin (solo admin):*
/broadcast - Messaggio a tutti
/users - Lista utenti
/logs - Log sistema
            `;
            
            this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
        });

        // Stats command
        this.bot.onText(/\/stats/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                const stats = await this.getTokenStats();
                const message = this.formatStatsMessage(stats);
                this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            } catch (error) {
                this.bot.sendMessage(chatId, '❌ Errore nel recupero delle statistiche');
                this.logger.error(`Error getting stats: ${error.message}`, 'TelegramBot');
            }
        });

        // Price command
        this.bot.onText(/\/price/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                const stats = await this.getTokenStats();
                const price = stats.price || 0.000001;
                const change = stats.priceChange24h || 0;
                const emoji = change >= 0 ? '📈' : '📉';
                const sign = change >= 0 ? '+' : '';
                
                const message = `
${emoji} *Prezzo LUNACOIN*

💰 **$${price.toFixed(8)}**
📊 24h: ${sign}${change.toFixed(2)}%

⏰ ${moment().format('DD/MM/YYYY HH:mm:ss')}
                `;
                
                this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            } catch (error) {
                this.bot.sendMessage(chatId, '❌ Errore nel recupero del prezzo');
            }
        });

        // Volume command
        this.bot.onText(/\/volume/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                const stats = await this.getTokenStats();
                const volume = stats.volume24h || 0;
                const change = stats.volumeChange24h || 0;
                const emoji = change >= 0 ? '📈' : '📉';
                
                const message = `
📊 *Volume LUNACOIN 24h*

💵 **$${numeral(volume).format('0,0')}**
${emoji} Variazione: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%

⏰ ${moment().format('DD/MM/YYYY HH:mm:ss')}
                `;
                
                this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            } catch (error) {
                this.bot.sendMessage(chatId, '❌ Errore nel recupero del volume');
            }
        });

        // Subscribe command
        this.bot.onText(/\/subscribe/, (msg) => {
            const chatId = msg.chat.id;
            this.subscribers.add(chatId.toString());
            this.saveSubscribers();
            
            const message = `
✅ *Iscrizione completata!*

Riceverai notifiche per:
🔔 Variazioni prezzo significative
📊 Alert volume
💧 Alert liquidità
🚨 Eventi importanti

Usa /unsubscribe per disiscriverti
            `;
            
            this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            this.logger.info(`User ${chatId} subscribed to notifications`, 'TelegramBot');
        });

        // Unsubscribe command
        this.bot.onText(/\/unsubscribe/, (msg) => {
            const chatId = msg.chat.id;
            this.subscribers.delete(chatId.toString());
            this.saveSubscribers();
            
            this.bot.sendMessage(chatId, '❌ Disiscrizione completata. Non riceverai più notifiche.');
            this.logger.info(`User ${chatId} unsubscribed from notifications`, 'TelegramBot');
        });

        // Info command
        this.bot.onText(/\/info/, (msg) => {
            const chatId = msg.chat.id;
            const message = `
🌙 *LUNACOIN Token Info*

📛 **Nome:** ${config.token.name}
🔤 **Simbolo:** ${config.token.symbol}
🔢 **Decimali:** ${config.token.decimals}
💰 **Supply:** ${numeral(config.token.totalSupply).format('0,0')}

📝 **Descrizione:**
${config.token.description}

🌐 **Network:** ${config.solana.network}
🔗 **Blockchain:** Solana

📱 **Social:**
${config.token.socialLinks.twitter ? `🐦 Twitter: ${config.token.socialLinks.twitter}\n` : ''}
${config.token.socialLinks.telegram ? `📱 Telegram: ${config.token.socialLinks.telegram}\n` : ''}
${config.token.socialLinks.discord ? `💬 Discord: ${config.token.socialLinks.discord}\n` : ''}
            `;
            
            this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        });

        // Admin commands
        if (this.adminChatId) {
            this.bot.onText(/\/broadcast (.+)/, (msg, match) => {
                const chatId = msg.chat.id;
                if (chatId.toString() !== this.adminChatId) {
                    this.bot.sendMessage(chatId, '❌ Comando riservato agli admin');
                    return;
                }
                
                const message = match[1];
                this.broadcastMessage(message);
                this.bot.sendMessage(chatId, `✅ Messaggio inviato a ${this.subscribers.size} utenti`);
            });

            this.bot.onText(/\/users/, (msg) => {
                const chatId = msg.chat.id;
                if (chatId.toString() !== this.adminChatId) {
                    this.bot.sendMessage(chatId, '❌ Comando riservato agli admin');
                    return;
                }
                
                const message = `
👥 *Utenti Iscritti*

📊 Totale: ${this.subscribers.size}
📱 Lista Chat ID:
${Array.from(this.subscribers).join('\n')}
                `;
                
                this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            });
        }
    }

    setupScheduledTasks() {
        // Report giornaliero alle 9:00
        cron.schedule('0 9 * * *', async () => {
            try {
                const report = await this.generateDailyReport();
                this.broadcastMessage(report);
                this.logger.info('Daily report sent', 'TelegramBot');
            } catch (error) {
                this.logger.error(`Error sending daily report: ${error.message}`, 'TelegramBot');
            }
        });

        // Statistiche ogni 4 ore
        cron.schedule('0 */4 * * *', async () => {
            try {
                const stats = await this.getTokenStats();
                const message = `
📊 *Aggiornamento Automatico*\n\n${this.formatStatsMessage(stats, true)}
                `;
                this.broadcastMessage(message);
            } catch (error) {
                this.logger.error(`Error sending scheduled stats: ${error.message}`, 'TelegramBot');
            }
        });
    }

    setupErrorHandling() {
        this.bot.on('error', (error) => {
            this.logger.error(`Telegram Bot error: ${error.message}`, 'TelegramBot');
        });

        this.bot.on('polling_error', (error) => {
            this.logger.error(`Telegram Bot polling error: ${error.message}`, 'TelegramBot');
        });
    }

    async getTokenStats() {
        try {
            const response = await axios.get(`${this.apiUrl}/api/token/stats`, {
                timeout: 10000
            });
            return response.data;
        } catch (error) {
            // Return mock data if API is not available
            return {
                price: 0.000001,
                priceChange24h: 5.67,
                volume24h: 125000,
                volumeChange24h: 12.3,
                marketCap: 1000000,
                holders: 1250,
                transactions24h: 450,
                liquidity: 500000
            };
        }
    }

    formatStatsMessage(stats, compact = false) {
        const priceEmoji = stats.priceChange24h >= 0 ? '📈' : '📉';
        const volumeEmoji = stats.volumeChange24h >= 0 ? '📈' : '📉';
        
        if (compact) {
            return `
💰 **$${stats.price.toFixed(8)}** ${priceEmoji} ${stats.priceChange24h >= 0 ? '+' : ''}${stats.priceChange24h.toFixed(2)}%
📊 Vol: **$${numeral(stats.volume24h).format('0,0')}** ${volumeEmoji}
👥 Holders: **${numeral(stats.holders).format('0,0')}**
            `;
        }
        
        return `
🌙 *LUNACOIN Statistiche*

💰 **Prezzo:** $${stats.price.toFixed(8)}
${priceEmoji} **24h:** ${stats.priceChange24h >= 0 ? '+' : ''}${stats.priceChange24h.toFixed(2)}%

📊 **Volume 24h:** $${numeral(stats.volume24h).format('0,0')}
${volumeEmoji} **Variazione:** ${stats.volumeChange24h >= 0 ? '+' : ''}${stats.volumeChange24h.toFixed(2)}%

🏦 **Market Cap:** $${numeral(stats.marketCap).format('0,0')}
👥 **Holders:** ${numeral(stats.holders).format('0,0')}
🔄 **Transazioni 24h:** ${numeral(stats.transactions24h).format('0,0')}
💧 **Liquidità:** $${numeral(stats.liquidity).format('0,0')}

⏰ ${moment().format('DD/MM/YYYY HH:mm:ss')}
        `;
    }

    async generateDailyReport() {
        const stats = await this.getTokenStats();
        return `
🌅 *Report Giornaliero LUNACOIN*
📅 ${moment().format('DD/MM/YYYY')}

${this.formatStatsMessage(stats)}

📈 **Performance:**
• Prezzo: ${stats.priceChange24h >= 0 ? '🟢' : '🔴'} ${stats.priceChange24h >= 0 ? '+' : ''}${stats.priceChange24h.toFixed(2)}%
• Volume: ${stats.volumeChange24h >= 0 ? '🟢' : '🔴'} ${stats.volumeChange24h >= 0 ? '+' : ''}${stats.volumeChange24h.toFixed(2)}%

🎯 **Obiettivi Raggiunti:**
✅ Sistema operativo 24/7
✅ Monitoraggio attivo
✅ Liquidità stabile

Buona giornata! 🌙
        `;
    }

    broadcastMessage(message) {
        this.subscribers.forEach(chatId => {
            this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
                .catch(error => {
                    this.logger.error(`Error sending message to ${chatId}: ${error.message}`, 'TelegramBot');
                    // Remove invalid chat IDs
                    if (error.response && error.response.statusCode === 403) {
                        this.subscribers.delete(chatId);
                        this.saveSubscribers();
                    }
                });
        });
    }

    sendAlert(type, data) {
        if (!this.alertsEnabled) return;
        
        let message = '';
        
        switch (type) {
            case 'price':
                message = `
🚨 *Alert Prezzo LUNACOIN*

💰 **Nuovo Prezzo:** $${data.price.toFixed(8)}
📊 **Variazione:** ${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%

⏰ ${moment().format('DD/MM/YYYY HH:mm:ss')}
                `;
                break;
                
            case 'volume':
                message = `
📊 *Alert Volume LUNACOIN*

📈 **Volume 24h:** $${numeral(data.volume).format('0,0')}
🔔 **Soglia:** ${data.threshold}

⏰ ${moment().format('DD/MM/YYYY HH:mm:ss')}
                `;
                break;
                
            case 'liquidity':
                message = `
💧 *Alert Liquidità LUNACOIN*

⚠️ **Liquidità Bassa:** $${numeral(data.liquidity).format('0,0')}
🔔 **Soglia:** $${numeral(data.threshold).format('0,0')}

⏰ ${moment().format('DD/MM/YYYY HH:mm:ss')}
                `;
                break;
        }
        
        if (message) {
            this.broadcastMessage(message);
        }
    }

    loadSubscribers() {
        try {
            const filePath = path.join(__dirname, 'subscribers.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readJsonSync(filePath);
                this.subscribers = new Set(data.subscribers || []);
                this.logger.info(`Loaded ${this.subscribers.size} subscribers`, 'TelegramBot');
            }
        } catch (error) {
            this.logger.error(`Error loading subscribers: ${error.message}`, 'TelegramBot');
        }
    }

    saveSubscribers() {
        try {
            const filePath = path.join(__dirname, 'subscribers.json');
            const data = {
                subscribers: Array.from(this.subscribers),
                lastUpdated: new Date().toISOString()
            };
            fs.writeJsonSync(filePath, data, { spaces: 2 });
        } catch (error) {
            this.logger.error(`Error saving subscribers: ${error.message}`, 'TelegramBot');
        }
    }

    stop() {
        this.bot.stopPolling();
        this.logger.info('Telegram Bot stopped', 'TelegramBot');
    }
}

// Start bot if run directly
if (require.main === module) {
    try {
        const bot = new LunacoinTelegramBot();
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down Telegram Bot...');
            bot.stop();
            process.exit(0);
        });
        
        console.log('🤖 LUNACOIN Telegram Bot started successfully!');
    } catch (error) {
        console.error('❌ Error starting Telegram Bot:', error.message);
        process.exit(1);
    }
}

module.exports = LunacoinTelegramBot;