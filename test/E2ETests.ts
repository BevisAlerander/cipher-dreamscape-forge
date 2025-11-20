import { expect } from "chai";
import { ethers } from "hardhat";
import { WorldSimulation } from "../typechain-types";

describe("End-to-End Integration Tests", function () {
  let worldSimulation: WorldSimulation;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const WorldSimulation = await ethers.getContractFactory("WorldSimulation");
    worldSimulation = await WorldSimulation.deploy();
    await worldSimulation.waitForDeployment();

    // Authorize users
    await worldSimulation.setAuthorized(user1.address, true);
    await worldSimulation.setAuthorized(user2.address, true);
  });

  describe("Complete User Journey", function () {
    it("Should handle multiple users making decisions and aggregating world state", async function () {
      // User 1 makes a decision
      const zeroHandle = ethers.ZeroHash;
      const emptyProof = "0x";

      await expect(worldSimulation.connect(user1).applyEncryptedDecision(
        zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof
      )).to.emit(worldSimulation, "DecisionApplied").withArgs(user1.address);

      // User 2 makes a decision
      await expect(worldSimulation.connect(user2).applyEncryptedDecision(
        zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof
      )).to.emit(worldSimulation, "DecisionApplied").withArgs(user2.address);

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
      const zeroHandle = ethers.ZeroHash;
      const emptyProof = "0x";

      // Remove authorization for user2
      await worldSimulation.setAuthorized(user2.address, false);

      // User1 should still work
      await expect(worldSimulation.connect(user1).applyEncryptedDecision(
        zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof
      )).to.not.be.reverted;

      // User2 should be rejected
      await expect(worldSimulation.connect(user2).applyEncryptedDecision(
        zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof
      )).to.be.revertedWith("Not authorized");
    });

    it("Should support emergency pause functionality", async function () {
      const zeroHandle = ethers.ZeroHash;
      const emptyProof = "0x";

      // Pause the contract
      await worldSimulation.setPaused(true);
      expect(await worldSimulation.paused()).to.be.true;

      // All operations should be blocked
      await expect(worldSimulation.connect(user1).applyEncryptedDecision(
        zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof
      )).to.be.revertedWith("Contract paused");

      // Even reading should be restricted (depending on implementation)
      await worldSimulation.getWorldState(); // Should not revert for reads

      // Unpause
      await worldSimulation.setPaused(false);
      expect(await worldSimulation.paused()).to.be.false;

      // Operations should work again
      await expect(worldSimulation.connect(user1).applyEncryptedDecision(
        zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof
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
