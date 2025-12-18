import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { WorldSimulation } from "../typechain-types";

describe("End-to-End Integration Tests", function () {
  let worldSimulation: WorldSimulation;
  let worldSimulationAddress: string;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const WorldSimulation = await ethers.getContractFactory("WorldSimulation");
    worldSimulation = await WorldSimulation.deploy();
    await worldSimulation.waitForDeployment();
    worldSimulationAddress = await worldSimulation.getAddress();

    // Authorize users
    await worldSimulation.setAuthorized(user1.address, true);
    await worldSimulation.setAuthorized(user2.address, true);
  });

  // Helper function to create encrypted input with zeros
  async function createZeroEncryptedInput(user: any) {
    if (fhevm.isMock) {
      const encryptedInput = await fhevm
        .createEncryptedInput(worldSimulationAddress, user.address)
        .add32(0)
        .add32(0)
        .add32(0)
        .add32(0)
        .encrypt();
      return encryptedInput;
    }
    return null;
  }

  describe("Complete User Journey", function () {
    it("Should handle multiple users making decisions and aggregating world state", async function () {
      if (!fhevm.isMock) {
        this.skip(); // Skip on non-mock networks as we need proper FHE encryption
        return;
      }

      // User 1 makes a decision with encrypted zeros
      const encrypted1 = await createZeroEncryptedInput(user1);
      if (!encrypted1) {
        this.skip();
        return;
      }

      const tx1 = await worldSimulation.connect(user1).applyEncryptedDecision(
        encrypted1.handles[0],
        encrypted1.handles[1],
        encrypted1.handles[2],
        encrypted1.handles[3],
        encrypted1.inputProof
      );
      const receipt1 = await tx1.wait();
      const block1 = await ethers.provider.getBlock(receipt1!.blockNumber);
      
      await expect(tx1)
        .to.emit(worldSimulation, "DecisionApplied")
        .withArgs(user1.address, block1!.timestamp);

      // User 2 makes a decision
      const encrypted2 = await createZeroEncryptedInput(user2);
      if (!encrypted2) {
        this.skip();
        return;
      }

      const tx2 = await worldSimulation.connect(user2).applyEncryptedDecision(
        encrypted2.handles[0],
        encrypted2.handles[1],
        encrypted2.handles[2],
        encrypted2.handles[3],
        encrypted2.inputProof
      );
      const receipt2 = await tx2.wait();
      const block2 = await ethers.provider.getBlock(receipt2!.blockNumber);
      
      await expect(tx2)
        .to.emit(worldSimulation, "DecisionApplied")
        .withArgs(user2.address, block2!.timestamp);

      // Verify decision count
      const decisions = await worldSimulation.getDecisionsCount();
      expect(decisions).to.not.equal(ethers.ZeroHash); // Should be non-zero

      // Verify world state can be read
      const [worldEvolution, stability, innovation, mystery] = await worldSimulation.getWorldState();
      expect(worldEvolution).to.not.equal(ethers.ZeroHash);
      expect(stability).to.not.equal(ethers.ZeroHash);
      expect(innovation).to.not.equal(ethers.ZeroHash);
      expect(mystery).to.not.equal(ethers.ZeroHash);
    });

    it("Should properly handle authorization and access control", async function () {
      if (!fhevm.isMock) {
        this.skip();
        return;
      }

      // Remove authorization for user2
      await worldSimulation.setAuthorized(user2.address, false);

      // User1 should still work
      const encrypted1 = await createZeroEncryptedInput(user1);
      if (!encrypted1) {
        this.skip();
        return;
      }

      await expect(worldSimulation.connect(user1).applyEncryptedDecision(
        encrypted1.handles[0],
        encrypted1.handles[1],
        encrypted1.handles[2],
        encrypted1.handles[3],
        encrypted1.inputProof
      )).to.not.be.reverted;

      // User2 should be rejected
      const encrypted2 = await createZeroEncryptedInput(user2);
      if (!encrypted2) {
        this.skip();
        return;
      }

      await expect(worldSimulation.connect(user2).applyEncryptedDecision(
        encrypted2.handles[0],
        encrypted2.handles[1],
        encrypted2.handles[2],
        encrypted2.handles[3],
        encrypted2.inputProof
      )).to.be.revertedWith("Not authorized");
    });

    it("Should support emergency pause functionality", async function () {
      if (!fhevm.isMock) {
        this.skip();
        return;
      }

      // Pause the contract
      await worldSimulation.setPaused(true);
      expect(await worldSimulation.paused()).to.be.true;

      // All operations should be blocked
      const encrypted1 = await createZeroEncryptedInput(user1);
      if (!encrypted1) {
        this.skip();
        return;
      }

      await expect(worldSimulation.connect(user1).applyEncryptedDecision(
        encrypted1.handles[0],
        encrypted1.handles[1],
        encrypted1.handles[2],
        encrypted1.handles[3],
        encrypted1.inputProof
      )).to.be.revertedWith("Contract paused");

      // Even reading should be restricted (depending on implementation)
      await worldSimulation.getWorldState(); // Should not revert for reads

      // Unpause
      await worldSimulation.setPaused(false);
      expect(await worldSimulation.paused()).to.be.false;

      // Operations should work again
      await expect(worldSimulation.connect(user1).applyEncryptedDecision(
        encrypted1.handles[0],
        encrypted1.handles[1],
        encrypted1.handles[2],
        encrypted1.handles[3],
        encrypted1.inputProof
      )).to.not.be.reverted;
    });

    it("Should handle batch authorization operations", async function () {
      const users = [user1.address, user2.address];
      const statuses = [true, false];

      // Batch authorize
      await worldSimulation.batchSetAuthorized(users, statuses);

      // Verify results
      expect(await worldSimulation.authorizedUsers(user1.address)).to.be.true;
      expect(await worldSimulation.authorizedUsers(user2.address)).to.be.false;
    });
  });

  describe("Error Handling and Edge Cases", function () {
    it("Should reject invalid batch operations", async function () {
      const users = [user1.address];
      const statuses = [true, false]; // Mismatched lengths

      await expect(worldSimulation.batchSetAuthorized(users, statuses))
        .to.be.revertedWith("Array length mismatch");
    });

    it("Should reject batch operations that are too large", async function () {
      const users = new Array(60).fill(user1.address);
      const statuses = new Array(60).fill(true);

      await expect(worldSimulation.batchSetAuthorized(users, statuses))
        .to.be.revertedWith("Invalid batch size");
    });

    it("Should prevent zero address authorizations", async function () {
      await expect(worldSimulation.setAuthorized(ethers.ZeroAddress, true))
        .to.be.revertedWith("Invalid user address");
    });
  });

  describe("Gas Optimization Verification", function () {
    it("Should demonstrate efficient batch operations", async function () {
      const users = [user1.address, user2.address];
      const statuses = [true, true];

      // This should be more gas efficient than individual calls
      const tx = await worldSimulation.batchSetAuthorized(users, statuses);
      const receipt = await tx.wait();

      expect(receipt?.gasUsed).to.be.lt(100000); // Reasonable gas limit
    });
  });
});
