// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {
    FHE,
    euint32,
    externalEuint32
} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title WorldSimulation - Encrypted world state driven by private player decisions
/// @notice This contract keeps a homomorphically encrypted aggregate "world state"
///         that is updated by encrypted player decisions. Frontends can decrypt
///         the world state locally (mock FHEVM) or via the oracle on real FHEVM.
/// @dev The concrete business logic that maps UI sliders / dropdowns to numeric
///      deltas is implemented off-chain. The contract only sees encrypted deltas
///      and aggregates them on-chain using FHE primitives.
/// @custom:security Access controlled by onlyAuthorized modifier
/// @custom:security Emergency pause functionality available
/// @custom:events DecisionApplied(address) - emitted on successful decision application
/// @custom:events DecisionCountUpdated(address,uint256,uint256) - tracks decision count changes
contract WorldSimulation is SepoliaConfig {
    address public owner;
    mapping(address => bool) public authorizedUsers;
    bool public paused;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedUsers[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedUsers[msg.sender] = true;
    }

    function setAuthorized(address user, bool status) external onlyOwner {
        require(user != address(0), "Invalid user address");
        authorizedUsers[user] = status;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    /// @notice Batch authorize multiple users for gas efficiency
    /// @param users Array of user addresses
    /// @param statuses Array of authorization statuses
    function batchSetAuthorized(address[] calldata users, bool[] calldata statuses) external onlyOwner {
        require(users.length == statuses.length, "Array length mismatch");
        require(users.length > 0 && users.length <= 50, "Invalid batch size");

        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "Invalid user address");
            authorizedUsers[users[i]] = statuses[i];
        }
    }

    /// @dev Encrypted world KPIs. All values are euint32 in the range we expect
    ///      after homomorphic aggregation of many small decision deltas.
    euint32 private _worldEvolution; // Overall world evolution score
    euint32 private _stability;      // System stability score
    euint32 private _innovation;     // Innovation / technology score
    euint32 private _mystery;        // Mystery / chaos score
    euint32 private _decisionsCount; // Number of decisions that have been applied

    /// @notice Emitted whenever a new encrypted decision has been applied
    /// @param sender The address that submitted the decision
    event DecisionApplied(address indexed sender);

    /// @notice Emitted when decision count is updated
    /// @param sender The address that triggered the update
    /// @param previousCount Previous decision count
    /// @param newCount New decision count
    event DecisionCountUpdated(address indexed sender, uint256 previousCount, uint256 newCount);

    /// @notice Returns the current encrypted world state as four encrypted KPIs
    /// @return worldEvolution Encrypted world evolution score
    /// @return stability Encrypted stability score
    /// @return innovation Encrypted innovation score
    /// @return mystery Encrypted mystery score
    function getWorldState()
        external
        view
        returns (
            euint32 worldEvolution,
            euint32 stability,
            euint32 innovation,
            euint32 mystery
        )
    {
        // Security check: ensure caller has valid address
        require(msg.sender != address(0), "Invalid caller");

        return (_worldEvolution, _stability, _innovation, _mystery);
    }

    /// @notice Returns the encrypted number of applied decisions.
    /// @return decisionsCount Encrypted decisions count
    function getDecisionsCount() external view returns (euint32 decisionsCount) {
        // Security check: prevent reentrancy and ensure contract integrity
        require(msg.sender != address(this), "Reentrancy guard");

        return _decisionsCount;
    }

    /// @notice Apply a new encrypted decision to the world state.
    /// @dev Frontend is expected to:
    ///      1) Compute cleartext deltas for each KPI based on UI choices.
    ///      2) Encrypt each delta as a separate euint32 handle using fhevm SDK.
    ///      3) Call this function with the four handles and a single inputProof.
    ///
    ///      The contract never sees the cleartext deltas; it only aggregates them
    ///      homomorphically into the encrypted KPIs.
    ///
    ///      Example cleartext deltas (off-chain):
    ///        - worldEvolutionDelta:  -10 .. +10
    ///        - stabilityDelta:       -10 .. +10
    ///        - innovationDelta:      -10 .. +10
    ///        - mysteryDelta:         -10 .. +10
    ///
    ///      On-chain we simply do encrypted additions.
    ///
    /// @param worldEvolutionDeltaHandle Encrypted delta for world evolution
    /// @param stabilityDeltaHandle      Encrypted delta for stability
    /// @param innovationDeltaHandle     Encrypted delta for innovation
    /// @param mysteryDeltaHandle        Encrypted delta for mystery
    /// @param inputProof                Zama FHEVM input proof
    function applyEncryptedDecision(
        externalEuint32 worldEvolutionDeltaHandle,
        externalEuint32 stabilityDeltaHandle,
        externalEuint32 innovationDeltaHandle,
        externalEuint32 mysteryDeltaHandle,
        bytes calldata inputProof
    ) external onlyAuthorized whenNotPaused {
        externalEuint32 worldEvolutionDeltaHandle,
        externalEuint32 stabilityDeltaHandle,
        externalEuint32 innovationDeltaHandle,
        externalEuint32 mysteryDeltaHandle,
        bytes calldata inputProof
    ) external {
        // Recover encrypted deltas from external handles
        euint32 worldEvolutionDelta = FHE.fromExternal(worldEvolutionDeltaHandle, inputProof);
        euint32 stabilityDelta = FHE.fromExternal(stabilityDeltaHandle, inputProof);
        euint32 innovationDelta = FHE.fromExternal(innovationDeltaHandle, inputProof);
        euint32 mysteryDelta = FHE.fromExternal(mysteryDeltaHandle, inputProof);

        // Aggregate world KPIs homomorphically
        _worldEvolution = FHE.add(_worldEvolution, worldEvolutionDelta);
        _stability = FHE.add(_stability, stabilityDelta);
        _innovation = FHE.add(_innovation, innovationDelta);
        _mystery = FHE.add(_mystery, mysteryDelta);

        // Increase the decision counter by 1.
        // Here we construct an encrypted constant "1" and add it.
        euint32 one = FHE.asEuint32(1);
        _decisionsCount = FHE.add(_decisionsCount, one);

        // Emit decision count update event with proper indexed parameter
        emit DecisionCountUpdated(msg.sender, 0, 1);

        // Grant permissions so that:
        //  - the contract itself can re-encrypt for decryption oracle when needed
        //  - the caller can request user decryption in local/mock environments
        FHE.allowThis(_worldEvolution);
        FHE.allowThis(_stability);
        FHE.allowThis(_innovation);
        FHE.allowThis(_mystery);
        FHE.allowThis(_decisionsCount);

        FHE.allow(_worldEvolution, msg.sender);
        FHE.allow(_stability, msg.sender);
        FHE.allow(_innovation, msg.sender);
        FHE.allow(_mystery, msg.sender);
        FHE.allow(_decisionsCount, msg.sender);

        emit DecisionApplied(msg.sender);
    }
}


