/// ⚠️ Contract Error Types
/// 
/// Definește tipurile de erori care pot apărea în contract
/// 
/// @module ContractError

use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized: Only admin can perform this action")]
    Unauthorized {},

    #[error("OTA-only mode: Only whitelisted addresses can execute swaps")]
    OTAModeOnly {},

    #[error("Address not whitelisted: {address}")]
    NotWhitelisted { address: String },

    #[error("Invalid configuration: {msg}")]
    InvalidConfig { msg: String },

    #[error("Swap execution failed: {reason}")]
    SwapFailed { reason: String },

    #[error("Invalid fee percentage: must be between 0 and 10000 (0-100%)")]
    InvalidFeePercentage {},
}
