const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const winston = require('winston');
const cron = require('node-cron');
const path = require('path');

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: './logs/dao.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Database schemas
const proposalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['treasury', 'governance', 'technical', 'marketing', 'partnership', 'other'],
    required: true 
  },
  proposer: { type: String, required: true },
  proposerStake: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'active', 'succeeded', 'defeated', 'executed', 'cancelled', 'expired'],
    default: 'draft'
  },
  votingStartTime: { type: Date, required: true },
  votingEndTime: { type: Date, required: true },
  executionTime: Date,
  quorumThreshold: { type: Number, required: true },
  approvalThreshold: { type: Number, required: true },
  votes: {
    for: { type: String, default: '0' },
    against: { type: String, default: '0' },
    abstain: { type: String, default: '0' }
  },
  voters: [{
    address: String,
    vote: { type: String, enum: ['for', 'against', 'abstain'] },
    power: String,
    timestamp: Date,
    reason: String
  }],
  actions: [{
    type: { type: String, enum: ['transfer', 'mint', 'burn', 'upgrade', 'parameter'] },
    target: String,
    value: String,
    data: String,
    description: String
  }],
  discussion: [{
    author: String,
    message: String,
    timestamp: Date,
    replies: [{
      author: String,
      message: String,
      timestamp: Date
    }]
  }],
  tags: [String],
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const delegationSchema = new mongoose.Schema({
  delegator: { type: String, required: true },
  delegate: { type: String, required: true },
  amount: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  isActive: { type: Boolean, default: true },
  transactionHash: String
});

const governanceStatsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  totalProposals: { type: Number, default: 0 },
  activeProposals: { type: Number, default: 0 },
  totalVotes: { type: Number, default: 0 },
  totalVotingPower: { type: String, default: '0' },
  participationRate: { type: Number, default: 0 },
  averageVotingTime: { type: Number, default: 0 },
  topCategories: [{
    category: String,
    count: Number
  }]
});

const Proposal = mongoose.model('Proposal', proposalSchema);
const Delegation = mongoose.model('Delegation', delegationSchema);
const GovernanceStats = mongoose.model('GovernanceStats', governanceStatsSchema);

class LunacoinDAO {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true
      }
    });
    
    this.connection = null;
    this.governanceConfig = {
      votingPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      proposalThreshold: '100000000000', // 100K LUNA
      quorumThreshold: 10, // 10%
      approvalThreshold: 51, // 51%
      executionDelay: 2 * 24 * 60 * 60 * 1000, // 2 days
      gracePeriod: 14 * 24 * 60 * 60 * 1000 // 14 days
    };
    
    this.activeProposals = new Map();
    this.votingPowers = new Map();
    this.delegations = new Map();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.startBackgroundTasks();
  }
  
  initializeMiddleware() {
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP'
    });
    this.app.use('/api/', limiter);
    
    // Serve static files
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }
  
  initializeRoutes() {
    // Serve main DAO interface
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'dao.html'));
    });
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        governance: {
          activeProposals: this.activeProposals.size,
          totalDelegations: this.delegations.size
        }
      });
    });
    
    // DAO configuration
    this.app.get('/api/dao/config', (req, res) => {
      res.json({
        success: true,
        data: {
          ...this.governanceConfig,
          tokenAddress: process.env.LUNACOIN_MINT_ADDRESS,
          governanceAddress: process.env.GOVERNANCE_PROGRAM_ID
        }
      });
    });
    
    // Get all proposals
    this.app.get('/api/proposals', async (req, res) => {
      try {
        const { 
          status, 
          category, 
          page = 1, 
          limit = 20, 
          sort = 'createdAt', 
          order = 'desc' 
        } = req.query;
        
        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        
        const sortObj = {};
        sortObj[sort] = order === 'desc' ? -1 : 1;
        
        const proposals = await Proposal.find(filter)
          .sort(sortObj)
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .exec();
        
        const total = await Proposal.countDocuments(filter);
        
        res.json({
          success: true,
          data: {
            proposals,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / limit)
            }
          }
        });
      } catch (error) {
        logger.error('Get proposals error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get proposals'
        });
      }
    });
    
    // Get specific proposal
    this.app.get('/api/proposals/:id', async (req, res) => {
      try {
        const proposal = await Proposal.findOne({ id: req.params.id });
        
        if (!proposal) {
          return res.status(404).json({
            success: false,
            error: 'Proposal not found'
          });
        }
        
        // Add real-time voting data
        const votingPower = await this.getTotalVotingPower();
        const participation = this.calculateParticipation(proposal, votingPower);
        
        res.json({
          success: true,
          data: {
            ...proposal.toObject(),
            participation,
            totalVotingPower: votingPower
          }
        });
      } catch (error) {
        logger.error('Get proposal error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get proposal'
        });
      }
    });
    
    // Create new proposal
    this.app.post('/api/proposals', async (req, res) => {
      try {
        const {
          title,
          description,
          category,
          proposer,
          actions = [],
          tags = [],
          attachments = []
        } = req.body;
        
        // Validate proposer has enough tokens
        const proposerPower = await this.getVotingPower(proposer);
        const threshold = BigInt(this.governanceConfig.proposalThreshold);
        
        if (BigInt(proposerPower) < threshold) {
          return res.status(400).json({
            success: false,
            error: `Insufficient voting power. Required: ${threshold}, Available: ${proposerPower}`
          });
        }
        
        const proposalId = this.generateProposalId();
        const now = new Date();
        const votingStartTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h delay
        const votingEndTime = new Date(votingStartTime.getTime() + this.governanceConfig.votingPeriod);
        
        const proposal = new Proposal({
          id: proposalId,
          title,
          description,
          category,
          proposer,
          proposerStake: proposerPower,
          votingStartTime,
          votingEndTime,
          quorumThreshold: this.governanceConfig.quorumThreshold,
          approvalThreshold: this.governanceConfig.approvalThreshold,
          actions,
          tags,
          attachments,
          status: 'draft'
        });
        
        await proposal.save();
        
        // Emit to connected clients
        this.io.emit('proposal-created', {
          id: proposalId,
          title,
          category,
          proposer
        });
        
        logger.info('Proposal created:', {
          id: proposalId,
          title,
          proposer
        });
        
        res.json({
          success: true,
          data: {
            proposalId,
            status: 'draft',
            votingStartTime,
            votingEndTime
          }
        });
        
      } catch (error) {
        logger.error('Create proposal error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create proposal'
        });
      }
    });
    
    // Vote on proposal
    this.app.post('/api/proposals/:id/vote', async (req, res) => {
      try {
        const { voter, vote, reason = '' } = req.body;
        const proposalId = req.params.id;
        
        const proposal = await Proposal.findOne({ id: proposalId });
        if (!proposal) {
          return res.status(404).json({
            success: false,
            error: 'Proposal not found'
          });
        }
        
        // Check if voting is active
        const now = new Date();
        if (now < proposal.votingStartTime || now > proposal.votingEndTime) {
          return res.status(400).json({
            success: false,
            error: 'Voting period is not active'
          });
        }
        
        // Check if user already voted
        const existingVote = proposal.voters.find(v => v.address === voter);
        if (existingVote) {
          return res.status(400).json({
            success: false,
            error: 'User has already voted'
          });
        }
        
        // Get voting power
        const votingPower = await this.getVotingPower(voter);
        if (BigInt(votingPower) === BigInt(0)) {
          return res.status(400).json({
            success: false,
            error: 'No voting power'
          });
        }
        
        // Add vote
        proposal.voters.push({
          address: voter,
          vote,
          power: votingPower,
          timestamp: now,
          reason
        });
        
        // Update vote counts
        const currentVotes = BigInt(proposal.votes[vote] || '0');
        proposal.votes[vote] = (currentVotes + BigInt(votingPower)).toString();
        proposal.updatedAt = now;
        
        await proposal.save();
        
        // Emit real-time update
        this.io.to(`proposal-${proposalId}`).emit('vote-cast', {
          proposalId,
          voter,
          vote,
          power: votingPower,
          newTotals: proposal.votes
        });
        
        logger.info('Vote cast:', {
          proposalId,
          voter,
          vote,
          power: votingPower
        });
        
        res.json({
          success: true,
          data: {
            vote,
            power: votingPower,
            newTotals: proposal.votes
          }
        });
        
      } catch (error) {
        logger.error('Vote error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to cast vote'
        });
      }
    });
    
    // Execute proposal
    this.app.post('/api/proposals/:id/execute', async (req, res) => {
      try {
        const proposalId = req.params.id;
        const { executor } = req.body;
        
        const proposal = await Proposal.findOne({ id: proposalId });
        if (!proposal) {
          return res.status(404).json({
            success: false,
            error: 'Proposal not found'
          });
        }
        
        // Check if proposal can be executed
        const canExecute = await this.canExecuteProposal(proposal);
        if (!canExecute.success) {
          return res.status(400).json({
            success: false,
            error: canExecute.error
          });
        }
        
        // Execute proposal actions
        const executionResult = await this.executeProposalActions(proposal);
        if (!executionResult.success) {
          return res.status(500).json({
            success: false,
            error: executionResult.error
          });
        }
        
        proposal.status = 'executed';
        proposal.executionTime = new Date();
        await proposal.save();
        
        // Emit execution event
        this.io.emit('proposal-executed', {
          proposalId,
          executor,
          executionTime: proposal.executionTime
        });
        
        logger.info('Proposal executed:', {
          proposalId,
          executor
        });
        
        res.json({
          success: true,
          data: {
            status: 'executed',
            executionTime: proposal.executionTime,
            transactionHashes: executionResult.transactionHashes
          }
        });
        
      } catch (error) {
        logger.error('Execute proposal error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to execute proposal'
        });
      }
    });
    
    // Delegate voting power
    this.app.post('/api/delegate', async (req, res) => {
      try {
        const { delegator, delegate, amount, duration } = req.body;
        
        // Validate delegation
        const validation = await this.validateDelegation(delegator, delegate, amount);
        if (!validation.success) {
          return res.status(400).json({
            success: false,
            error: validation.error
          });
        }
        
        const endTime = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;
        
        const delegation = new Delegation({
          delegator,
          delegate,
          amount,
          endTime
        });
        
        await delegation.save();
        
        // Update delegation cache
        this.updateDelegationCache(delegator, delegate, amount);
        
        logger.info('Delegation created:', {
          delegator,
          delegate,
          amount
        });
        
        res.json({
          success: true,
          data: {
            delegationId: delegation._id,
            delegator,
            delegate,
            amount,
            endTime
          }
        });
        
      } catch (error) {
        logger.error('Delegation error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create delegation'
        });
      }
    });
    
    // Get user's voting power
    this.app.get('/api/voting-power/:address', async (req, res) => {
      try {
        const address = req.params.address;
        const votingPower = await this.getVotingPower(address);
        const delegatedPower = await this.getDelegatedPower(address);
        const delegations = await this.getUserDelegations(address);
        
        res.json({
          success: true,
          data: {
            address,
            ownPower: votingPower,
            delegatedPower,
            totalPower: (BigInt(votingPower) + BigInt(delegatedPower)).toString(),
            delegations
          }
        });
      } catch (error) {
        logger.error('Voting power error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get voting power'
        });
      }
    });
    
    // Get governance statistics
    this.app.get('/api/stats', async (req, res) => {
      try {
        const { period = '30d' } = req.query;
        const stats = await this.getGovernanceStatistics(period);
        
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        logger.error('Statistics error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get statistics'
        });
      }
    });
    
    // Add comment to proposal
    this.app.post('/api/proposals/:id/comments', async (req, res) => {
      try {
        const { author, message } = req.body;
        const proposalId = req.params.id;
        
        const proposal = await Proposal.findOne({ id: proposalId });
        if (!proposal) {
          return res.status(404).json({
            success: false,
            error: 'Proposal not found'
          });
        }
        
        const comment = {
          author,
          message,
          timestamp: new Date(),
          replies: []
        };
        
        proposal.discussion.push(comment);
        await proposal.save();
        
        // Emit real-time update
        this.io.to(`proposal-${proposalId}`).emit('comment-added', {
          proposalId,
          comment
        });
        
        res.json({
          success: true,
          data: comment
        });
        
      } catch (error) {
        logger.error('Comment error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to add comment'
        });
      }
    });
  }
  
  initializeWebSocket() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected to DAO:', socket.id);
      
      socket.on('subscribe-proposal', (proposalId) => {
        socket.join(`proposal-${proposalId}`);
        logger.info(`Client ${socket.id} subscribed to proposal ${proposalId}`);
      });
      
      socket.on('subscribe-governance', () => {
        socket.join('governance');
        logger.info(`Client ${socket.id} subscribed to governance updates`);
      });
      
      socket.on('get-live-stats', async () => {
        try {
          const stats = await this.getLiveStatistics();
          socket.emit('live-stats', stats);
        } catch (error) {
          logger.error('Live stats error:', error);
        }
      });
      
      socket.on('disconnect', () => {
        logger.info('Client disconnected from DAO:', socket.id);
      });
    });
  }
  
  startBackgroundTasks() {
    // Update proposal statuses
    cron.schedule('*/5 * * * *', async () => {
      await this.updateProposalStatuses();
    });
    
    // Update governance statistics
    cron.schedule('0 */6 * * *', async () => {
      await this.updateGovernanceStatistics();
    });
    
    // Clean expired delegations
    cron.schedule('0 0 * * *', async () => {
      await this.cleanExpiredDelegations();
    });
    
    // Send governance reports
    cron.schedule('0 9 * * 1', async () => {
      await this.sendWeeklyReport();
    });
  }
  
  async updateProposalStatuses() {
    try {
      const now = new Date();
      
      // Activate proposals that should start voting
      await Proposal.updateMany(
        {
          status: 'draft',
          votingStartTime: { $lte: now }
        },
        {
          status: 'active'
        }
      );
      
      // End voting for expired proposals
      const expiredProposals = await Proposal.find({
        status: 'active',
        votingEndTime: { $lte: now }
      });
      
      for (const proposal of expiredProposals) {
        const result = await this.calculateProposalResult(proposal);
        proposal.status = result.passed ? 'succeeded' : 'defeated';
        await proposal.save();
        
        // Emit status update
        this.io.emit('proposal-status-updated', {
          proposalId: proposal.id,
          status: proposal.status,
          result
        });
      }
      
    } catch (error) {
      logger.error('Error updating proposal statuses:', error);
    }
  }
  
  async calculateProposalResult(proposal) {
    const totalVotingPower = await this.getTotalVotingPower();
    const totalVotes = BigInt(proposal.votes.for) + BigInt(proposal.votes.against) + BigInt(proposal.votes.abstain);
    
    const participation = Number(totalVotes * BigInt(100) / BigInt(totalVotingPower));
    const approval = totalVotes > 0 ? Number(BigInt(proposal.votes.for) * BigInt(100) / totalVotes) : 0;
    
    const quorumMet = participation >= proposal.quorumThreshold;
    const approvalMet = approval >= proposal.approvalThreshold;
    
    return {
      passed: quorumMet && approvalMet,
      participation,
      approval,
      quorumMet,
      approvalMet,
      totalVotes: totalVotes.toString(),
      totalVotingPower: totalVotingPower.toString()
    };
  }
  
  async canExecuteProposal(proposal) {
    if (proposal.status !== 'succeeded') {
      return { success: false, error: 'Proposal has not succeeded' };
    }
    
    const now = new Date();
    const executionTime = new Date(proposal.votingEndTime.getTime() + this.governanceConfig.executionDelay);
    
    if (now < executionTime) {
      return { success: false, error: 'Execution delay period not met' };
    }
    
    const graceExpiry = new Date(executionTime.getTime() + this.governanceConfig.gracePeriod);
    if (now > graceExpiry) {
      return { success: false, error: 'Grace period expired' };
    }
    
    return { success: true };
  }
  
  async executeProposalActions(proposal) {
    const transactionHashes = [];
    
    try {
      for (const action of proposal.actions) {
        let txHash;
        
        switch (action.type) {
          case 'transfer':
            txHash = await this.executeTransfer(action);
            break;
          case 'mint':
            txHash = await this.executeMint(action);
            break;
          case 'burn':
            txHash = await this.executeBurn(action);
            break;
          case 'parameter':
            txHash = await this.executeParameterChange(action);
            break;
          default:
            logger.warn(`Unknown action type: ${action.type}`);
            continue;
        }
        
        if (txHash) {
          transactionHashes.push(txHash);
        }
      }
      
      return { success: true, transactionHashes };
    } catch (error) {
      logger.error('Error executing proposal actions:', error);
      return { success: false, error: error.message };
    }
  }
  
  async executeTransfer(action) {
    // Placeholder for transfer execution
    logger.info('Executing transfer:', action);
    return 'transfer_tx_' + Math.random().toString(36).substr(2, 9);
  }
  
  async executeMint(action) {
    // Placeholder for mint execution
    logger.info('Executing mint:', action);
    return 'mint_tx_' + Math.random().toString(36).substr(2, 9);
  }
  
  async executeBurn(action) {
    // Placeholder for burn execution
    logger.info('Executing burn:', action);
    return 'burn_tx_' + Math.random().toString(36).substr(2, 9);
  }
  
  async executeParameterChange(action) {
    // Placeholder for parameter change execution
    logger.info('Executing parameter change:', action);
    
    // Update governance config if applicable
    if (action.target === 'governance') {
      const param = JSON.parse(action.data);
      if (this.governanceConfig.hasOwnProperty(param.key)) {
        this.governanceConfig[param.key] = param.value;
        logger.info(`Updated governance parameter: ${param.key} = ${param.value}`);
      }
    }
    
    return 'param_tx_' + Math.random().toString(36).substr(2, 9);
  }
  
  async getVotingPower(address) {
    // In a real implementation, this would query the blockchain
    // For now, return a mock value
    const mockPower = Math.floor(Math.random() * 1000000000000); // Random power up to 1M LUNA
    return mockPower.toString();
  }
  
  async getDelegatedPower(address) {
    const delegations = await Delegation.find({
      delegate: address,
      isActive: true,
      $or: [
        { endTime: null },
        { endTime: { $gt: new Date() } }
      ]
    });
    
    let totalDelegated = BigInt(0);
    for (const delegation of delegations) {
      totalDelegated += BigInt(delegation.amount);
    }
    
    return totalDelegated.toString();
  }
  
  async getUserDelegations(address) {
    return await Delegation.find({
      $or: [
        { delegator: address },
        { delegate: address }
      ],
      isActive: true
    });
  }
  
  async getTotalVotingPower() {
    // In a real implementation, this would query the total token supply
    // For now, return a mock value
    return '1000000000000000'; // 1B LUNA
  }
  
  calculateParticipation(proposal, totalVotingPower) {
    const totalVotes = BigInt(proposal.votes.for) + BigInt(proposal.votes.against) + BigInt(proposal.votes.abstain);
    const participation = Number(totalVotes * BigInt(100) / BigInt(totalVotingPower));
    
    return {
      percentage: participation,
      totalVotes: totalVotes.toString(),
      breakdown: {
        for: proposal.votes.for,
        against: proposal.votes.against,
        abstain: proposal.votes.abstain
      }
    };
  }
  
  async validateDelegation(delegator, delegate, amount) {
    if (delegator === delegate) {
      return { success: false, error: 'Cannot delegate to yourself' };
    }
    
    const delegatorPower = await this.getVotingPower(delegator);
    if (BigInt(delegatorPower) < BigInt(amount)) {
      return { success: false, error: 'Insufficient voting power to delegate' };
    }
    
    return { success: true };
  }
  
  updateDelegationCache(delegator, delegate, amount) {
    if (!this.delegations.has(delegate)) {
      this.delegations.set(delegate, new Map());
    }
    this.delegations.get(delegate).set(delegator, amount);
  }
  
  async getGovernanceStatistics(period) {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const proposals = await Proposal.find({
      createdAt: { $gte: startDate }
    });
    
    const totalProposals = proposals.length;
    const activeProposals = proposals.filter(p => p.status === 'active').length;
    const succeededProposals = proposals.filter(p => p.status === 'succeeded').length;
    const executedProposals = proposals.filter(p => p.status === 'executed').length;
    
    const totalVotes = proposals.reduce((sum, p) => {
      return sum + p.voters.length;
    }, 0);
    
    const categoryStats = proposals.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});
    
    const topCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
    
    return {
      period,
      totalProposals,
      activeProposals,
      succeededProposals,
      executedProposals,
      totalVotes,
      successRate: totalProposals > 0 ? (succeededProposals / totalProposals) * 100 : 0,
      executionRate: succeededProposals > 0 ? (executedProposals / succeededProposals) * 100 : 0,
      topCategories,
      averageVotingTime: this.calculateAverageVotingTime(proposals)
    };
  }
  
  calculateAverageVotingTime(proposals) {
    const completedProposals = proposals.filter(p => 
      ['succeeded', 'defeated', 'executed'].includes(p.status)
    );
    
    if (completedProposals.length === 0) return 0;
    
    const totalTime = completedProposals.reduce((sum, p) => {
      return sum + (p.votingEndTime.getTime() - p.votingStartTime.getTime());
    }, 0);
    
    return totalTime / completedProposals.length / (24 * 60 * 60 * 1000); // Convert to days
  }
  
  async getLiveStatistics() {
    const totalProposals = await Proposal.countDocuments();
    const activeProposals = await Proposal.countDocuments({ status: 'active' });
    const totalDelegations = await Delegation.countDocuments({ isActive: true });
    const totalVotingPower = await this.getTotalVotingPower();
    
    return {
      totalProposals,
      activeProposals,
      totalDelegations,
      totalVotingPower,
      timestamp: new Date().toISOString()
    };
  }
  
  async updateGovernanceStatistics() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const stats = await this.getGovernanceStatistics('24h');
      
      await GovernanceStats.updateOne(
        { date: today },
        {
          totalProposals: stats.totalProposals,
          activeProposals: stats.activeProposals,
          totalVotes: stats.totalVotes,
          totalVotingPower: await this.getTotalVotingPower(),
          participationRate: stats.totalVotes / stats.totalProposals || 0,
          averageVotingTime: stats.averageVotingTime,
          topCategories: stats.topCategories
        },
        { upsert: true }
      );
      
      logger.info('Governance statistics updated');
    } catch (error) {
      logger.error('Error updating governance statistics:', error);
    }
  }
  
  async cleanExpiredDelegations() {
    try {
      const now = new Date();
      
      const result = await Delegation.updateMany(
        {
          isActive: true,
          endTime: { $lte: now }
        },
        {
          isActive: false
        }
      );
      
      logger.info(`Cleaned ${result.modifiedCount} expired delegations`);
    } catch (error) {
      logger.error('Error cleaning expired delegations:', error);
    }
  }
  
  async sendWeeklyReport() {
    try {
      const stats = await this.getGovernanceStatistics('7d');
      
      // In a real implementation, this would send emails/notifications
      logger.info('Weekly governance report:', stats);
      
      // Emit to connected clients
      this.io.emit('weekly-report', {
        type: 'governance-report',
        period: '7d',
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error sending weekly report:', error);
    }
  }
  
  generateProposalId() {
    return 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  async start() {
    try {
      // Connect to database
      const mongoUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/lunacoin_dao';
      await mongoose.connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      logger.info('✅ Connected to database');
      
      // Initialize Solana connection
      const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
      this.connection = new Connection(rpcUrl, 'confirmed');
      logger.info('✅ Connected to Solana');
      
      // Start server
      const port = process.env.DAO_PORT || 3004;
      this.server.listen(port, () => {
        logger.info(`🏛️ LUNACOIN DAO started on port ${port}`);
        logger.info('🗳️ Governance system ready');
      });
      
    } catch (error) {
      logger.error('Failed to start DAO:', error);
      process.exit(1);
    }
  }
}

// Start the DAO if this file is run directly
if (require.main === module) {
  const dao = new LunacoinDAO();
  dao.start();
}

module.exports = LunacoinDAO;