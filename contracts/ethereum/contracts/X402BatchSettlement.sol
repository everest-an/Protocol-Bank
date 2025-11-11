// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title X402 Batch Settlement Contract
 * @notice Batch settlement for X402 payment authorizations using EIP-3009
 * @dev Aggregates multiple transferWithAuthorization calls to save gas
 * 
 * Based on:
 * - X402 Open Payment Protocol (https://x402.org)
 * - EIP-3009: Transfer With Authorization (https://eips.ethereum.org/EIPS/eip-3009)
 * 
 * @author Protocol Bank Team
 */

/**
 * @dev Interface for USDC (or any EIP-3009 compatible token)
 */
interface IEIP3009 {
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function authorizationState(
        address authorizer,
        bytes32 nonce
    ) external view returns (bool);
}

/**
 * @title X402BatchSettlement
 * @notice Batch multiple EIP-3009 transfers in a single transaction
 */
contract X402BatchSettlement {
    // Struct to hold transfer authorization data
    struct TransferAuthorization {
        address from;
        address to;
        uint256 value;
        uint256 validAfter;
        uint256 validBefore;
        bytes32 nonce;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // Token contract (USDC on Base)
    IEIP3009 public immutable token;

    // Events
    event BatchTransferExecuted(
        uint256 indexed batchId,
        uint256 paymentCount,
        uint256 totalAmount,
        address indexed executor
    );

    event TransferFailed(
        uint256 indexed batchId,
        uint256 indexed index,
        address from,
        address to,
        uint256 value,
        string reason
    );

    // Errors
    error EmptyBatch();
    error TransferReverted(uint256 index, string reason);

    // Batch counter
    uint256 public batchCounter;

    /**
     * @notice Constructor
     * @param _token Address of the EIP-3009 compatible token (e.g., USDC)
     */
    constructor(address _token) {
        require(_token != address(0), "Invalid token address");
        token = IEIP3009(_token);
    }

    /**
     * @notice Execute batch transfer with authorization
     * @dev Processes multiple transferWithAuthorization calls in a single transaction
     * 
     * @param authorizations Array of transfer authorizations
     * 
     * @return batchId The ID of this batch
     * @return successCount Number of successful transfers
     */
    function batchTransferWithAuthorization(
        TransferAuthorization[] calldata authorizations
    ) external returns (uint256 batchId, uint256 successCount) {
        uint256 length = authorizations.length;
        if (length == 0) revert EmptyBatch();

        // Increment batch counter
        batchId = ++batchCounter;
        uint256 totalAmount = 0;
        successCount = 0;

        // Execute each transfer
        for (uint256 i = 0; i < length; i++) {
            TransferAuthorization calldata auth = authorizations[i];
            
            try token.transferWithAuthorization(
                auth.from,
                auth.to,
                auth.value,
                auth.validAfter,
                auth.validBefore,
                auth.nonce,
                auth.v,
                auth.r,
                auth.s
            ) {
                totalAmount += auth.value;
                successCount++;
            } catch Error(string memory reason) {
                emit TransferFailed(
                    batchId,
                    i,
                    auth.from,
                    auth.to,
                    auth.value,
                    reason
                );
            } catch (bytes memory /*lowLevelData*/) {
                emit TransferFailed(
                    batchId,
                    i,
                    auth.from,
                    auth.to,
                    auth.value,
                    "Low-level error"
                );
            }
        }

        emit BatchTransferExecuted(
            batchId,
            successCount,
            totalAmount,
            msg.sender
        );

        return (batchId, successCount);
    }

    /**
     * @notice Execute batch transfer with authorization (strict mode)
     * @dev Reverts if any transfer fails
     * 
     * @param authorizations Array of transfer authorizations
     * 
     * @return batchId The ID of this batch
     */
    function batchTransferWithAuthorizationStrict(
        TransferAuthorization[] calldata authorizations
    ) external returns (uint256 batchId) {
        uint256 length = authorizations.length;
        if (length == 0) revert EmptyBatch();

        // Increment batch counter
        batchId = ++batchCounter;
        uint256 totalAmount = 0;

        // Execute each transfer (strict mode - revert on any failure)
        for (uint256 i = 0; i < length; i++) {
            TransferAuthorization calldata auth = authorizations[i];
            
            token.transferWithAuthorization(
                auth.from,
                auth.to,
                auth.value,
                auth.validAfter,
                auth.validBefore,
                auth.nonce,
                auth.v,
                auth.r,
                auth.s
            );
            totalAmount += auth.value;
        }

        emit BatchTransferExecuted(
            batchId,
            length,
            totalAmount,
            msg.sender
        );

        return batchId;
    }

    /**
     * @notice Check if a nonce has been used
     * @param authorizer Authorizer's address
     * @param nonce Nonce to check
     * @return True if the nonce has been used
     */
    function isNonceUsed(
        address authorizer,
        bytes32 nonce
    ) external view returns (bool) {
        return token.authorizationState(authorizer, nonce);
    }

    /**
     * @notice Get token address
     * @return Address of the token contract
     */
    function getToken() external view returns (address) {
        return address(token);
    }

    /**
     * @notice Get current batch counter
     * @return Current batch counter value
     */
    function getBatchCounter() external view returns (uint256) {
        return batchCounter;
    }
}
