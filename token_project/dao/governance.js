const { Connection, PublicKey, Keypair, Transaction, SystemProgram } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const http = require('http');
const mongoose = require('mongoose');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class LunacoinDAO {
    constructor() {
        this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
        this.logger = logger;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        // DAO Configuration
        this.daoConfig = {
            name: 'LUNACOIN DAO',
            symbol: 'LUNA-GOV',
            votingPeriod: 7 * 24 * 60 * 60 * 1000, // 7 giorni
            executionDelay: 2 * 24 * 60 * 60 * 1000, // 2 giorni
            proposalThreshold: 1000, // 1000 LUNA per creare proposta
            quorumThreshold: 0.04, // 4% del supply totale
            votingPowerDecimals: 18,
            maxProposalsPerUser: 3,
            proposalCooldown: 24 * 60 * 60 * 1000 // 24 ore
        };
        
        // Storage
        this.proposals = new Map();
        this.votes = new Map();
        this.delegates = new Map();
        this.snapshots = new Map();
        this.userProposals = new Map();
        
        // Statistics
        this.stats = {
            totalProposals: 0,
            activeProposals: 0,
            totalVotes: 0,
            totalVotingPower: 0,
            participationRate: 0,
            averageVotingPower: 0
        };
        
        this.initializeDAO();
    }

    async initializeDAO() {
        try {
            await this.setupDatabase();
            this.setupMiddleware();
            this.setupRoutes();
            this.setupWebSocket();
            this.setupScheduledTasks();
            
            await this.loadPersistedData();
            
            const port = process.env.DAO_PORT || 6000;
            this.server.listen(port, () => {
                logger.info(`🏛️ LUNACOIN DAO Server running on port ${port}`);
            });
            
        } catch (error) {
            this.logger.error(`Error initializing DAO: ${error.message}`, 'DAO');
            throw error;
        }
    }

    async setupDatabase() {
        try {
            const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/lunacoin-dao';
            await mongoose.connect(mongoUrl);
            this.logger.success('Connected to MongoDB', 'DAO');
        } catch (error) {
            this.logger.warn('MongoDB connection failed, using in-memory storage', 'DAO');
        }
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // DAO Info
        this.app.get('/api/dao/info', (req, res) => {
            res.json({
                success: true,
                data: {
                    config: this.daoConfig,
                    stats: this.stats,
                    timestamp: new Date().toISOString()
                }
            });
        });

        // Create Proposal
        this.app.post('/api/dao/proposals', async (req, res) => {
            try {
                const proposal = await this.createProposal(req.body);
                res.json({ success: true, data: proposal });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Get Proposals
        this.app.get('/api/dao/proposals', (req, res) => {
            const { status, page = 1, limit = 10 } = req.query;
            const proposals = this.getProposals({ status, page: parseInt(page), limit: parseInt(limit) });
            res.json({ success: true, data: proposals });
        });

        // Get Proposal Details
        this.app.get('/api/dao/proposals/:id', (req, res) => {
            const proposal = this.proposals.get(req.params.id);
            if (!proposal) {
                return res.status(404).json({ success: false, error: 'Proposal not found' });
            }
            res.json({ success: true, data: proposal });
        });

        // Vote on Proposal
        this.app.post('/api/dao/proposals/:id/vote', async (req, res) => {
            try {
                const vote = await this.castVote(req.params.id, req.body);
                res.json({ success: true, data: vote });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Delegate Voting Power
        this.app.post('/api/dao/delegate', async (req, res) => {
            try {
                const delegation = await this.delegateVotingPower(req.body);
                res.json({ success: true, data: delegation });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Execute Proposal
        this.app.post('/api/dao/proposals/:id/execute', async (req, res) => {
            try {
                const result = await this.executeProposal(req.params.id, req.body);
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Get User Voting Power
        this.app.get('/api/dao/voting-power/:address', async (req, res) => {
            try {
                const votingPower = await this.getVotingPower(req.params.address);
                res.json({ success: true, data: { votingPower } });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // DAO Analytics
        this.app.get('/api/dao/analytics', (req, res) => {
            const analytics = this.generateAnalytics();
            res.json({ success: true, data: analytics });
        });
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            this.logger.info(`DAO WebSocket client connected: ${socket.id}`, 'DAO');

            socket.on('subscribe-proposals', () => {
                socket.join('proposals');
            });

            socket.on('subscribe-votes', (proposalId) => {
                socket.join(`votes-${proposalId}`);
            });

            socket.on('disconnect', () => {
                this.logger.info(`DAO WebSocket client disconnected: ${socket.id}`, 'DAO');
            });
        });
    }

    setupScheduledTasks() {
        // Check proposal status every hour
        cron.schedule('0 * * * *', () => {
            this.updateProposalStatuses();
        });

        // Generate daily analytics
        cron.schedule('0 0 * * *', () => {
            this.generateDailyReport();
        });

        // Cleanup expired data
        cron.schedule('0 2 * * *', () => {
            this.cleanupExpiredData();
        });
    }

    async createProposal(data) {
        const { title, description, type, actions, proposer, signature } = data;
        
        // Validate proposal data
        this.validateProposalData({ title, description, type, actions, proposer });
        
        // Check proposer voting power
        const votingPower = await this.getVotingPower(proposer);
        if (votingPower < this.daoConfig.proposalThreshold) {
            throw new Error(`Insufficient voting power. Required: ${this.daoConfig.proposalThreshold}, Available: ${votingPower}`);
        }
        
        // Check proposal cooldown
        const userProposals = this.userProposals.get(proposer) || [];
        const recentProposals = userProposals.filter(p => 
            Date.now() - p.timestamp < this.daoConfig.proposalCooldown
        );
        
        if (recentProposals.length >= this.daoConfig.maxProposalsPerUser) {
            throw new Error('Proposal cooldown active. Please wait before creating another proposal.');
        }
        
        // Create proposal
        const proposalId = this.generateProposalId();
        const proposal = {
            id: proposalId,
            title,
            description,
            type,
            actions: actions || [],
            proposer,
            status: 'active',
            votingStartTime: Date.now(),
            votingEndTime: Date.now() + this.daoConfig.votingPeriod,
            executionTime: Date.now() + this.daoConfig.votingPeriod + this.daoConfig.executionDelay,
            votes: {
                for: 0,
                against: 0,
                abstain: 0
            },
            voters: new Set(),
            quorumReached: false,
            executed: false,
            cancelled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Store proposal
        this.proposals.set(proposalId, proposal);
        
        // Update user proposals
        if (!this.userProposals.has(proposer)) {
            this.userProposals.set(proposer, []);
        }
        this.userProposals.get(proposer).push({
            id: proposalId,
            timestamp: Date.now()
        });
        
        // Update statistics
        this.stats.totalProposals++;
        this.stats.activeProposals++;
        
        // Broadcast to subscribers
        this.io.to('proposals').emit('proposal-created', proposal);
        
        // Save to persistent storage
        await this.saveProposal(proposal);
        
        this.logger.success(`Proposal created: ${proposalId} by ${proposer}`, 'DAO');
        
        return proposal;
    }

    async castVote(proposalId, voteData) {
        const { voter, choice, votingPower, signature } = voteData;
        
        // Get proposal
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            throw new Error('Proposal not found');
        }
        
        // Check voting period
        const now = Date.now();
        if (now < proposal.votingStartTime || now > proposal.votingEndTime) {
            throw new Error('Voting period has ended');
        }
        
        // Check if already voted
        if (proposal.voters.has(voter)) {
            throw new Error('Already voted on this proposal');
        }
        
        // Validate choice
        if (!['for', 'against', 'abstain'].includes(choice)) {
            throw new Error('Invalid vote choice');
        }
        
        // Get actual voting power
        const actualVotingPower = await this.getVotingPower(voter);
        if (actualVotingPower === 0) {
            throw new Error('No voting power');
        }
        
        // Create vote record
        const voteId = this.generateVoteId();
        const vote = {
            id: voteId,
            proposalId,
            voter,
            choice,
            votingPower: actualVotingPower,
            timestamp: Date.now(),
            blockHeight: await this.connection.getSlot(),
            signature
        };
        
        // Store vote
        this.votes.set(voteId, vote);
        
        // Update proposal
        proposal.votes[choice] += actualVotingPower;
        proposal.voters.add(voter);
        proposal.updatedAt = new Date().toISOString();
        
        // Check quorum
        const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
        const totalSupply = await this.getTotalSupply();
        const quorumThreshold = totalSupply * this.daoConfig.quorumThreshold;
        
        if (totalVotes >= quorumThreshold) {
            proposal.quorumReached = true;
        }
        
        // Update statistics
        this.stats.totalVotes++;
        this.stats.totalVotingPower += actualVotingPower;
        this.updateParticipationRate();
        
        // Broadcast vote
        this.io.to(`votes-${proposalId}`).emit('vote-cast', {
            proposalId,
            vote,
            proposal: {
                id: proposal.id,
                votes: proposal.votes,
                quorumReached: proposal.quorumReached
            }
        });
        
        // Save to persistent storage
        await this.saveVote(vote);
        await this.saveProposal(proposal);
        
        this.logger.success(`Vote cast: ${choice} on ${proposalId} by ${voter}`, 'DAO');
        
        return vote;
    }

    async executeProposal(proposalId, executionData) {
        const { executor, signature } = executionData;
        
        // Get proposal
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            throw new Error('Proposal not found');
        }
        
        // Check if proposal can be executed
        const now = Date.now();
        if (now < proposal.executionTime) {
            throw new Error('Execution delay not met');
        }
        
        if (proposal.executed) {
            throw new Error('Proposal already executed');
        }
        
        if (proposal.cancelled) {
            throw new Error('Proposal was cancelled');
        }
        
        if (!proposal.quorumReached) {
            throw new Error('Quorum not reached');
        }
        
        // Check if proposal passed
        if (proposal.votes.for <= proposal.votes.against) {
            throw new Error('Proposal did not pass');
        }
        
        // Execute proposal actions
        const executionResults = [];
        
        for (const action of proposal.actions) {
            try {
                const result = await this.executeAction(action);
                executionResults.push({
                    action: action.type,
                    success: true,
                    result
                });
            } catch (error) {
                executionResults.push({
                    action: action.type,
                    success: false,
                    error: error.message
                });
            }
        }
        
        // Update proposal
        proposal.executed = true;
        proposal.executedAt = new Date().toISOString();
        proposal.executedBy = executor;
        proposal.executionResults = executionResults;
        proposal.status = 'executed';
        proposal.updatedAt = new Date().toISOString();
        
        // Update statistics
        this.stats.activeProposals--;
        
        // Broadcast execution
        this.io.to('proposals').emit('proposal-executed', {
            proposalId,
            proposal,
            executionResults
        });
        
        // Save to persistent storage
        await this.saveProposal(proposal);
        
        this.logger.success(`Proposal executed: ${proposalId} by ${executor}`, 'DAO');
        
        return {
            proposalId,
            executed: true,
            executionResults
        };
    }

    async executeAction(action) {
        switch (action.type) {
            case 'transfer':
                return await this.executeTransfer(action);
            case 'mint':
                return await this.executeMint(action);
            case 'burn':
                return await this.executeBurn(action);
            case 'update_config':
                return await this.executeConfigUpdate(action);
            case 'add_validator':
                return await this.executeAddValidator(action);
            case 'remove_validator':
                return await this.executeRemoveValidator(action);
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }

    async getVotingPower(address) {
        try {
            // Get token balance
            const tokenAccount = await this.connection.getTokenAccountsByOwner(
                new PublicKey(address),
                { mint: new PublicKey(process.env.TOKEN_MINT_ADDRESS || 'So11111111111111111111111111111111111111112') }
            );
            
            if (tokenAccount.value.length === 0) {
                return 0;
            }
            
            const balance = await this.connection.getTokenAccountBalance(
                tokenAccount.value[0].pubkey
            );
            
            // Check for delegation
            const delegatedPower = this.delegates.get(address) || 0;
            
            return parseInt(balance.value.amount) + delegatedPower;
        } catch (error) {
            this.logger.error(`Error getting voting power for ${address}: ${error.message}`, 'DAO');
            return 0;
        }
    }

    validateProposalData(data) {
        const { title, description, type, proposer } = data;
        
        if (!title || title.length < 10 || title.length > 200) {
            throw new Error('Title must be between 10 and 200 characters');
        }
        
        if (!description || description.length < 50 || description.length > 5000) {
            throw new Error('Description must be between 50 and 5000 characters');
        }
        
        if (!['governance', 'treasury', 'technical', 'marketing', 'partnership'].includes(type)) {
            throw new Error('Invalid proposal type');
        }
        
        if (!proposer) {
            throw new Error('Proposer address required');
        }
    }

    generateProposalId() {
        return `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateVoteId() {
        return `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getProposals(filters = {}) {
        const { status, page = 1, limit = 10 } = filters;
        let proposals = Array.from(this.proposals.values());
        
        if (status) {
            proposals = proposals.filter(p => p.status === status);
        }
        
        // Sort by creation date (newest first)
        proposals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        return {
            proposals: proposals.slice(startIndex, endIndex),
            pagination: {
                page,
                limit,
                total: proposals.length,
                pages: Math.ceil(proposals.length / limit)
            }
        };
    }

    updateProposalStatuses() {
        const now = Date.now();
        let updated = 0;
        
        for (const proposal of this.proposals.values()) {
            if (proposal.status === 'active' && now > proposal.votingEndTime) {
                proposal.status = 'ended';
                proposal.updatedAt = new Date().toISOString();
                this.stats.activeProposals--;
                updated++;
            }
        }
        
        if (updated > 0) {
            this.logger.info(`Updated ${updated} proposal statuses`, 'DAO');
        }
    }

    generateAnalytics() {
        const proposals = Array.from(this.proposals.values());
        const votes = Array.from(this.votes.values());
        
        return {
            overview: this.stats,
            proposalsByType: this.getProposalsByType(proposals),
            proposalsByStatus: this.getProposalsByStatus(proposals),
            votingActivity: this.getVotingActivity(votes),
            topVoters: this.getTopVoters(votes),
            participationTrends: this.getParticipationTrends(proposals),
            quorumAnalysis: this.getQuorumAnalysis(proposals)
        };
    }

    async saveProposal(proposal) {
        try {
            const filePath = path.join(__dirname, 'data', 'proposals', `${proposal.id}.json`);
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeJson(filePath, proposal, { spaces: 2 });
        } catch (error) {
            this.logger.error(`Error saving proposal: ${error.message}`, 'DAO');
        }
    }

    async saveVote(vote) {
        try {
            const filePath = path.join(__dirname, 'data', 'votes', `${vote.id}.json`);
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeJson(filePath, vote, { spaces: 2 });
        } catch (error) {
            this.logger.error(`Error saving vote: ${error.message}`, 'DAO');
        }
    }

    async loadPersistedData() {
        try {
            // Load proposals
            const proposalsDir = path.join(__dirname, 'data', 'proposals');
            if (fs.existsSync(proposalsDir)) {
                const files = fs.readdirSync(proposalsDir);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const proposalData = fs.readFileSync(path.join(proposalsDir, file), 'utf8');
                        const proposal = JSON.parse(proposalData);
                        this.proposals.set(proposal.id, proposal);
                    }
                }
            }
            
            // Load votes
            const votesDir = path.join(__dirname, 'data', 'votes');
            if (fs.existsSync(votesDir)) {
                const files = fs.readdirSync(votesDir);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const voteData = fs.readFileSync(path.join(votesDir, file), 'utf8');
                        const vote = JSON.parse(voteData);
                        this.votes.set(vote.id, vote);
                    }
                }
            }
            
            this.logger.success(`Loaded ${this.proposals.size} proposals and ${this.votes.size} votes`, 'DAO');
        } catch (error) {
            this.logger.error(`Error loading persisted data: ${error.message}`, 'DAO');
        }
    }

    updateParticipationRate() {
        if (this.stats.totalVotes > 0) {
            this.stats.averageVotingPower = this.stats.totalVotingPower / this.stats.totalVotes;
        }
    }

    async getTotalSupply() {
        try {
            const supply = await this.connection.getTokenSupply(new PublicKey(process.env.TOKEN_MINT_ADDRESS || 'So11111111111111111111111111111111111111112'));
            return parseInt(supply.value.amount);
        } catch (error) {
            return parseInt(process.env.TOKEN_TOTAL_SUPPLY || '1000000000');
        }
    }

    getProposalsByType(proposals) {
        const types = {};
        proposals.forEach(p => {
            types[p.type] = (types[p.type] || 0) + 1;
        });
        return types;
    }

    getProposalsByStatus(proposals) {
        const statuses = {};
        proposals.forEach(p => {
            statuses[p.status] = (statuses[p.status] || 0) + 1;
        });
        return statuses;
    }

    getVotingActivity(votes) {
        const activity = {};
        votes.forEach(v => {
            const date = moment(v.timestamp).format('YYYY-MM-DD');
            activity[date] = (activity[date] || 0) + 1;
        });
        return activity;
    }

    getTopVoters(votes) {
        const voters = {};
        votes.forEach(v => {
            if (!voters[v.voter]) {
                voters[v.voter] = { votes: 0, totalPower: 0 };
            }
            voters[v.voter].votes++;
            voters[v.voter].totalPower += v.votingPower;
        });
        
        return Object.entries(voters)
            .sort((a, b) => b[1].totalPower - a[1].totalPower)
            .slice(0, 10)
            .map(([address, data]) => ({ address, ...data }));
    }

    getParticipationTrends(proposals) {
        return proposals.map(p => ({
            id: p.id,
            title: p.title,
            totalVotes: p.votes.for + p.votes.against + p.votes.abstain,
            participation: p.voters.size,
            quorumReached: p.quorumReached
        }));
    }

    getQuorumAnalysis(proposals) {
        const total = proposals.length;
        const withQuorum = proposals.filter(p => p.quorumReached).length;
        
        return {
            totalProposals: total,
            proposalsWithQuorum: withQuorum,
            quorumRate: total > 0 ? (withQuorum / total) * 100 : 0
        };
    }
}

// Start DAO if run directly
if (require.main === module) {
    try {
        const dao = new LunacoinDAO();
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down LUNACOIN DAO...');
            process.exit(0);
        });
        
        console.log('🏛️ LUNACOIN DAO started successfully!');
    } catch (error) {
        console.error('❌ Error starting DAO:', error.message);
        process.exit(1);
    }
}

module.exports = LunacoinDAO;