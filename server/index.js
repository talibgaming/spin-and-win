const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const RPC_URL = process.env.RPC_URL || "https://goerli.base.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PORT = process.env.PORT || 3001;

// Contract ABI
const contractABI = [
    "function reward(address recipient) external",
    "function getPlayerStats(address player) external view returns (uint256 wins, uint256 totalRewards, uint256 lastWinTime)",
    "function rewardAmount() external view returns (uint256)",
    "function setRewardAmount(uint256 newAmount) external"
];

// Setup provider and wallet
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

// API Endpoints

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Spin & Win API is running' });
});

// Spin endpoint - distribute rewards
app.post('/api/spin', async (req, res) => {
    try {
        const { address, result, gameId } = req.body;
        
        if (!address || !result) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (!ethers.utils.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid address' });
        }
        
        if (result === 'win') {
            console.log(`Processing reward for ${address}`);
            
            const tx = await contract.reward(address);
            await tx.wait();
            
            const stats = await contract.getPlayerStats(address);
            
            res.json({ 
                success: true, 
                txHash: tx.hash,
                message: 'Reward distributed successfully!',
                stats: {
                    wins: stats.wins.toString(),
                    totalRewards: stats.totalRewards.toString(),
                    lastWinTime: stats.lastWinTime.toString()
                }
            });
        } else {
            res.json({ 
                success: false, 
                message: 'No reward - better luck next time!',
                stats: null
            });
        }
    } catch (error) {
        console.error('Error processing reward:', error);
        res.status(500).json({ 
            error: 'Failed to process reward', 
            details: error.message 
        });
    }
});

// Get player stats
app.get('/api/player-stats/:address', async (req, res) => {
    try {
        const address = req.params.address;
        
        if (!ethers.utils.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid address' });
        }
        
        const stats = await contract.getPlayerStats(address);
        const rewardAmount = await contract.rewardAmount();
        
        res.json({
            address,
            wins: stats.wins.toString(),
            totalRewards: stats.totalRewards.toString(),
            lastWinTime: stats.lastWinTime.toString(),
            currentRewardAmount: rewardAmount.toString()
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch stats', 
            details: error.message 
        });
    }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        // For now, return mock data. In production, this would query a database
        const leaderboard = [
            { address: "0x1234...5678", wins: 15, totalRewards: "750" },
            { address: "0xabcd...efgh", wins: 12, totalRewards: "600" },
            { address: "0x9876...5432", wins: 10, totalRewards: "500" }
        ];
        
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get contract info
app.get('/api/contract-info', async (req, res) => {
    try {
        const rewardAmount = await contract.rewardAmount();
        const balance = await contract.provider.getBalance(CONTRACT_ADDRESS);
        
        res.json({
            contractAddress: CONTRACT_ADDRESS,
            rewardAmount: rewardAmount.toString(),
            contractBalance: balance.toString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contract info' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Spin & Win API server running on port ${PORT}`);
    console.log(`📊 Contract address: ${CONTRACT_ADDRESS}`);
    console.log(`🔗 RPC URL: ${RPC_URL}`);
});
