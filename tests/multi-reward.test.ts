import {
  POST_REVEAL_BASE_URI,
  PRE_REVEAL_BASE_URI,
  PRICE_PER_TOKEN,
  REVEAL_AFTER,
  VOODOO_MULTI_REWARD,
  developmentChains,
} from "../helper-hardhat-config";
import { VoodooMultiRewards } from "../typechain-types";
import { getNamedAccounts, deployments, ethers, network } from "hardhat";
import { expect } from "chai";
import { moveTime } from "../utils/move-time";
import { moveBlock } from "../utils/move-block";

describe("ERC721 mint and reveal", async () => {
  let collection: VoodooMultiRewards;

  beforeEach(async () => {
    await deployments.fixture(["all"]);
    collection = await ethers.getContract(VOODOO_MULTI_REWARD);
  });

  it("can verify owner of the contract", async () => {
    const { deployer } = await getNamedAccounts();
    await expect(await collection.owner()).to.be.equal(deployer);
  });

  it("can add new tokens and mint them before reveal", async () => {
    const { deployer } = await getNamedAccounts();
    await collection.addTokens(
      1,
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
      ""
    );
    const count = 1;
    const mintTx = await collection.mint(count, {
      from: deployer,
      value: await ethers.utils.parseEther(
        (PRICE_PER_TOKEN * count).toString()
      ),
    });
    const mintReceipt = await mintTx.wait(1);

    const tokenId =
      mintReceipt.events![mintReceipt.events!.length - 1].args!.tokenId;

    await expect(tokenId).to.be.equal(0);

    const totalSupply = await collection.totalSupply();
    await expect(totalSupply).to.be.equal(count);
  });

  it("can set base URI for contract", async () => {
    const { deployer } = await getNamedAccounts();
    const count = 2;
    await collection.startMint();
    const mintTx = await collection.mint(count, {
      from: deployer,
      value: await ethers.utils.parseEther(
        (PRICE_PER_TOKEN * count).toString()
      ),
    });
    const mintReceipt = await mintTx.wait(1);

    const setUriTX = await collection.setBaseURI(PRE_REVEAL_BASE_URI);
    await setUriTX.wait(1);

    // this can have multiple token id so test all token id - PRE-REVEAL conditions
    let tokenId;
    for (let i = 0; i < mintReceipt.events!.length; i++) {
      tokenId = mintReceipt.events![i].args!.tokenId;

      await expect(await collection.tokenURI(tokenId)).to.be.equal(
        PRE_REVEAL_BASE_URI + "base.json"
      );
    }
  });

  it("can reveal token id after specified time", async () => {
    const { deployer } = await getNamedAccounts();

    const count = 5;
    await collection.startMint();
    const mintTx = await collection.mint(count, {
      from: deployer,
      value: await ethers.utils.parseEther(
        (PRICE_PER_TOKEN * count).toString()
      ),
    });
    await mintTx.wait(1);

    const setUriTX = await collection.setBaseURI(PRE_REVEAL_BASE_URI);
    await setUriTX.wait(1);

    // move time
    // This operation can only be done in development chains
    if (developmentChains.includes(network.name)) {
      await moveTime(REVEAL_AFTER + 10);
      await moveBlock(1);
    }

    // set base uri post reveal
    const revealTx = await collection.revealTokenURI(POST_REVEAL_BASE_URI);
    await revealTx.wait(1);

    const mintedTokens = [...Array(count).keys()];

    mintedTokens.forEach(async (v) => {
      const tokenURI = await collection.tokenURI(v);
      await expect(tokenURI).to.be.equal(POST_REVEAL_BASE_URI + v.toString());
    });

    const pauseTx = await collection.pauseMint(true);
    await pauseTx.wait(1);

    await expect(await collection.mintPaused()).to.be.equal(true);
  });
});
