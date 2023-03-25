import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  CONTRACT_NAME,
  CONTRACT_SYMBOL,
  CONTRACT_URI,
  CUSTOM_1155_CONTRACT,
  PRE_REVEAL_BASE_URI,
  PRE_REVEAL_METADATA,
  VOODOO_MULTI_REWARD,
  developmentChains,
  networkConfig,
} from "../helper-hardhat-config";

import verify, { writeContractAddress } from "../utils/helper-functions";

const deploy1155: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const config = {
    name: CONTRACT_NAME,
    symbol: CONTRACT_SYMBOL,
  };
  const voodooContract = await deploy(CUSTOM_1155_CONTRACT, {
    from: deployer,
    args: Object.values(config),
    log: true,
    waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
  });

  log(`\t NFT Collection contract Deployed at ${voodooContract.address}`);

  if (
    !developmentChains.includes(network.name) &&
    networkConfig[network.name].apiKey
  ) {
    // Add verification logic
    await verify(voodooContract.address, Object.values(config));
  }
  //   save contract address
  await writeContractAddress(VOODOO_MULTI_REWARD, voodooContract.address);
};

export default deploy1155;
deploy1155.tags = ["all", "custom1155"];
