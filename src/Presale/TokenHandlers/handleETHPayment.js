import { ethers } from "ethers";
import axios from "axios";
import { CONTRACTS } from "../../contract/contracts";

const API_ENDPOINT = process.env.REACT_APP_API_URL + "/transactions";

// Deprecated: ETH is processed via handleGenericPayment using Binance-Peg ETH (ERC20) on BSC Mainnet.
const handleETHPayment = async () => {
  throw new Error("ETH direct handler disabled. ETH is processed via generic ERC-20 flow.");
};

export default handleETHPayment;
