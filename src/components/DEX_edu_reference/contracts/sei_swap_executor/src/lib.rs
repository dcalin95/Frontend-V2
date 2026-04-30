/// 🚀 SEISwapExecutor - Smart Contract pentru Swap Execution pe SEI Network
/// 
/// Acest contract este un executor pentru swap-uri pe SEI Network, compatibil cu CosmWasm.
/// Este proiectat să fie integrat cu BitSwapDEX și OTA (On-Token-Agent) AI Logic.
/// 
/// **Caracteristici:**
/// - ExecuteSwap: Execută swap-uri între token-uri native și CW-20 pe SEI
/// - OTA Integration: Control acces doar pentru OTA AI (whitelist mode)
/// - Config Management: Admin poate actualiza config-ul (fee %, OTA flag, etc.)
/// - Modular Design: Structură curată și ușor de extins
/// 
/// **Viitor Development:**
/// - Integration cu DEX-urile SEI (Astroport, Phoenix, Levana)
/// - Real swap logic cu slippage protection
/// - Multi-DEX routing pentru best price
/// - OTA AI strategy execution
/// 
/// @module SEISwapExecutor

pub mod contract;
pub mod msg;
pub mod state;
pub mod error;

// Re-export pentru a fi ușor de importat
pub use contract::{
    instantiate, execute, query
};
pub use msg::{
    InstantiateMsg, ExecuteMsg, QueryMsg
};
pub use error::ContractError;

#[cfg(test)]
mod tests;
