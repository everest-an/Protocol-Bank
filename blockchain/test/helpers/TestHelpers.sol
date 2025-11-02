// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TestHelpers
 * @dev Helper functions and utilities for testing
 */
library TestHelpers {
    /**
     * @notice Generate a signature for testing
     * @dev This is a simplified version for testing purposes
     */
    function generateSignature(
        bytes32 dataHash,
        uint256 privateKey
    ) internal pure returns (bytes memory) {
        // In real tests, use vm.sign() from Foundry
        // This is just a placeholder
        return abi.encodePacked(dataHash, privateKey);
    }
    
    /**
     * @notice Calculate net position data hash
     */
    function calculateNetPositionHash(
        uint256 cycleId,
        address member,
        int256 amount
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(cycleId, member, amount));
    }
    
    /**
     * @notice Convert int256 to uint256 (absolute value)
     */
    function abs(int256 value) internal pure returns (uint256) {
        return value >= 0 ? uint256(value) : uint256(-value);
    }
}
