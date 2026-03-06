import hre from "hardhat";

async function main() {
  const connection = hre.network.provider;

  // Use ethers from the hardhat-ethers plugin
  const ethers = (hre as any).ethers;
  if (!ethers) {
    // Fallback: use ethers directly with the provider
    const { ethers: ethersLib } = await import("ethers");
    const provider = new ethersLib.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
    const deployer = new ethersLib.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

    console.log("Deploying with:", deployer.address);
    const balance = await provider.getBalance(deployer.address);
    console.log("Balance:", ethersLib.formatEther(balance), "AVAX");

    const abi = [
      "function createTournament(string code) payable",
      "function claimPrize(string code, address payable winner)",
      "function getTournament(string code) view returns (address host, uint256 prize, bool claimed)",
    ];

    // Read the compiled bytecode
    const fs = await import("fs");
    const artifact = JSON.parse(
      fs.readFileSync("./artifacts/src/contracts/LuckyGoalEscrow.sol/LuckyGoalEscrow.json", "utf8")
    );

    const factory = new ethersLib.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    console.log("Deploying LuckyGoalEscrow...");
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("LuckyGoalEscrow deployed to:", address);
    console.log("\nAdd this to .env.local:");
    console.log(`NEXT_PUBLIC_ESCROW_CONTRACT=${address}`);
    return;
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "AVAX");

  const factory = await ethers.getContractFactory("LuckyGoalEscrow");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("LuckyGoalEscrow deployed to:", address);
  console.log("\nAdd this to .env.local:");
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
