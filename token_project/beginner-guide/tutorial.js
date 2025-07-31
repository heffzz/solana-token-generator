const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const http = require('http');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
require('dotenv').config();

// Import sistema LUNACOIN
const config = require('../config');
const Logger = require('../logger');

class BeginnerTutorialSystem {
    constructor() {
        this.logger = new Logger();
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        // Tutorial Configuration
        this.tutorialConfig = {
            name: 'LUNACOIN Beginner Guide',
            version: '1.0.0',
            supportedLanguages: ['it', 'en', 'es', 'fr'],
            defaultLanguage: 'it',
            maxSessionTime: 2 * 60 * 60 * 1000, // 2 ore
            saveProgress: true,
            gamification: true
        };
        
        // Tutorial Steps
        this.tutorialSteps = this.initializeTutorialSteps();
        
        // User Progress
        this.userProgress = new Map();
        this.userSessions = new Map();
        this.achievements = new Map();
        
        // Statistics
        this.stats = {
            totalUsers: 0,
            completedTutorials: 0,
            averageCompletionTime: 0,
            mostPopularStep: '',
            dropoffPoints: {},
            userFeedback: []
        };
        
        this.initializeTutorialSystem();
    }

    async initializeTutorialSystem() {
        try {
            this.setupMiddleware();
            this.setupRoutes();
            this.setupWebSocket();
            
            await this.loadUserProgress();
            
            const port = process.env.TUTORIAL_PORT || 7000;
            this.server.listen(port, () => {
                this.logger.success(`📚 LUNACOIN Tutorial System running on port ${port}`, 'Tutorial');
            });
            
        } catch (error) {
            this.logger.error(`Error initializing Tutorial System: ${error.message}`, 'Tutorial');
            throw error;
        }
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    setupRoutes() {
        // Tutorial Home
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        // Get Tutorial Steps
        this.app.get('/api/tutorial/steps', (req, res) => {
            const { language = 'it' } = req.query;
            const steps = this.getTutorialSteps(language);
            res.json({ success: true, data: steps });
        });

        // Start Tutorial Session
        this.app.post('/api/tutorial/start', (req, res) => {
            try {
                const session = this.startTutorialSession(req.body);
                res.json({ success: true, data: session });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Update Progress
        this.app.post('/api/tutorial/progress', (req, res) => {
            try {
                const progress = this.updateProgress(req.body);
                res.json({ success: true, data: progress });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Get User Progress
        this.app.get('/api/tutorial/progress/:userId', (req, res) => {
            const progress = this.getUserProgress(req.params.userId);
            res.json({ success: true, data: progress });
        });

        // Complete Tutorial
        this.app.post('/api/tutorial/complete', (req, res) => {
            try {
                const completion = this.completeTutorial(req.body);
                res.json({ success: true, data: completion });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Submit Feedback
        this.app.post('/api/tutorial/feedback', (req, res) => {
            try {
                const feedback = this.submitFeedback(req.body);
                res.json({ success: true, data: feedback });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Get Achievements
        this.app.get('/api/tutorial/achievements/:userId', (req, res) => {
            const achievements = this.getUserAchievements(req.params.userId);
            res.json({ success: true, data: achievements });
        });

        // Tutorial Analytics
        this.app.get('/api/tutorial/analytics', (req, res) => {
            const analytics = this.generateAnalytics();
            res.json({ success: true, data: analytics });
        });

        // Interactive Demo
        this.app.get('/api/tutorial/demo/:type', (req, res) => {
            try {
                const demo = this.getInteractiveDemo(req.params.type);
                res.json({ success: true, data: demo });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            this.logger.info(`Tutorial client connected: ${socket.id}`, 'Tutorial');

            socket.on('join-tutorial', (data) => {
                const { userId, sessionId } = data;
                socket.join(`tutorial-${sessionId}`);
                socket.userId = userId;
                socket.sessionId = sessionId;
            });

            socket.on('step-completed', (data) => {
                this.handleStepCompletion(socket, data);
            });

            socket.on('request-help', (data) => {
                this.handleHelpRequest(socket, data);
            });

            socket.on('disconnect', () => {
                this.logger.info(`Tutorial client disconnected: ${socket.id}`, 'Tutorial');
            });
        });
    }

    initializeTutorialSteps() {
        return {
            it: [
                {
                    id: 'welcome',
                    title: '🌙 Benvenuto in LUNACOIN!',
                    description: 'Scopri il mondo delle criptovalute con LUNACOIN',
                    content: {
                        text: 'Benvenuto nel tutorial interattivo di LUNACOIN! Imparerai tutto quello che serve per iniziare nel mondo DeFi.',
                        video: '/videos/welcome.mp4',
                        duration: 5,
                        interactive: false
                    },
                    objectives: [
                        'Comprendere cos\'è LUNACOIN',
                        'Conoscere i benefici del DeFi',
                        'Preparare il tuo wallet'
                    ]
                },
                {
                    id: 'wallet-setup',
                    title: '👛 Configurazione Wallet',
                    description: 'Impara a configurare il tuo wallet Solana',
                    content: {
                        text: 'Un wallet è il tuo portafoglio digitale. Ti mostreremo come configurarlo in sicurezza.',
                        steps: [
                            'Scarica Phantom Wallet',
                            'Crea un nuovo wallet',
                            'Salva la frase di recupero',
                            'Aggiungi fondi di test'
                        ],
                        interactive: true,
                        demo: 'wallet-setup'
                    },
                    objectives: [
                        'Installare Phantom Wallet',
                        'Creare un wallet sicuro',
                        'Comprendere le chiavi private'
                    ]
                },
                {
                    id: 'token-basics',
                    title: '🪙 Basi dei Token',
                    description: 'Cosa sono i token e come funzionano',
                    content: {
                        text: 'I token sono asset digitali sulla blockchain. LUNACOIN è un token SPL su Solana.',
                        infographic: '/images/token-basics.svg',
                        quiz: [
                            {
                                question: 'Cos\'è un token SPL?',
                                options: [
                                    'Un token su Solana',
                                    'Un token su Ethereum',
                                    'Una criptovaluta fisica'
                                ],
                                correct: 0
                            }
                        ],
                        interactive: true
                    },
                    objectives: [
                        'Capire cosa sono i token',
                        'Conoscere la blockchain Solana',
                        'Distinguere i tipi di token'
                    ]
                },
                {
                    id: 'first-transaction',
                    title: '💸 Prima Transazione',
                    description: 'Esegui la tua prima transazione LUNACOIN',
                    content: {
                        text: 'Ora farai la tua prima transazione! Ti guideremo passo dopo passo.',
                        simulator: true,
                        practice: {
                            type: 'send-tokens',
                            amount: 10,
                            recipient: 'tutorial-address',
                            testnet: true
                        },
                        interactive: true
                    },
                    objectives: [
                        'Inviare token LUNACOIN',
                        'Verificare la transazione',
                        'Comprendere le commissioni'
                    ]
                },
                {
                    id: 'defi-intro',
                    title: '🏦 Introduzione al DeFi',
                    description: 'Scopri la finanza decentralizzata',
                    content: {
                        text: 'DeFi significa finanza decentralizzata. Niente banche, solo smart contracts!',
                        concepts: [
                            'Liquidity Pools',
                            'Yield Farming',
                            'Staking',
                            'DEX Trading'
                        ],
                        interactive: true,
                        demo: 'defi-concepts'
                    },
                    objectives: [
                        'Comprendere il DeFi',
                        'Conoscere i protocolli principali',
                        'Identificare le opportunità'
                    ]
                },
                {
                    id: 'dex-trading',
                    title: '📈 Trading su DEX',
                    description: 'Impara a fare trading sui DEX',
                    content: {
                        text: 'I DEX sono exchange decentralizzati. Imparerai a fare swap di token.',
                        simulator: true,
                        practice: {
                            type: 'token-swap',
                            from: 'SOL',
                            to: 'LUNACOIN',
                            amount: 0.1,
                            dex: 'Raydium'
                        },
                        interactive: true
                    },
                    objectives: [
                        'Fare uno swap su Raydium',
                        'Comprendere lo slippage',
                        'Calcolare i costi'
                    ]
                },
                {
                    id: 'liquidity-providing',
                    title: '💧 Fornire Liquidità',
                    description: 'Guadagna fornendo liquidità',
                    content: {
                        text: 'Fornendo liquidità guadagni commissioni dalle transazioni.',
                        calculator: true,
                        risks: [
                            'Impermanent Loss',
                            'Smart Contract Risk',
                            'Market Volatility'
                        ],
                        interactive: true,
                        demo: 'liquidity-pool'
                    },
                    objectives: [
                        'Aggiungere liquidità a un pool',
                        'Calcolare i rendimenti',
                        'Comprendere i rischi'
                    ]
                },
                {
                    id: 'security-best-practices',
                    title: '🔒 Sicurezza e Best Practices',
                    description: 'Proteggi i tuoi asset',
                    content: {
                        text: 'La sicurezza è fondamentale nel DeFi. Impara a proteggerti.',
                        checklist: [
                            'Non condividere mai le chiavi private',
                            'Verifica sempre gli indirizzi',
                            'Usa hardware wallet per grandi somme',
                            'Fai sempre DYOR (Do Your Own Research)'
                        ],
                        interactive: true,
                        quiz: true
                    },
                    objectives: [
                        'Identificare le truffe comuni',
                        'Proteggere il wallet',
                        'Verificare i contratti'
                    ]
                },
                {
                    id: 'advanced-features',
                    title: '🚀 Funzionalità Avanzate',
                    description: 'Esplora le funzionalità avanzate',
                    content: {
                        text: 'Ora che conosci le basi, esploriamo funzionalità più avanzate.',
                        features: [
                            'Cross-chain Bridge',
                            'DAO Governance',
                            'Yield Farming',
                            'NFT Integration'
                        ],
                        interactive: true,
                        preview: true
                    },
                    objectives: [
                        'Esplorare il bridge cross-chain',
                        'Partecipare alla governance',
                        'Scoprire nuove opportunità'
                    ]
                },
                {
                    id: 'graduation',
                    title: '🎓 Congratulazioni!',
                    description: 'Hai completato il tutorial!',
                    content: {
                        text: 'Complimenti! Ora sei pronto per esplorare il mondo DeFi con LUNACOIN.',
                        certificate: true,
                        nextSteps: [
                            'Unisciti alla community',
                            'Partecipa alla governance',
                            'Esplora nuovi protocolli',
                            'Condividi la tua esperienza'
                        ],
                        rewards: {
                            badge: 'LUNACOIN Graduate',
                            tokens: 100,
                            nft: 'Tutorial Completion NFT'
                        }
                    },
                    objectives: [
                        'Ricevere il certificato',
                        'Ottenere i reward',
                        'Pianificare i prossimi passi'
                    ]
                }
            ]
        };
    }

    startTutorialSession(data) {
        const { userId, language = 'it', level = 'beginner' } = data;
        
        if (!userId) {
            throw new Error('User ID required');
        }
        
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            userId,
            language,
            level,
            startTime: Date.now(),
            currentStep: 0,
            completedSteps: [],
            progress: 0,
            achievements: [],
            timeSpent: 0,
            active: true
        };
        
        this.userSessions.set(sessionId, session);
        
        // Initialize user progress if not exists
        if (!this.userProgress.has(userId)) {
            this.userProgress.set(userId, {
                userId,
                totalSessions: 0,
                completedTutorials: 0,
                totalTimeSpent: 0,
                achievements: [],
                level: 'beginner',
                createdAt: new Date().toISOString()
            });
            this.stats.totalUsers++;
        }
        
        const userProgress = this.userProgress.get(userId);
        userProgress.totalSessions++;
        
        this.logger.success(`Tutorial session started: ${sessionId} for user ${userId}`, 'Tutorial');
        
        return session;
    }

    updateProgress(data) {
        const { sessionId, stepId, completed, timeSpent, answers } = data;
        
        const session = this.userSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (completed && !session.completedSteps.includes(stepId)) {
            session.completedSteps.push(stepId);
            session.currentStep++;
            
            // Check for achievements
            this.checkAchievements(session.userId, stepId);
        }
        
        session.timeSpent += timeSpent || 0;
        session.progress = (session.completedSteps.length / this.tutorialSteps[session.language].length) * 100;
        session.updatedAt = new Date().toISOString();
        
        // Save answers if provided
        if (answers) {
            if (!session.answers) session.answers = {};
            session.answers[stepId] = answers;
        }
        
        // Update user progress
        const userProgress = this.userProgress.get(session.userId);
        userProgress.totalTimeSpent += timeSpent || 0;
        
        // Broadcast progress update
        this.io.to(`tutorial-${sessionId}`).emit('progress-updated', {
            sessionId,
            progress: session.progress,
            currentStep: session.currentStep,
            achievements: session.achievements
        });
        
        this.saveUserProgress();
        
        return session;
    }

    completeTutorial(data) {
        const { sessionId, feedback, rating } = data;
        
        const session = this.userSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        session.completed = true;
        session.completedAt = new Date().toISOString();
        session.rating = rating;
        session.active = false;
        
        // Update user progress
        const userProgress = this.userProgress.get(session.userId);
        userProgress.completedTutorials++;
        
        // Award completion achievements
        this.awardCompletionRewards(session.userId);
        
        // Update statistics
        this.stats.completedTutorials++;
        this.updateAverageCompletionTime(session.timeSpent);
        
        if (feedback) {
            this.stats.userFeedback.push({
                userId: session.userId,
                feedback,
                rating,
                timestamp: new Date().toISOString()
            });
        }
        
        this.logger.success(`Tutorial completed: ${sessionId} by user ${session.userId}`, 'Tutorial');
        
        return {
            sessionId,
            completed: true,
            achievements: session.achievements,
            certificate: this.generateCertificate(session.userId),
            rewards: this.getCompletionRewards(session.userId)
        };
    }

    checkAchievements(userId, stepId) {
        const achievements = [];
        
        // Step-specific achievements
        const stepAchievements = {
            'wallet-setup': { id: 'wallet-master', name: 'Wallet Master', description: 'Configured your first wallet' },
            'first-transaction': { id: 'first-tx', name: 'First Transaction', description: 'Sent your first transaction' },
            'dex-trading': { id: 'trader', name: 'DEX Trader', description: 'Completed your first swap' },
            'liquidity-providing': { id: 'liquidity-provider', name: 'Liquidity Provider', description: 'Provided liquidity to a pool' }
        };
        
        if (stepAchievements[stepId]) {
            achievements.push(stepAchievements[stepId]);
        }
        
        // Store achievements
        if (!this.achievements.has(userId)) {
            this.achievements.set(userId, []);
        }
        
        const userAchievements = this.achievements.get(userId);
        achievements.forEach(achievement => {
            if (!userAchievements.find(a => a.id === achievement.id)) {
                userAchievements.push({
                    ...achievement,
                    earnedAt: new Date().toISOString()
                });
            }
        });
        
        return achievements;
    }

    awardCompletionRewards(userId) {
        const rewards = {
            badge: 'LUNACOIN Graduate',
            tokens: 100,
            nft: 'Tutorial Completion NFT',
            level: 'intermediate'
        };
        
        // Update user level
        const userProgress = this.userProgress.get(userId);
        userProgress.level = 'intermediate';
        
        // Add completion achievement
        this.checkAchievements(userId, 'graduation');
        
        return rewards;
    }

    generateCertificate(userId) {
        return {
            id: `cert_${userId}_${Date.now()}`,
            userId,
            title: 'LUNACOIN DeFi Mastery Certificate',
            description: 'This certifies that the holder has successfully completed the LUNACOIN beginner tutorial',
            issuedAt: new Date().toISOString(),
            issuer: 'LUNACOIN Academy',
            verificationUrl: `https://lunacoin.academy/verify/${userId}`
        };
    }

    getInteractiveDemo(type) {
        const demos = {
            'wallet-setup': {
                type: 'interactive',
                title: 'Wallet Setup Demo',
                steps: [
                    { action: 'click', target: '#install-phantom', description: 'Click to install Phantom' },
                    { action: 'input', target: '#password', description: 'Enter a strong password' },
                    { action: 'click', target: '#create-wallet', description: 'Create your wallet' }
                ],
                simulator: true
            },
            'defi-concepts': {
                type: 'visualization',
                title: 'DeFi Concepts Visualization',
                concepts: [
                    { name: 'Liquidity Pool', visual: '/animations/liquidity-pool.json' },
                    { name: 'Yield Farming', visual: '/animations/yield-farming.json' },
                    { name: 'DEX Trading', visual: '/animations/dex-trading.json' }
                ]
            },
            'liquidity-pool': {
                type: 'calculator',
                title: 'Liquidity Pool Calculator',
                inputs: ['token1Amount', 'token2Amount', 'poolShare'],
                outputs: ['dailyRewards', 'apy', 'impermanentLoss']
            }
        };
        
        return demos[type] || null;
    }

    getTutorialSteps(language) {
        return this.tutorialSteps[language] || this.tutorialSteps['it'];
    }

    getUserProgress(userId) {
        return this.userProgress.get(userId) || null;
    }

    getUserAchievements(userId) {
        return this.achievements.get(userId) || [];
    }

    submitFeedback(data) {
        const { userId, sessionId, feedback, rating, suggestions } = data;
        
        const feedbackEntry = {
            id: this.generateFeedbackId(),
            userId,
            sessionId,
            feedback,
            rating,
            suggestions,
            timestamp: new Date().toISOString()
        };
        
        this.stats.userFeedback.push(feedbackEntry);
        
        this.logger.info(`Feedback received from user ${userId}`, 'Tutorial');
        
        return feedbackEntry;
    }

    generateAnalytics() {
        return {
            overview: this.stats,
            userEngagement: this.calculateUserEngagement(),
            stepAnalytics: this.calculateStepAnalytics(),
            completionRates: this.calculateCompletionRates(),
            feedbackSummary: this.summarizeFeedback()
        };
    }

    calculateUserEngagement() {
        const sessions = Array.from(this.userSessions.values());
        const totalTime = sessions.reduce((sum, s) => sum + s.timeSpent, 0);
        const avgSessionTime = sessions.length > 0 ? totalTime / sessions.length : 0;
        
        return {
            totalSessions: sessions.length,
            averageSessionTime: avgSessionTime,
            activeUsers: sessions.filter(s => s.active).length,
            returnUsers: this.calculateReturnUsers()
        };
    }

    calculateStepAnalytics() {
        const stepStats = {};
        const sessions = Array.from(this.userSessions.values());
        
        sessions.forEach(session => {
            session.completedSteps.forEach(stepId => {
                if (!stepStats[stepId]) {
                    stepStats[stepId] = { completed: 0, dropoffs: 0 };
                }
                stepStats[stepId].completed++;
            });
        });
        
        return stepStats;
    }

    calculateCompletionRates() {
        const total = this.stats.totalUsers;
        const completed = this.stats.completedTutorials;
        
        return {
            overall: total > 0 ? (completed / total) * 100 : 0,
            byStep: this.calculateStepCompletionRates()
        };
    }

    handleStepCompletion(socket, data) {
        const { stepId, timeSpent, answers } = data;
        
        try {
            const progress = this.updateProgress({
                sessionId: socket.sessionId,
                stepId,
                completed: true,
                timeSpent,
                answers
            });
            
            socket.emit('step-completed', {
                stepId,
                progress: progress.progress,
                achievements: progress.achievements
            });
            
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    handleHelpRequest(socket, data) {
        const { stepId, question, context } = data;
        
        // Generate contextual help
        const help = this.generateContextualHelp(stepId, question, context);
        
        socket.emit('help-response', {
            stepId,
            help,
            timestamp: new Date().toISOString()
        });
    }

    generateContextualHelp(stepId, question, context) {
        const helpDatabase = {
            'wallet-setup': {
                'password': 'Usa una password forte con almeno 12 caratteri, numeri e simboli.',
                'seed-phrase': 'La frase di recupero è composta da 12-24 parole. Scrivila su carta e conservala al sicuro.',
                'backup': 'Fai sempre un backup della tua frase di recupero prima di procedere.'
            },
            'first-transaction': {
                'fees': 'Le commissioni su Solana sono molto basse, circa 0.00025 SOL per transazione.',
                'confirmation': 'Le transazioni su Solana si confermano in 1-2 secondi.',
                'address': 'Controlla sempre due volte l\'indirizzo del destinatario prima di inviare.'
            }
        };
        
        return helpDatabase[stepId] || {
            general: 'Se hai bisogno di aiuto, contatta il supporto o consulta la documentazione.'
        };
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateFeedbackId() {
        return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    updateAverageCompletionTime(timeSpent) {
        const totalCompleted = this.stats.completedTutorials;
        const currentAvg = this.stats.averageCompletionTime;
        
        this.stats.averageCompletionTime = ((currentAvg * (totalCompleted - 1)) + timeSpent) / totalCompleted;
    }

    async saveUserProgress() {
        try {
            const dataDir = path.join(__dirname, 'data');
            await fs.ensureDir(dataDir);
            
            // Save user progress
            const progressData = Object.fromEntries(this.userProgress);
            await fs.writeJson(path.join(dataDir, 'user-progress.json'), progressData, { spaces: 2 });
            
            // Save achievements
            const achievementsData = Object.fromEntries(this.achievements);
            await fs.writeJson(path.join(dataDir, 'achievements.json'), achievementsData, { spaces: 2 });
            
        } catch (error) {
            this.logger.error(`Error saving user progress: ${error.message}`, 'Tutorial');
        }
    }

    async loadUserProgress() {
        try {
            const dataDir = path.join(__dirname, 'data');
            
            // Load user progress
            const progressFile = path.join(dataDir, 'user-progress.json');
            if (await fs.pathExists(progressFile)) {
                const progressData = await fs.readJson(progressFile);
                this.userProgress = new Map(Object.entries(progressData));
            }
            
            // Load achievements
            const achievementsFile = path.join(dataDir, 'achievements.json');
            if (await fs.pathExists(achievementsFile)) {
                const achievementsData = await fs.readJson(achievementsFile);
                this.achievements = new Map(Object.entries(achievementsData));
            }
            
            this.logger.success(`Loaded progress for ${this.userProgress.size} users`, 'Tutorial');
            
        } catch (error) {
            this.logger.error(`Error loading user progress: ${error.message}`, 'Tutorial');
        }
    }
}

// Start Tutorial System if run directly
if (require.main === module) {
    try {
        const tutorial = new BeginnerTutorialSystem();
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down Tutorial System...');
            tutorial.saveUserProgress();
            process.exit(0);
        });
        
        console.log('📚 LUNACOIN Tutorial System started successfully!');
    } catch (error) {
        console.error('❌ Error starting Tutorial System:', error.message);
        process.exit(1);
    }
}

module.exports = BeginnerTutorialSystem;