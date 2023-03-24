import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { VOODOO_MULTI_REWARD } from "../helper-hardhat-config";
import { ethers } from "hardhat";

const deployNFT: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy, log } = deployments;
  const { deployer, operator } = await getNamedAccounts();

  log(`\t Setting up role for operator`);

  const multiToken = await ethers.getContract(VOODOO_MULTI_REWARD, deployer);

  const operatorRole = await multiToken.OPERATOR_ROLE();

  const operatorTx = await multiToken.grantRole(operatorRole, operator);
  await operatorTx.wait(1);
};

export default deployNFT;
deployNFT.tags = ["all", "contract"];
