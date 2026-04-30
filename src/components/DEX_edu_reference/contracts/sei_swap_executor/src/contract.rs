/// 🎯 Contract Implementation - Main Logic
/// 
/// Implementează logica principală a contractului:
/// - `instantiate`: Inițializează contractul
/// - `execute`: Procesează ExecuteMsg-urile
/// - `query`: Procesează QueryMsg-urile
/// 
/// **Architecture:**
/// - Modular: Logica este separată în funcții pentru fiecare acțiune
/// - Security: Verificări de autorizare și validare pentru toate acțiunile
/// - Future-ready: Structură pregătită pentru integration cu DEX-urile SEI
/// 
/// @module Contract

use cosmwasm_std::{
    entry_point, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Binary, Addr, Decimal,
};
use crate::error::ContractError;
use crate::msg::{InstantiateMsg, ExecuteMsg, QueryMsg, ConfigResponse, WhitelistStatusResponse};
use crate::state::{Config, get_config, save_config, is_whitelisted, add_to_whitelist, remove_from_whitelist};

/// 🎬 Instantiate - Inițializează contractul
/// 
/// Creează configurația inițială a contractului și setează admin-ul
#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    // Validare fee percentage (trebuie să fie între 0 și 10000 = 0-100%)
    if msg.fee_percentage > 10000 {
        return Err(ContractError::InvalidFeePercentage {});
    }

    // Validare și conversie admin address
    let admin = deps.api.addr_validate(&msg.admin)?;

    // Creează config inițial
    let config = Config {
        admin: admin.clone(),
        fee_percentage: msg.fee_percentage,
        ota_only_mode: msg.ota_only_mode,
        dex_addresses: vec![], // Viitor: va conține adresele DEX-urilor SEI
    };

    // Salvează config în storage
    save_config(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("admin", admin.to_string())
        .add_attribute("fee_percentage", msg.fee_percentage.to_string())
        .add_attribute("ota_only_mode", msg.ota_only_mode.to_string()))
}

/// ⚡ Execute - Procesează mesajele de execuție
/// 
/// Routează ExecuteMsg-urile către funcțiile corespunzătoare
#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::ExecuteSwap {
            token_in,
            token_out,
            amount_in,
            min_amount_out,
            dex_address: _,
        } => execute_swap(deps, env, info, token_in, token_out, amount_in, min_amount_out),
        
        ExecuteMsg::UpdateConfig {
            fee_percentage,
            ota_only_mode,
        } => execute_update_config(deps, info, fee_percentage, ota_only_mode),
        
        ExecuteMsg::AddToOTAWhitelist { address } => execute_add_to_whitelist(deps, info, address),
        
        ExecuteMsg::RemoveFromOTAWhitelist { address } => execute_remove_from_whitelist(deps, info, address),
    }
}

/// 🔄 execute_swap - Execută swap logic (dummy implementation)
/// 
/// **Acum:** Validează input-urile și returnează success (nu execută swap real)
/// **Viitor:** Va integra cu DEX-urile SEI (Astroport, Phoenix, Levana) pentru swap real
/// 
/// **Security Checks:**
/// - Verifică dacă OTA-only mode este activat și dacă sender-ul este whitelisted
/// - Validează token addresses
/// - Validează amount-uri (trebuie să fie > 0)
fn execute_swap(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    token_in: String,
    token_out: String,
    amount_in: String,
    min_amount_out: String,
) -> Result<Response, ContractError> {
    let config = get_config(deps.storage)?;

    // Verificare OTA-only mode
    if config.ota_only_mode {
        if !is_whitelisted(deps.storage, &info.sender) {
            return Err(ContractError::OTAModeOnly {});
        }
    }

    // Validare token addresses (basic validation)
    if token_in.is_empty() || token_out.is_empty() {
        return Err(ContractError::InvalidConfig {
            msg: "Token addresses cannot be empty".to_string(),
        });
    }

    // Validare amounts (trebuie să fie > 0)
    // Note: În implementarea reală, ar trebui să parsam string-urile în Uint128 și să validăm
    if amount_in.is_empty() || min_amount_out.is_empty() {
        return Err(ContractError::InvalidConfig {
            msg: "Amounts cannot be empty".to_string(),
        });
    }

    // TODO: Viitor - Integration cu DEX-urile SEI
    // 1. Determină DEX-ul cel mai bun pentru swap (preț + slippage)
    // 2. Execută swap prin intermediul DEX-ului
    // 3. Calculează și colectează fee-ul
    // 4. Returnează token-urile rezultate către user

    Ok(Response::new()
        .add_attribute("action", "execute_swap")
        .add_attribute("token_in", token_in)
        .add_attribute("token_out", token_out)
        .add_attribute("amount_in", amount_in)
        .add_attribute("min_amount_out", min_amount_out)
        .add_attribute("status", "success_dummy"))
}

/// ⚙️ execute_update_config - Actualizează configurația (doar admin)
fn execute_update_config(
    deps: DepsMut,
    info: MessageInfo,
    fee_percentage: Option<u16>,
    ota_only_mode: Option<bool>,
) -> Result<Response, ContractError> {
    let mut config = get_config(deps.storage)?;

    // Verificare autorizare: doar admin poate actualiza config
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }

    // Actualizare fee_percentage dacă este furnizat
    if let Some(fee) = fee_percentage {
        if fee > 10000 {
            return Err(ContractError::InvalidFeePercentage {});
        }
        config.fee_percentage = fee;
    }

    // Actualizare ota_only_mode dacă este furnizat
    if let Some(ota_mode) = ota_only_mode {
        config.ota_only_mode = ota_mode;
    }

    // Salvează config actualizat
    save_config(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("action", "update_config")
        .add_attribute("fee_percentage", config.fee_percentage.to_string())
        .add_attribute("ota_only_mode", config.ota_only_mode.to_string()))
}

/// ✅ execute_add_to_whitelist - Adaugă adresă în OTA whitelist (doar admin)
fn execute_add_to_whitelist(
    deps: DepsMut,
    info: MessageInfo,
    address: String,
) -> Result<Response, ContractError> {
    let config = get_config(deps.storage)?;

    // Verificare autorizare: doar admin poate adăuga în whitelist
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }

    // Validare și conversie address
    let addr = deps.api.addr_validate(&address)?;

    // Adaugă în whitelist
    add_to_whitelist(deps.storage, &addr)?;

    Ok(Response::new()
        .add_attribute("action", "add_to_ota_whitelist")
        .add_attribute("address", address))
}

/// ❌ execute_remove_from_whitelist - Elimină adresă din OTA whitelist (doar admin)
fn execute_remove_from_whitelist(
    deps: DepsMut,
    info: MessageInfo,
    address: String,
) -> Result<Response, ContractError> {
    let config = get_config(deps.storage)?;

    // Verificare autorizare: doar admin poate elimina din whitelist
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }

    // Validare și conversie address
    let addr = deps.api.addr_validate(&address)?;

    // Elimină din whitelist
    remove_from_whitelist(deps.storage, &addr)?;

    Ok(Response::new()
        .add_attribute("action", "remove_from_ota_whitelist")
        .add_attribute("address", address))
}

/// 🔍 Query - Procesează mesajele de query (read-only)
#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => {
            let config = get_config(deps.storage)?;
            let response = ConfigResponse {
                admin: config.admin.to_string(),
                fee_percentage: config.fee_percentage,
                ota_only_mode: config.ota_only_mode,
                dex_addresses: config.dex_addresses.iter().map(|a| a.to_string()).collect(),
            };
            cosmwasm_std::to_json_binary(&response)
        }
        
        QueryMsg::IsWhitelisted { address } => {
            let addr = deps.api.addr_validate(&address)?;
            let is_whitelisted_status = is_whitelisted(deps.storage, &addr);
            let response = WhitelistStatusResponse {
                address,
                is_whitelisted: is_whitelisted_status,
            };
            cosmwasm_std::to_json_binary(&response)
        }
    }
}
