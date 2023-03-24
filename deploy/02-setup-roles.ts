import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { VOODOO_MULTI_REWARD } from "../helper-hardhat-config";
import { ethers } from "hardhat";
import { getContractAddress } from "ethers/lib/utils";
import { readContractAddress } from "../utils/helper-functions";

const setupRoles: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy, log } = deployments;
  const { deployer, operator, updater } = await getNamedAccounts();

  log(`\t Setting up role for operator`);

  const address = await readContractAddress(VOODOO_MULTI_REWARD);
  log(`\t deployed contract address ${address}`);
  const multiToken = await ethers.getContract(VOODOO_MULTI_REWARD);

  const operatorRole = await multiToken.OPERATOR_ROLE();
  const tokenUpdaterRole = await multiToken.UPDATE_TOKEN_ROLE();

  log(`\t Update operator role...`);
  const operatorTx = await multiToken.grantRole(operatorRole, operator);
  await operatorTx.wait(1);

  log(`\t Update Token role`);
  const updateTokenTx = await multiToken.grantRole(tokenUpdaterRole, updater);
  await updateTokenTx.wait(1);
};

export default setupRoles;
setupRoles.tags = ["all", "setup"];
