import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, deployments, fhevm } from "hardhat";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import type { WorldSimulation } from "../types";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("WorldSimulationSepolia", function () {
  let signers: Signers;
  let world: WorldSimulation;
  let worldAddress: string;
  let step = 0;
  let steps = 0;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn("This test suite only runs on Sepolia FHEVM, not on the local mock");
      this.skip();
    }

    try {
      const deployment = await deployments.get("WorldSimulation");
      worldAddress = deployment.address;
      world = (await ethers.getContractAt(
        "WorldSimulation",
        deployment.address,
      )) as WorldSimulation;
    } catch (e) {
      (e as Error).message +=
        ". Call 'npx hardhat deploy --network sepolia' before running this test.";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("applies an encrypted decision on Sepolia and decrypts world state", async function () {
    steps = 10;
    this.timeout(4 * 40000);

    const deltas = {
      worldEvolutionDelta: 1,
      stabilityDelta: 2,
      innovationDelta: 3,
      mysteryDelta: 1,
    };

    progress("Encrypting decision deltas...");
    const encryptedInput = await fhevm
      .createEncryptedInput(worldAddress, signers.alice.address)
      .add32(deltas.worldEvolutionDelta)
      .add32(deltas.stabilityDelta)
      .add32(deltas.innovationDelta)
      .add32(deltas.mysteryDelta)
      .encrypt();

    progress("Calling WorldSimulation.applyEncryptedDecision(...)");
    const tx = await world
      .connect(signers.alice)
      .applyEncryptedDecision(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.handles[3],
        encryptedInput.inputProof,
      );
    await tx.wait();

    progress("Reading encrypted world state...");
    const [eWorldEvolution, eStability, eInnovation, eMystery] =
      await world.getWorldState();
    const eDecisions = await world.getDecisionsCount();

    progress("Decrypting world state via FHEVM userDecryptEuint...");
    const worldEvolution = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      eWorldEvolution,
      worldAddress,
      signers.alice,
    );
    const stability = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      eStability,
      worldAddress,
      signers.alice,
    );
    const innovation = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      eInnovation,
      worldAddress,
      signers.alice,
    );
    const mystery = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      eMystery,
      worldAddress,
      signers.alice,
    );
    const decisions = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      eDecisions,
      worldAddress,
      signers.alice,
    );

    progress("Asserting decrypted world state is consistent with deltas...");
    expect(worldEvolution).to.eq(BigInt(deltas.worldEvolutionDelta));
    expect(stability).to.eq(BigInt(deltas.stabilityDelta));
    expect(innovation).to.eq(BigInt(deltas.innovationDelta));
    expect(mystery).to.eq(BigInt(deltas.mysteryDelta));
    expect(decisions).to.eq(BigInt(1));
  });
});

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { WorldSimulation, WorldSimulation__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
};

describe("WorldSimulation (Sepolia wiring smoke test)", function () {
  let signers: Signers;
  let worldSimulationContract: WorldSimulation;
  let worldSimulationContractAddress: string;

  before(async function () {
    if (fhevm.isMock) {
      console.warn("This test suite is meant to run against Sepolia FHEVM, skipping on mock network");
      this.skip();
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1] };

    const factory = (await ethers.getContractFactory("WorldSimulation")) as WorldSimulation__factory;
    worldSimulationContract = (await factory.deploy()) as WorldSimulation;
    worldSimulationContractAddress = await worldSimulationContract.getAddress();
  });

  it("should accept an encrypted decision and expose decryptable KPIs", async function () {
    const clearEvolutionDelta = 1;
    const clearStabilityDelta = 0;
    const clearInnovationDelta = 2;
    const clearMysteryDelta = 0;

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

    const [encEvolution] = await worldSimulationContract.getWorldState();

    const evolution = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encEvolution,
      worldSimulationContractAddress,
      signers.alice,
    );

    expect(evolution).to.be.a("number");
  });
}


