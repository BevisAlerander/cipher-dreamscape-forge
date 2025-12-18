import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { WorldSimulation } from "../typechain-types";

describe("WorldSimulation Integration Tests", function () {
  let worldSimulation: WorldSimulation;
  let worldSimulationAddress: string;
  let owner: any;
  let authorizedUser: any;
  let unauthorizedUser: any;

  beforeEach(async function () {
    [owner, authorizedUser, unauthorizedUser] = await ethers.getSigners();

    const WorldSimulation = await ethers.getContractFactory("WorldSimulation");
    worldSimulation = await WorldSimulation.deploy();
    await worldSimulation.waitForDeployment();
    worldSimulationAddress = await worldSimulation.getAddress();

    // Authorize a user
    await worldSimulation.setAuthorized(authorizedUser.address, true);
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

  describe("Access Control", function () {
    it("Should allow owner to apply decisions", async function () {
      if (!fhevm.isMock) {
        this.skip();
        return;
      }

      const encrypted = await createZeroEncryptedInput(owner);
      if (!encrypted) {
        this.skip();
        return;
      }

      await expect(worldSimulation.connect(owner).applyEncryptedDecision(
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.handles[3],
        encrypted.inputProof
      )).to.not.be.reverted;
    });

    it("Should allow authorized users to apply decisions", async function () {
      if (!fhevm.isMock) {
        this.skip();
        return;
      }

      const encrypted = await createZeroEncryptedInput(authorizedUser);
      if (!encrypted) {
        this.skip();
        return;
      }

      await expect(worldSimulation.connect(authorizedUser).applyEncryptedDecision(
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.handles[3],
        encrypted.inputProof
      )).to.not.be.reverted;
    });

    it("Should reject unauthorized users", async function () {
      if (!fhevm.isMock) {
        this.skip();
        return;
      }

      const encrypted = await createZeroEncryptedInput(unauthorizedUser);
      if (!encrypted) {
        this.skip();
        return;
      }

      await expect(worldSimulation.connect(unauthorizedUser).applyEncryptedDecision(
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.handles[3],
        encrypted.inputProof
      )).to.be.revertedWith("Not authorized");
    });
  });

  describe("Event Emission", function () {
    it("Should emit DecisionApplied with sender and timestamp", async function () {
      if (!fhevm.isMock) {
        this.skip();
        return;
      }

      const encrypted = await createZeroEncryptedInput(owner);
      if (!encrypted) {
        this.skip();
        return;
      }

      const tx = await worldSimulation.connect(owner).applyEncryptedDecision(
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.handles[3],
        encrypted.inputProof
      );
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(worldSimulation, "DecisionApplied")
        .withArgs(owner.address, block!.timestamp);
    });
  });

  describe("Emergency Controls", function () {
    it("Should allow pausing and unpausing", async function () {
      if (!fhevm.isMock) {
        this.skip();
        return;
      }

      // Pause contract
      await worldSimulation.setPaused(true);
      expect(await worldSimulation.paused()).to.be.true;

      // Try to apply decision while paused
      const encrypted = await createZeroEncryptedInput(owner);
      if (!encrypted) {
        this.skip();
        return;
      }

      await expect(worldSimulation.connect(owner).applyEncryptedDecision(
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.handles[3],
        encrypted.inputProof
      )).to.be.revertedWith("Contract paused");

      // Unpause
      await worldSimulation.setPaused(false);
      expect(await worldSimulation.paused()).to.be.false;

      // Should work now
      await expect(worldSimulation.connect(owner).applyEncryptedDecision(
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.handles[3],
        encrypted.inputProof
      )).to.not.be.reverted;
    });
  });
});
