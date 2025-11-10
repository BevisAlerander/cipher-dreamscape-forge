import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { WorldSimulation, WorldSimulation__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("WorldSimulation")) as WorldSimulation__factory;
  const worldSimulationContract = (await factory.deploy()) as WorldSimulation;
  const worldSimulationContractAddress = await worldSimulationContract.getAddress();

  return { worldSimulationContract, worldSimulationContractAddress };
}

describe("WorldSimulation (local FHEVM mock)", function () {
  let signers: Signers;
  let worldSimulationContract: WorldSimulation;
  let worldSimulationContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1] };
  });

  beforeEach(async function () {
    // Local unit tests only make sense against the FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ worldSimulationContract, worldSimulationContractAddress } = await deployFixture());
  });

  it("should start with zeroed world KPIs and decision count", async function () {
    const [encEvolution, encStability, encInnovation, encMystery] =
      await worldSimulationContract.getWorldState();
    const encDecisions = await worldSimulationContract.getDecisionsCount();

    const evolution = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encEvolution,
      worldSimulationContractAddress,
      signers.alice,
    );
    const stability = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encStability,
      worldSimulationContractAddress,
      signers.alice,
    );
    const innovation = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encInnovation,
      worldSimulationContractAddress,
      signers.alice,
    );
    const mystery = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encMystery,
      worldSimulationContractAddress,
      signers.alice,
    );
    const decisionsCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encDecisions,
      worldSimulationContractAddress,
      signers.alice,
    );

    expect(evolution).to.eq(0);
    expect(stability).to.eq(0);
    expect(innovation).to.eq(0);
    expect(mystery).to.eq(0);
    expect(decisionsCount).to.eq(0);
  });

  it("should aggregate encrypted decision deltas into world KPIs", async function () {
    // Cleartext deltas as the frontend would compute them from the UI
    const clearEvolutionDelta = 5;
    const clearStabilityDelta = -2;
    const clearInnovationDelta = 7;
    const clearMysteryDelta = 3;

    // Encrypt four euint32 deltas in a single input bundle
    const encryptedInput = await fhevm
      .createEncryptedInput(worldSimulationContractAddress, signers.alice.address)
      .add32(clearEvolutionDelta)
      .add32(clearStabilityDelta)
      .add32(clearInnovationDelta)
      .add32(clearMysteryDelta)
      .encrypt();

    const tx = await worldSimulationContract
      .connect(signers.alice)
      .applyEncryptedDecision(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.handles[3],
        encryptedInput.inputProof,
      );
    await tx.wait();

    const [encEvolution, encStability, encInnovation, encMystery] =
      await worldSimulationContract.getWorldState();
    const encDecisions = await worldSimulationContract.getDecisionsCount();

    const evolution = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encEvolution,
      worldSimulationContractAddress,
      signers.alice,
    );
    const stability = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encStability,
      worldSimulationContractAddress,
      signers.alice,
    );
    const innovation = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encInnovation,
      worldSimulationContractAddress,
      signers.alice,
    );
    const mystery = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encMystery,
      worldSimulationContractAddress,
      signers.alice,
    );
    const decisionsCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encDecisions,
      worldSimulationContractAddress,
      signers.alice,
    );

    expect(evolution).to.eq(clearEvolutionDelta);
    expect(stability).to.eq(clearStabilityDelta);
    expect(innovation).to.eq(clearInnovationDelta);
    expect(mystery).to.eq(clearMysteryDelta);
    expect(decisionsCount).to.eq(1);
  });
}
