/// 📦 Contract State Management
/// 
/// Definește structurile de date pentru stocarea configurației și whitelist-ului
/// 
/// **Structuri:**
/// - `Config`: Configurația principală a contractului (admin, fee %, OTA flag, etc.)
/// - Whitelist pentru adrese OTA autorizate
/// 
/// @module State

use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

/// ⚙️ Contract Configuration
/// 
/// Stochează toate setările importante ale contractului:
/// - `admin`: Adresa admin-ului care poate modifica config-ul
/// - `fee_percentage`: Procentaj de fee (în basis points, 0-10000 = 0-100%)
/// - `ota_only_mode`: Dacă este activat, doar adresele din whitelist pot executa swap-uri
/// - `dex_addresses`: Viitor: Lista de adrese DEX-uri cu care putem interacționa (Astroport, Phoenix, etc.)
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Config {
    /// Adresa admin-ului contractului
    pub admin: Addr,
    /// Fee percentage în basis points (100 = 1%, 10000 = 100%)
    pub fee_percentage: u16,
    /// Dacă este true, doar OTA whitelist poate executa swap-uri
    pub ota_only_mode: bool,
    /// Viitor: Adresele DEX-urilor SEI (Astroport, Phoenix, Levana)
    /// Pentru acum: Empty vector
    pub dex_addresses: Vec<Addr>,
}

/// 🗄️ Storage Keys
/// 
/// Definește cheile de storage pentru contract
const CONFIG: Item<Config> = Item::new("config");

/// 📋 OTA Whitelist
/// 
/// Map-ul care stochează adresele autorizate pentru OTA execution
/// Key: Adresa wallet-ului OTA
/// Value: Timestamp când a fost adăugat în whitelist
const OTA_WHITELIST: Map<&Addr, u64> = Map::new("ota_whitelist");

/// 🔧 State Access Functions

/// Returnează configurația contractului
pub fn get_config(storage: &dyn cosmwasm_std::Storage) -> cosmwasm_std::StdResult<Config> {
    CONFIG.load(storage)
}

/// Salvează configurația contractului
pub fn save_config(storage: &mut dyn cosmwasm_std::Storage, config: &Config) -> cosmwasm_std::StdResult<()> {
    CONFIG.save(storage, config)
}

/// Verifică dacă o adresă este în OTA whitelist
pub fn is_whitelisted(storage: &dyn cosmwasm_std::Storage, address: &Addr) -> bool {
    OTA_WHITELIST.has(storage, address)
}

/// Adaugă o adresă în OTA whitelist
pub fn add_to_whitelist(
    storage: &mut dyn cosmwasm_std::Storage,
    address: &Addr,
) -> cosmwasm_std::StdResult<()> {
    OTA_WHITELIST.save(storage, address, &cosmwasm_std::Timestamp::seconds(0).seconds())
}

/// Elimină o adresă din OTA whitelist
pub fn remove_from_whitelist(
    storage: &mut dyn cosmwasm_std::Storage,
    address: &Addr,
) -> cosmwasm_std::StdResult<()> {
    OTA_WHITELIST.remove(storage, address);
    Ok(())
}
