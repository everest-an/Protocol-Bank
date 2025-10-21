import { ethers } from 'ethers';

// ENS Resolver Utility for Protocol Bank
// Supports resolving .eth names to addresses and addresses to ENS names

const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

/**
 * Resolve ENS name to Ethereum address
 * @param {string} ensName - ENS name (e.g., "vitalik.eth")
 * @param {object} provider - ethers provider
 * @returns {Promise<string|null>} - Ethereum address or null if not found
 */
export async function resolveENSName(ensName, provider) {
  try {
    if (!ensName || !ensName.endsWith('.eth')) {
      return null;
    }

    // Use provider's built-in ENS resolution
    const address = await provider.resolveName(ensName);
    return address;
  } catch (error) {
    // console.error('Error resolving ENS name:', error);
    return null;
  }
}

/**
 * Reverse resolve Ethereum address to ENS name
 * @param {string} address - Ethereum address
 * @param {object} provider - ethers provider
 * @returns {Promise<string|null>} - ENS name or null if not found
 */
export async function reverseResolveENS(address, provider) {
  try {
    if (!address || !ethers.isAddress(address)) {
      return null;
    }

    // Use provider's built-in reverse ENS resolution
    const ensName = await provider.lookupAddress(address);
    return ensName;
  } catch (error) {
    // console.error('Error reverse resolving ENS:', error);
    return null;
  }
}

/**
 * Check if a string is a valid ENS name
 * @param {string} name - String to check
 * @returns {boolean} - True if valid ENS name
 */
export function isValidENSName(name) {
  if (!name || typeof name !== 'string') return false;
  
  // Basic ENS name validation
  const ensRegex = /^[a-z0-9-]+\.eth$/i;
  return ensRegex.test(name);
}

/**
 * Check if a string is a valid Ethereum address
 * @param {string} address - String to check
 * @returns {boolean} - True if valid address
 */
export function isValidAddress(address) {
  return ethers.isAddress(address);
}

/**
 * Resolve ENS name or return address as-is
 * @param {string} input - ENS name or Ethereum address
 * @param {object} provider - ethers provider
 * @returns {Promise<string|null>} - Ethereum address or null
 */
export async function resolveAddressOrENS(input, provider) {
  if (!input) return null;

  // If it's already a valid address, return it
  if (isValidAddress(input)) {
    return input;
  }

  // If it's an ENS name, resolve it
  if (isValidENSName(input)) {
    return await resolveENSName(input, provider);
  }

  return null;
}

/**
 * Format address with ENS name if available
 * @param {string} address - Ethereum address
 * @param {object} provider - ethers provider
 * @returns {Promise<string>} - Formatted string (ENS name or shortened address)
 */
export async function formatAddressWithENS(address, provider) {
  if (!address || !isValidAddress(address)) {
    return 'Invalid Address';
  }

  try {
    const ensName = await reverseResolveENS(address, provider);
    if (ensName) {
      return ensName;
    }
  } catch (error) {
    // console.error('Error formatting address with ENS:', error);
  }

  // Fallback to shortened address
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Batch resolve multiple ENS names
 * @param {string[]} ensNames - Array of ENS names
 * @param {object} provider - ethers provider
 * @returns {Promise<Object>} - Map of ENS names to addresses
 */
export async function batchResolveENS(ensNames, provider) {
  const results = {};
  
  await Promise.all(
    ensNames.map(async (name) => {
      const address = await resolveENSName(name, provider);
      if (address) {
        results[name] = address;
      }
    })
  );

  return results;
}

/**
 * Batch reverse resolve multiple addresses
 * @param {string[]} addresses - Array of Ethereum addresses
 * @param {object} provider - ethers provider
 * @returns {Promise<Object>} - Map of addresses to ENS names
 */
export async function batchReverseResolveENS(addresses, provider) {
  const results = {};
  
  await Promise.all(
    addresses.map(async (address) => {
      const ensName = await reverseResolveENS(address, provider);
      if (ensName) {
        results[address] = ensName;
      }
    })
  );

  return results;
}

/**
 * Get ENS avatar URL
 * @param {string} ensName - ENS name
 * @param {object} provider - ethers provider
 * @returns {Promise<string|null>} - Avatar URL or null
 */
export async function getENSAvatar(ensName, provider) {
  try {
    if (!isValidENSName(ensName)) {
      return null;
    }

    const resolver = await provider.getResolver(ensName);
    if (!resolver) {
      return null;
    }

    const avatar = await resolver.getText('avatar');
    return avatar;
  } catch (error) {
    // console.error('Error getting ENS avatar:', error);
    return null;
  }
}

/**
 * Get ENS text record
 * @param {string} ensName - ENS name
 * @param {string} key - Text record key (e.g., 'email', 'url', 'description')
 * @param {object} provider - ethers provider
 * @returns {Promise<string|null>} - Text record value or null
 */
export async function getENSTextRecord(ensName, key, provider) {
  try {
    if (!isValidENSName(ensName)) {
      return null;
    }

    const resolver = await provider.getResolver(ensName);
    if (!resolver) {
      return null;
    }

    const value = await resolver.getText(key);
    return value;
  } catch (error) {
    // console.error(`Error getting ENS text record '${key}':`, error);
    return null;
  }
}

