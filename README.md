### NFT Minting and lazy reveal features

Contracts are located in `contracts` directory. Test and deployment scripts are located in directories `tests` and `deploy` respectively. Contracts are deployed using `hardhat-deploy` tool chain, so it is mandatory to install all the required packages.
To install all the required packages run following command in project directory:

```
   $ yarn install
```

Follow instructions should be used to set environment variables for smoothly running the project.

Node providers should be set in following variables in `.env` file using

```
    GOERLI_RPC_URL=
    POLYGON_RPC_URL=
```

For automatically verify contracts to mainnet or testnet, set Etherscan or Polygonscan API key as per requirements.

> Please note automatic contract verification will not be triggered in local blockchain network.

```
    POLYGONSCAN_API_KEY=
    ETHERSCAN_API_KEY=
```

Base on requirement, we have to multiple accounts with various roles to interact with contract methods due to which various test accounts are added using their private key in `.env` file. Please add private keys of accounts you are willing to use.

```
    PRIVATE_KEY=
    OPERATOR_KEY=
    UPDATER_KEY=
    BUYER_KEY=
```

After all packages are successfully installed and environment variables are created, run the following command to deploy contracts to local blockchain network,

```
    $ npx hardhat deploy
```

Additionally, in order to check gas consumptions for tested methods, add `coinmarket cap` oracle services using following variable in `.env` file.

```
   COINMAKETCAP_API_KEY=
```

To runs unit tests for all the contracts written run following command

```
    $ npx hardhat test
```

Finally to deploy contracts to testnets (goerli or mumbai), run following command

```
    $ npx hardhat deploy --network goerli
        or
    $ npx hardhat deploy --network mumbai
```

Note: There are few scripts and tools written to make development and testing process easier.

1. `helper-hardhat-config.ts` contains all required constants and deployment configurations.
2. `utils/helper-functions.ts` contains contract auto-verification and deployed contracts tracking functions.
3. `utils/move-block.ts` contains local blockchain mining scripts.
4. `utils/move-time.ts` contains local blockchain time manipulation script.

> Please note moving blocks and time will not work on testnets or mainnet.
