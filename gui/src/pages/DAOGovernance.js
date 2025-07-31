import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Avatar,
  Divider,
  Alert,
  Tab,
  Tabs,
  Paper
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  Add as AddIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  AccessTime as TimeIcon,
  CheckCircle as SuccessIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Person as PersonIcon,
  Gavel as GavelIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import { useSystem } from '../context/SystemContext';

const DAOGovernance = () => {
  const { 
    systemStatus, 
    stats, 
    logs,
    startDAO,
    stopDAO
  } = useSystem();

  const [tabValue, setTabValue] = useState(0);
  const [proposals, setProposals] = useState([]);
  const [members, setMembers] = useState([]);
  const [openProposalDialog, setOpenProposalDialog] = useState(false);
  const [openVoteDialog, setOpenVoteDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    type: 'parameter',
    duration: 7,
    options: ['Sì', 'No']
  });
  const [userVote, setUserVote] = useState('');

  const proposalTypes = [
    { value: 'parameter', label: 'Modifica Parametri' },
    { value: 'upgrade', label: 'Upgrade Sistema' },
    { value: 'treasury', label: 'Gestione Treasury' },
    { value: 'governance', label: 'Governance' },
    { value: 'emergency', label: 'Emergenza' }
  ];

  useEffect(() => {
    // Simula proposte esistenti
    const mockProposals = [
      {
        id: 1,
        title: 'Aumentare il limite di token per ora',
        description: 'Proposta per aumentare il limite di generazione token da 10 a 20 per ora per migliorare la produttività del sistema.',
        type: 'parameter',
        status: 'active',
        creator: '9Gsk1jZQtPc6GhJsh4SLi3akxmAfh3XKnWsMbHM6zGEW',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        votes: {
          yes: 15,
          no: 3,
          abstain: 2
        },
        totalVoters: 20,
        quorum: 10,
        userVoted: false
      },
      {
        id: 2,
        title: 'Implementare nuovo algoritmo di validazione',
        description: 'Aggiornare il sistema di validazione unicità token con un algoritmo più efficiente.',
        type: 'upgrade',
        status: 'passed',
        creator: '8Hsk2jZQtPc6GhJsh4SLi3akxmAfh3XKnWsMbHM6zGEX',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        votes: {
          yes: 18,
          no: 2,
          abstain: 0
        },
        totalVoters: 20,
        quorum: 10,
        userVoted: true
      },
      {
        id: 3,
        title: 'Ridurre commissioni DEX listing',
        description: 'Proposta per negoziare commissioni più basse per il listing automatico sui DEX.',
        type: 'treasury',
        status: 'rejected',
        creator: '7Gsk3jZQtPc6GhJsh4SLi3akxmAfh3XKnWsMbHM6zGEY',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        votes: {
          yes: 5,
          no: 12,
          abstain: 3
        },
        totalVoters: 20,
        quorum: 10,
        userVoted: true
      }
    ];

    const mockMembers = [
      {
        id: 1,
        address: '9Gsk1jZQtPc6GhJsh4SLi3akxmAfh3XKnWsMbHM6zGEW',
        votingPower: 100,
        proposalsCreated: 5,
        votesParticipated: 15,
        joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        reputation: 95
      },
      {
        id: 2,
        address: '8Hsk2jZQtPc6GhJsh4SLi3akxmAfh3XKnWsMbHM6zGEX',
        votingPower: 75,
        proposalsCreated: 3,
        votesParticipated: 12,
        joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        reputation: 88
      }
    ];

    setProposals(mockProposals);
    setMembers(mockMembers);
  }, []);

  const handleCreateProposal = () => {
    if (!newProposal.title || !newProposal.description) {
      alert('Titolo e descrizione sono obbligatori');
      return;
    }

    const proposal = {
      id: Date.now(),
      ...newProposal,
      status: 'active',
      creator: '9Gsk1jZQtPc6GhJsh4SLi3akxmAfh3XKnWsMbHM6zGEW',
      createdAt: new Date().toISOString(),
      endDate: new Date(Date.now() + newProposal.duration * 24 * 60 * 60 * 1000).toISOString(),
      votes: { yes: 0, no: 0, abstain: 0 },
      totalVoters: 0,
      quorum: 10,
      userVoted: false
    };

    setProposals(prev => [proposal, ...prev]);
    setOpenProposalDialog(false);
    setNewProposal({
      title: '',
      description: '',
      type: 'parameter',
      duration: 7,
      options: ['Sì', 'No']
    });
  };

  const handleVote = () => {
    if (!userVote || !selectedProposal) return;

    setProposals(prev => prev.map(p => {
      if (p.id === selectedProposal.id) {
        const updatedVotes = { ...p.votes };
        if (userVote === 'yes') updatedVotes.yes += 1;
        else if (userVote === 'no') updatedVotes.no += 1;
        else updatedVotes.abstain += 1;

        return {
          ...p,
          votes: updatedVotes,
          totalVoters: p.totalVoters + 1,
          userVoted: true
        };
      }
      return p;
    }));

    setOpenVoteDialog(false);
    setUserVote('');
    setSelectedProposal(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <PendingIcon sx={{ color: '#2196f3' }} />;
      case 'passed': return <SuccessIcon sx={{ color: '#4caf50' }} />;
      case 'rejected': return <CancelIcon sx={{ color: '#f44336' }} />;
      default: return <PendingIcon sx={{ color: '#2196f3' }} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Attiva';
      case 'passed': return 'Approvata';
      case 'rejected': return 'Respinta';
      default: return 'Sconosciuto';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'primary';
      case 'passed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'parameter': return 'info';
      case 'upgrade': return 'warning';
      case 'treasury': return 'success';
      case 'governance': return 'primary';
      case 'emergency': return 'error';
      default: return 'default';
    }
  };

  const calculateProgress = (proposal) => {
    const totalVotes = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain;
    return totalVotes > 0 ? (proposal.votes.yes / totalVotes) * 100 : 0;
  };

  const isQuorumReached = (proposal) => {
    return proposal.totalVoters >= proposal.quorum;
  };

  const getDaysRemaining = (endDate) => {
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const renderProposals = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Proposte ({proposals.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenProposalDialog(true)}
          disabled={!systemStatus.dao}
        >
          Nuova Proposta
        </Button>
      </Box>

      <Grid container spacing={2}>
        {proposals.map((proposal) => (
          <Grid item xs={12} key={proposal.id}>
            <Card className="hover-card">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getStatusIcon(proposal.status)}
                      <Typography variant="h6">{proposal.title}</Typography>
                      <Chip 
                        label={getStatusText(proposal.status)} 
                        color={getStatusColor(proposal.status)} 
                        size="small"
                      />
                      <Chip 
                        label={proposalTypes.find(t => t.value === proposal.type)?.label} 
                        color={getTypeColor(proposal.type)} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {proposal.description}
                    </Typography>
                    
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Progresso Votazione</Typography>
                            <Typography variant="body2">
                              {proposal.votes.yes}/{proposal.totalVoters} voti
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={calculateProgress(proposal)} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ThumbUpIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                            <Typography variant="body2">{proposal.votes.yes}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ThumbDownIcon sx={{ fontSize: 16, color: '#f44336' }} />
                            <Typography variant="body2">{proposal.votes.no}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Astenuti: {proposal.votes.abstain}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Quorum
                          </Typography>
                          <Typography variant="h6" color={isQuorumReached(proposal) ? 'success.main' : 'warning.main'}>
                            {proposal.totalVoters}/{proposal.quorum}
                          </Typography>
                          <Chip 
                            label={isQuorumReached(proposal) ? 'Raggiunto' : 'Non Raggiunto'} 
                            color={isQuorumReached(proposal) ? 'success' : 'warning'} 
                            size="small"
                          />
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Tempo Rimanente
                          </Typography>
                          <Typography variant="h6">
                            {proposal.status === 'active' ? `${getDaysRemaining(proposal.endDate)} giorni` : 'Terminata'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(proposal.endDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Box sx={{ ml: 2 }}>
                    {proposal.status === 'active' && !proposal.userVoted && (
                      <Button
                        variant="contained"
                        startIcon={<VoteIcon />}
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setOpenVoteDialog(true);
                        }}
                        size="small"
                      >
                        Vota
                      </Button>
                    )}
                    {proposal.userVoted && (
                      <Chip label="Hai Votato" color="success" size="small" />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderMembers = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Membri DAO ({members.length})
      </Typography>
      
      <Grid container spacing={2}>
        {members.map((member) => (
          <Grid item xs={12} md={6} key={member.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: '#667eea' }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {member.address.substring(0, 8)}...{member.address.substring(-8)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Membro dal {new Date(member.joinedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Potere di Voto</Typography>
                    <Typography variant="h6">{member.votingPower}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Reputazione</Typography>
                    <Typography variant="h6" color="success.main">{member.reputation}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Proposte Create</Typography>
                    <Typography variant="h6">{member.proposalsCreated}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Voti Partecipati</Typography>
                    <Typography variant="h6">{member.votesParticipated}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <VoteIcon sx={{ fontSize: 40, color: '#667eea', mb: 1 }} />
            <Typography variant="h4">{proposals.filter(p => p.status === 'active').length}</Typography>
            <Typography variant="body2" color="text.secondary">Proposte Attive</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <SuccessIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
            <Typography variant="h4">{proposals.filter(p => p.status === 'passed').length}</Typography>
            <Typography variant="body2" color="text.secondary">Proposte Approvate</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 40, color: '#764ba2', mb: 1 }} />
            <Typography variant="h4">{members.length}</Typography>
            <Typography variant="body2" color="text.secondary">Membri Totali</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
            <Typography variant="h4">87%</Typography>
            <Typography variant="body2" color="text.secondary">Partecipazione Media</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" className="gradient-text">
          DAO Governance
        </Typography>
        <Button
          variant={systemStatus.dao ? 'outlined' : 'contained'}
          color={systemStatus.dao ? 'error' : 'success'}
          startIcon={systemStatus.dao ? <StopIcon /> : <PlayIcon />}
          onClick={systemStatus.dao ? stopDAO : startDAO}
        >
          {systemStatus.dao ? 'Ferma DAO' : 'Avvia DAO'}
        </Button>
      </Box>

      {/* Status Alert */}
      {!systemStatus.dao && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Il sistema DAO non è attivo. Avvia il sistema per partecipare alla governance.
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Proposte" />
          <Tab label="Membri" />
          <Tab label="Statistiche" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && renderProposals()}
      {tabValue === 1 && renderMembers()}
      {tabValue === 2 && renderStats()}

      {/* Create Proposal Dialog */}
      <Dialog open={openProposalDialog} onClose={() => setOpenProposalDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crea Nuova Proposta</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titolo Proposta"
                value={newProposal.title}
                onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                placeholder="es. Aumentare limite token per ora"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descrizione"
                value={newProposal.description}
                onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                placeholder="Descrizione dettagliata della proposta..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo Proposta</InputLabel>
                <Select
                  value={newProposal.type}
                  onChange={(e) => setNewProposal({...newProposal, type: e.target.value})}
                >
                  {proposalTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Durata (giorni)"
                value={newProposal.duration}
                onChange={(e) => setNewProposal({...newProposal, duration: parseInt(e.target.value) || 7})}
                inputProps={{ min: 1, max: 30 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProposalDialog(false)}>Annulla</Button>
          <Button onClick={handleCreateProposal} variant="contained">
            Crea Proposta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vote Dialog */}
      <Dialog open={openVoteDialog} onClose={() => setOpenVoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Vota Proposta</DialogTitle>
        <DialogContent>
          {selectedProposal && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedProposal.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedProposal.description}
              </Typography>
              
              <FormControl fullWidth>
                <InputLabel>Il tuo voto</InputLabel>
                <Select
                  value={userVote}
                  onChange={(e) => setUserVote(e.target.value)}
                >
                  <MenuItem value="yes">Sì - Approvo</MenuItem>
                  <MenuItem value="no">No - Respingo</MenuItem>
                  <MenuItem value="abstain">Mi astengo</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVoteDialog(false)}>Annulla</Button>
          <Button onClick={handleVote} variant="contained" disabled={!userVote}>
            Conferma Voto
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DAOGovernance;