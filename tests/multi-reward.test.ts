import {
  DEFAULT_TOKEN_ID,
  PRICE_PER_TOKEN,
  VOODOO_MULTI_REWARD,
} from "../helper-hardhat-config";
import { VoodooMultiRewards } from "../typechain-types";
import { getNamedAccounts, deployments, ethers } from "hardhat";
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
    // Get operator here
    const { operator, buyer } = await getNamedAccounts();
    collection = await ethers.getContract(VOODOO_MULTI_REWARD, operator);

    const addTokenTx = await collection.addTokens(
      DEFAULT_TOKEN_ID,
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
      ""
    );

    const addTokenReceipt = await addTokenTx.wait(1);

    const tokenId =
      addTokenReceipt.events![addTokenReceipt.events!.length - 1].args!.tokenId;

    await expect(tokenId).to.be.equal(DEFAULT_TOKEN_ID);

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, buyer);
    // Adding first token here
    await expect(
      collection.addTokens(
        DEFAULT_TOKEN_ID,
        ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
        ""
      )
    ).to.be.revertedWith("Caller is not an operator");
  });

  //   it("can set base URI for contract", async () => {
  //     const { deployer } = await getNamedAccounts();
  //     const count = 2;
  //     await collection.startMint();
  //     const mintTx = await collection.mint(count, {
  //       from: deployer,
  //       value: await ethers.utils.parseEther(
  //         (PRICE_PER_TOKEN * count).toString()
  //       ),
  //     });
  //     const mintReceipt = await mintTx.wait(1);

  //     const setUriTX = await collection.setBaseURI(PRE_REVEAL_BASE_URI);
  //     await setUriTX.wait(1);

  //     // this can have multiple token id so test all token id - PRE-REVEAL conditions
  //     let tokenId;
  //     for (let i = 0; i < mintReceipt.events!.length; i++) {
  //       tokenId = mintReceipt.events![i].args!.tokenId;

  //       await expect(await collection.tokenURI(tokenId)).to.be.equal(
  //         PRE_REVEAL_BASE_URI + "base.json"
  //       );
  //     }
  //   });

  //   it("can reveal token id after specified time", async () => {
  //     const { deployer } = await getNamedAccounts();

  //     const count = 5;
  //     await collection.startMint();
  //     const mintTx = await collection.mint(count, {
  //       from: deployer,
  //       value: await ethers.utils.parseEther(
  //         (PRICE_PER_TOKEN * count).toString()
  //       ),
  //     });
  //     await mintTx.wait(1);

  //     const setUriTX = await collection.setBaseURI(PRE_REVEAL_BASE_URI);
  //     await setUriTX.wait(1);

  //     // move time
  //     // This operation can only be done in development chains
  //     if (developmentChains.includes(network.name)) {
  //       await moveTime(REVEAL_AFTER + 10);
  //       await moveBlock(1);
  //     }

  //     // set base uri post reveal
  //     const revealTx = await collection.revealTokenURI(POST_REVEAL_BASE_URI);
  //     await revealTx.wait(1);

  //     const mintedTokens = [...Array(count).keys()];

  //     mintedTokens.forEach(async (v) => {
  //       const tokenURI = await collection.tokenURI(v);
  //       await expect(tokenURI).to.be.equal(POST_REVEAL_BASE_URI + v.toString());
  //     });

  //     const pauseTx = await collection.pauseMint(true);
  //     await pauseTx.wait(1);

  //     await expect(await collection.mintPaused()).to.be.equal(true);
  //   });
});
