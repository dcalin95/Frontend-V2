/// 📨 Contract Messages (ExecuteMsg, QueryMsg, InstantiateMsg)
/// 
/// Definește mesajele pe care contractul le poate primi și procesa
/// 
/// **Tipuri de mesaje:**
/// - `InstantiateMsg`: Inițializează contractul cu configurație
/// - `ExecuteMsg`: Mesaje pentru execuție (swap, update config, manage whitelist)
/// - `QueryMsg`: Mesaje pentru query (config, whitelist status, etc.)
/// 
/// @module Messages

use cosmwasm_std::Addr;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

/// 🎬 InstantiateMsg - Mesaj pentru inițializarea contractului
/// 
/// Acest mesaj este trimis când contractul este deployat pe blockchain
/// 
/// **Parametri:**
/// - `admin`: Adresa care va fi admin-ul contractului (poate modifica config)
/// - `fee_percentage`: Fee percentage în basis points (100 = 1%, 500 = 5%, etc.)
/// - `ota_only_mode`: Dacă este true, doar adresele din whitelist pot executa swap-uri
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct InstantiateMsg {
    /// Adresa admin-ului contractului
    pub admin: String,
    /// Fee percentage în basis points (0-10000, unde 100 = 1%)
    pub fee_percentage: u16,
    /// Dacă este true, doar OTA whitelist poate executa swap-uri
    pub ota_only_mode: bool,
}

/// ⚡ ExecuteMsg - Mesaje pentru execuție
/// 
/// Aceste mesaje modifică starea contractului sau execută acțiuni
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    /// 🔄 ExecuteSwap: Execută un swap între token-uri
    /// 
    /// **Viitor:** Va integra cu DEX-urile SEI (Astroport, Phoenix, Levana) pentru swap real
    /// **Acum:** Logică dummy care validează input-urile dar nu execută swap real
    /// 
    /// **Parametri:**
    /// - `token_in`: Adresa token-ului de intrare (native SEI sau CW-20)
    /// - `token_out`: Adresa token-ului de ieșire (native SEI sau CW-20)
    /// - `amount_in`: Cantitatea de token_in
    /// - `min_amount_out`: Cantitatea minimă de token_out (slippage protection)
    /// - `dex_address`: (Opțional) Adresa DEX-ului pentru swap (viitor: multi-DEX routing)
    ExecuteSwap {
        token_in: String,
        token_out: String,
        amount_in: String,
        min_amount_out: String,
        dex_address: Option<String>,
    },

    /// ⚙️ UpdateConfig: Actualizează configurația contractului (doar admin)
    /// 
    /// Permite admin-ului să modifice fee percentage sau OTA-only mode
    UpdateConfig {
        fee_percentage: Option<u16>,
        ota_only_mode: Option<bool>,
    },

    /// ✅ AddToOTAWhitelist: Adaugă o adresă în OTA whitelist (doar admin)
    /// 
    /// Util pentru a autoriza adrese OTA să execute swap-uri în `ota_only_mode`
    AddToOTAWhitelist {
        address: String,
    },

    /// ❌ RemoveFromOTAWhitelist: Elimină o adresă din OTA whitelist (doar admin)
    RemoveFromOTAWhitelist {
        address: String,
    },
}

/// 🔍 QueryMsg - Mesaje pentru query (read-only)
/// 
/// Aceste mesaje nu modifică starea contractului, doar returnează informații
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    /// 📋 Config: Returnează configurația contractului
    Config {},

    /// ✅ IsWhitelisted: Verifică dacă o adresă este în OTA whitelist
    IsWhitelisted {
        address: String,
    },
}

/// 📤 Response Types pentru Query-uri

/// Răspuns pentru QueryMsg::Config
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct ConfigResponse {
    pub admin: String,
    pub fee_percentage: u16,
    pub ota_only_mode: bool,
    pub dex_addresses: Vec<String>,
}

/// Răspuns pentru QueryMsg::IsWhitelisted
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct WhitelistStatusResponse {
    pub address: String,
    pub is_whitelisted: bool,
}
