// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC with EIP-3009 Support
 * @notice Mock USDC token implementing EIP-3009 transferWithAuthorization
 * @dev For testing X402 batch settlement on testnets
 * 
 * Based on:
 * - EIP-3009: Transfer With Authorization (https://eips.ethereum.org/EIPS/eip-3009)
 * - USDC implementation by Circle
 * 
 * @author Protocol Bank Team
 */
contract MockUSDC_EIP3009 is ERC20, Ownable {
    // EIP-712 Domain Separator
    bytes32 public DOMAIN_SEPARATOR;
    
    // EIP-3009 typehash
    bytes32 public constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH = keccak256(
        "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
    );
    
    // Authorization states (used nonces)
    mapping(address => mapping(bytes32 => bool)) private _authorizationStates;
    
    // Events
    event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
    event AuthorizationCanceled(address indexed authorizer, bytes32 indexed nonce);
    
    // Errors
    error AuthorizationAlreadyUsed(address authorizer, bytes32 nonce);
    error AuthorizationNotYetValid(uint256 validAfter, uint256 currentTime);
    error AuthorizationExpired(uint256 validBefore, uint256 currentTime);
    error InvalidSignature();
    
    constructor() ERC20("Mock USDC", "USDC") Ownable(msg.sender) {
        // Compute EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Mock USDC")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }
    
    /**
     * @notice Returns 6 decimals like real USDC
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    /**
     * @notice Mint tokens for testing (only owner)
     * @param to Recipient address
     * @param amount Amount to mint (in smallest unit, e.g., 1000000 = 1 USDC)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @notice Faucet for easy testing (anyone can mint)
     * @param amount Amount to mint
     */
    function faucet(uint256 amount) external {
        _mint(msg.sender, amount);
    }
    
    /**
     * @notice Check if an authorization has been used
     * @param authorizer Authorizer's address
     * @param nonce Nonce of the authorization
     * @return True if the nonce has been used
     */
    function authorizationState(
        address authorizer,
        bytes32 nonce
    ) external view returns (bool) {
        return _authorizationStates[authorizer][nonce];
    }
    
    /**
     * @notice Execute a transfer with authorization (EIP-3009)
     * @dev This is the core function for X402 batch settlement
     * 
     * @param from Payer's address
     * @param to Payee's address
     * @param value Amount to transfer
     * @param validAfter The time after which this is valid (unix timestamp)
     * @param validBefore The time before which this is valid (unix timestamp)
     * @param nonce Unique nonce
     * @param v ECDSA signature parameter
     * @param r ECDSA signature parameter
     * @param s ECDSA signature parameter
     */
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
    ) external {
        // Check if authorization has already been used
        if (_authorizationStates[from][nonce]) {
            revert AuthorizationAlreadyUsed(from, nonce);
        }
        
        // Check time validity
        if (block.timestamp < validAfter) {
            revert AuthorizationNotYetValid(validAfter, block.timestamp);
        }
        if (block.timestamp > validBefore) {
            revert AuthorizationExpired(validBefore, block.timestamp);
        }
        
        // Construct EIP-712 message digest
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\\x19\\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(
                    TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
                    from,
                    to,
                    value,
                    validAfter,
                    validBefore,
                    nonce
                ))
            )
        );
        
        // Recover signer from signature
        address recoveredAddress = ecrecover(digest, v, r, s);
        
        // Verify signature
        if (recoveredAddress == address(0) || recoveredAddress != from) {
            revert InvalidSignature();
        }
        
        // Mark authorization as used
        _authorizationStates[from][nonce] = true;
        emit AuthorizationUsed(from, nonce);
        
        // Execute transfer
        _transfer(from, to, value);
    }
    
    /**
     * @notice Cancel an authorization (before it's used)
     * @param authorizer Authorizer's address
     * @param nonce Nonce to cancel
     * @param v ECDSA signature parameter
     * @param r ECDSA signature parameter
     * @param s ECDSA signature parameter
     */
    function cancelAuthorization(
        address authorizer,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        // Check if already used
        if (_authorizationStates[authorizer][nonce]) {
            revert AuthorizationAlreadyUsed(authorizer, nonce);
        }
        
        // Verify signature (simplified - in production should use proper typehash)
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\\x19\\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(
                    keccak256("CancelAuthorization(address authorizer,bytes32 nonce)"),
                    authorizer,
                    nonce
                ))
            )
        );
        
        address recoveredAddress = ecrecover(digest, v, r, s);
        if (recoveredAddress == address(0) || recoveredAddress != authorizer) {
            revert InvalidSignature();
        }
        
        // Mark as used (cancelled)
        _authorizationStates[authorizer][nonce] = true;
        emit AuthorizationCanceled(authorizer, nonce);
    }
}
