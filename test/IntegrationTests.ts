import { expect } from "chai";
import { ethers } from "hardhat";
import { WorldSimulation } from "../typechain-types";

describe("WorldSimulation Integration Tests", function () {
  let worldSimulation: WorldSimulation;
  let owner: any;
  let authorizedUser: any;
  let unauthorizedUser: any;

  beforeEach(async function () {
    [owner, authorizedUser, unauthorizedUser] = await ethers.getSigners();

    const WorldSimulation = await ethers.getContractFactory("WorldSimulation");
    worldSimulation = await WorldSimulation.deploy();
    await worldSimulation.waitForDeployment();

    // Authorize a user
    await worldSimulation.setAuthorized(authorizedUser.address, true);
  });

  describe("Access Control", function () {
    it("Should allow owner to apply decisions", async function () {
      // This test verifies the access control fix
      const zeroHandle = ethers.ZeroHash;
      const emptyProof = "0x";

      await expect(worldSimulation.connect(owner).applyEncryptedDecision(
        zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof
      )).to.not.be.reverted;
    });

    it("Should allow authorized users to apply decisions", async function () {
      const zeroHandle = ethers.ZeroHash;
      const emptyProof = "0x";

      await expect(worldSimulation.connect(authorizedUser).applyEncryptedDecision(
        zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof
      )).to.not.be.reverted;
    });

    it("Should reject unauthorized users", async function () {
      const zeroHandle = ethers.ZeroHash;
      const emptyProof = "0x";

      await expect(worldSimulation.connect(unauthorizedUser).applyEncryptedDecision(
        zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof
      )).to.be.revertedWith("Not authorized");
    });
  });

  describe("Event Emission", function () {
    it("Should emit DecisionCountUpdated with indexed sender", async function () {
      const zeroHandle = ethers.ZeroHash;
      const emptyProof = "0x";

      await expect(worldSimulation.connect(owner).applyEncryptedDecision(
        zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof
      )).to.emit(worldSimulation, "DecisionCountUpdated").withArgs(owner.address, 0, 1);
    });
  });

  describe("Emergency Controls", function () {
    it("Should allow pausing and unpausing", async function () {
      // Pause contract
      await worldSimulation.setPaused(true);
      expect(await worldSimulation.paused()).to.be.true;

      // Try to apply decision while paused
      const zeroHandle = ethers.ZeroHash;
      const emptyProof = "0x";
      await expect(worldSimulation.applyEncryptedDecision(
        zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof
      )).to.be.revertedWith("Contract paused");

      // Unpause
      await worldSimulation.setPaused(false);
      expect(await worldSimulation.paused()).to.be.false;

      // Should work now
      await expect(worldSimulation.applyEncryptedDecision(
        zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof
      )).to.not.be.reverted;
    });
  });
});
