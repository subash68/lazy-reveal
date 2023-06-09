import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  CUSTOM_1155_CONTRACT,
  VOODOO_MULTI_REWARD,
} from "../helper-hardhat-config";
import { ethers } from "hardhat";

const setupRoles: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments } = hre;
  const { log } = deployments;
  const { operator, updater } = await getNamedAccounts();

  log(`\t Setting up role for operators and token administrators.`);
  const multiToken = await ethers.getContract(VOODOO_MULTI_REWARD);
  const custom1155 = await ethers.getContract(CUSTOM_1155_CONTRACT);

  const operatorRole = await multiToken.OPERATOR_ROLE();
  const tokenUpdaterRole = await multiToken.UPDATE_TOKEN_ROLE();

  log(`\t Updating operator role.`);
  const operatorTx = await multiToken.grantRole(operatorRole, operator);
  await operatorTx.wait(1);

  log(`\t Updating token updater role.`);
  const updateTokenTx = await multiToken.grantRole(tokenUpdaterRole, updater);
  await updateTokenTx.wait(1);

  log(`\t Updating operator role for reward contract`);
  const rewardOperatorTx = await custom1155.grantRole(
    operatorRole,
    multiToken.address
  );
  await rewardOperatorTx.wait(1);
};

export default setupRoles;
setupRoles.tags = ["all", "setup"];
