import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  // Deploy contract
  const deployment = await deploy("WorldSimulation", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // If contract was newly deployed, authorize additional accounts
  if (deployment.newlyDeployed) {
    const worldSimulation = await ethers.getContractAt(
      "WorldSimulation",
      deployment.address
    );

    // Get Hardhat signers (first 10 accounts, excluding deployer)
    const signers = await ethers.getSigners();
    const accountsToAuthorize = signers
      .slice(1, 11) // Skip deployer (index 0), get accounts 1-10
      .map((s) => s.address);

    console.log("Authorizing additional accounts:", accountsToAuthorize);

    // Batch authorize accounts (if any)
    if (accountsToAuthorize.length > 0) {
      const statuses = new Array(accountsToAuthorize.length).fill(true);
      
      // Use batch authorization for efficiency
      try {
        const tx = await worldSimulation.batchSetAuthorized(
          accountsToAuthorize,
          statuses
        );
        await tx.wait();
        console.log(
          `✅ Successfully authorized ${accountsToAuthorize.length} accounts`
        );
      } catch (error) {
        console.error("Failed to authorize accounts:", error);
        // Fallback: authorize one by one if batch fails
        console.log("Trying individual authorization...");
        for (const account of accountsToAuthorize) {
          try {
            const tx = await worldSimulation.setAuthorized(account, true);
            await tx.wait();
            console.log(`  ✅ Authorized: ${account}`);
          } catch (err) {
            console.error(`  ❌ Failed to authorize ${account}:`, err);
          }
        }
      }
    }
  } else {
    console.log("Contract already deployed, skipping authorization");
  }
};

export default func;
func.tags = ["WorldSimulation"];


