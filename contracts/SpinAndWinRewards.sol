// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SpinAndWinRewards
 * @dev Rewards contract for Spin & Win Farcaster Mini-App
 * @notice Distributes ERC20 tokens to winners on Base L2
 */
contract SpinAndWinRewards is Ownable {
    IERC20 public immutable rewardToken;
    uint256 public rewardAmount = 50 * 1e18; // 50 tokens per win
    
    struct PlayerStats {
        uint256 wins;
        uint256 totalRewards;
        uint256 lastWinTime;
    }
    
    mapping(address => PlayerStats) public playerStats;
    
    event RewardDistributed(address indexed player, uint256 amount, uint256 winCount);
    event RewardAmountUpdated(uint256 newAmount);
    
    constructor(address _token) {
        require(_token != address(0), "Invalid token address");
        rewardToken = IERC20(_token);
    }
    
    /**
     * @dev Distribute reward to winner
     * @param recipient Address of the winner
     */
    function reward(address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(
            rewardToken.balanceOf(address(this)) >= rewardAmount, 
            "Insufficient tokens in contract"
        );
        
        playerStats[recipient].wins++;
        playerStats[recipient].totalRewards += rewardAmount;
        playerStats[recipient].lastWinTime = block.timestamp;
        
        rewardToken.transfer(recipient, rewardAmount);
        
        emit RewardDistributed(recipient, rewardAmount, playerStats[recipient].wins);
    }
    
    /**
     * @dev Update reward amount (only owner)
     * @param newAmount New reward amount in wei
     */
    function setRewardAmount(uint256 newAmount) external onlyOwner {
        rewardAmount = newAmount;
        emit RewardAmountUpdated(newAmount);
    }
    
    /**
     * @dev Get player statistics
     * @param player Address to query
     * @return wins Number of wins
     * @return totalRewards Total rewards received
     * @return lastWinTime Timestamp of last win
     */
    function getPlayerStats(address player) external view returns (
        uint256 wins, 
        uint256 totalRewards, 
        uint256 lastWinTime
    ) {
        PlayerStats memory stats = playerStats[player];
        return (stats.wins, stats.totalRewards, stats.lastWinTime);
    }
    
    /**
     * @dev Withdraw tokens from contract (only owner)
     * @param amount Amount to withdraw
     */
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "Invalid amount");
        rewardToken.transfer(owner(), amount);
    }
    
    /**
     * @dev Get contract balance
     * @return Current token balance
     */
    function getContractBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }
}
