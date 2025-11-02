///! MPC Wallet Library
///!
///! Production-grade MPC wallet infrastructure with post-quantum encryption

pub mod audit_log;
pub mod config_manager;
pub mod encryption;
pub mod encryption_v2;
pub mod hsm_integration;
pub mod metrics;
// pub mod mpc_keygen_complete; // Disabled due to API complexity
pub mod mpc_complete;
pub mod mpc_network;
pub mod mpc_protocol_impl;
pub mod policy_engine;
pub mod policy_engine_v2;
pub mod three_tier_demo;

// Re-exports
pub use audit_log::AuditLog;
pub use config_manager::ConfigManager;
pub use mpc_complete::MPCWalletSession;
pub use policy_engine_v2::PolicyEngine;
