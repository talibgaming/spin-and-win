const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy Mock ERC20 token (or use existing Base token)
    const Token = await ethers.getContractFactory("MockERC20");
    const token = await Token.deploy("SpinToken", "SPIN");
    await token.deployed();
    console.log("Token deployed to:", token.address);

    // Deploy rewards contract
    const Rewards = await ethers.getContractFactory("SpinAndWinRewards");
    const rewards = await Rewards.deploy(token.address);
    await rewards.deployed();
    console.log("Rewards contract deployed to:", rewards.address);

    // Fund the contract with tokens
    await token.mint(rewards.address, ethers.utils.parseEther("10000"));
    console.log("Contract funded with 10,000 SPIN tokens");

    console.log("\nDeployment Summary:");
    console.log("Token Address:", token.address);
    console.log("Rewards Contract:", rewards.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
