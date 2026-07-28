from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    etherscan_api_key: str = ""
    etherscan_base_url: str = "https://api.etherscan.io/v2/api"
    default_chain_id: int = 1
    max_transfers: int = 250
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
