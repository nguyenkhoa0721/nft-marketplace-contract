import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { mnemonic } from "./secrets";

const config: HardhatUserConfig = {
    solidity: "0.8.9",
    defaultNetwork: "localhost",
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545",
        },
        hardhat: {},
        testnet: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            gasPrice: 20000000000,
            accounts: { mnemonic: mnemonic },
        },
        mainnet: {
            url: "https://bsc-dataseed.binance.org/",
            chainId: 56,
            gasPrice: 20000000000,
            accounts: { mnemonic: mnemonic },
        },
    },
};

export default config;
