import {
  DEFAULT_TOKEN_ID,
  DUPLICATE_REVEAL_ERROR,
  INSUFFICIENT_BALANCE,
  OPERATOR_ERROR_MESSAGE,
  POST_REVEAL_BASE_URI,
  PRICE_PER_TOKEN,
  REVEAL_AFTER,
  REVEAL_PERMISSION_ERROR,
  REVEAL_TIMER_ERROR,
  VOODOO_MULTI_REWARD,
  WITHDRAW_ERROR,
  developmentChains,
} from "../helper-hardhat-config";
import { VoodooMultiRewards } from "../typechain-types";
import { getNamedAccounts, deployments, ethers, network } from "hardhat";
import { expect } from "chai";
import { moveTime } from "../utils/move-time";
import { moveBlock } from "../utils/move-block";
import { providers } from "ethers";

describe("ERC1155 mint and reveal", async () => {
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
    ).to.be.revertedWith(OPERATOR_ERROR_MESSAGE);
  });

  it("can set price for selected token type", async () => {
    // Get operator here
    const { operator, buyer } = await getNamedAccounts();
    collection = await ethers.getContract(VOODOO_MULTI_REWARD, operator);

    const addTokenTx = await collection.addTokens(
      DEFAULT_TOKEN_ID,
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
      ""
    );

    const addTokenReceipt = await addTokenTx.wait(1);

    let tokenId =
      addTokenReceipt.events![addTokenReceipt.events!.length - 1].args!.tokenId;

    await expect(tokenId).to.be.equal(DEFAULT_TOKEN_ID);

    const setPriceTx = await collection.setTokenPrice(
      tokenId,
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString())
    );
    const setPriceReceipt = await setPriceTx.wait(1);
    tokenId =
      setPriceReceipt.events![setPriceReceipt.events!.length - 1].args!.tokenId;
    const price =
      setPriceReceipt.events![setPriceReceipt.events!.length - 1].args!.price;

    await expect(tokenId).to.be.equal(1);
    await expect(price).to.be.equal(
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString())
    );

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, buyer);

    await expect(
      collection.addTokens(
        DEFAULT_TOKEN_ID,
        ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
        ""
      )
    ).to.be.revertedWith(OPERATOR_ERROR_MESSAGE);
  });

  it("can mint an NFT for selected token", async () => {
    const { deployer, buyer } = await getNamedAccounts();

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, deployer);

    await collection.addTokens(
      DEFAULT_TOKEN_ID,
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
      ""
    );

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, buyer);
    // check if price is valid
    await expect(
      collection.mint(DEFAULT_TOKEN_ID, {
        value: ethers.utils.parseEther((PRICE_PER_TOKEN - 0.0001).toString()),
      })
    ).to.be.revertedWith(INSUFFICIENT_BALANCE);

    const mintTx = await collection.mint(DEFAULT_TOKEN_ID, {
      value: ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
    });
    const mintReceipt = await mintTx.wait(1);
    const tokenId =
      mintReceipt.events![mintReceipt.events!.length - 1].args!.tokenId;
    const receiver =
      mintReceipt.events![mintReceipt.events!.length - 1].args!.receiver;
    await expect(tokenId).to.be.equal(DEFAULT_TOKEN_ID);
    await expect(receiver).to.be.equal(buyer);
  });
  it("can reveal minted NFT after specific time", async () => {
    const { deployer, buyer, updater } = await getNamedAccounts();

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, deployer);

    let addTokenTx = await collection.addTokens(
      DEFAULT_TOKEN_ID,
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
      ""
    );

    addTokenTx.wait(1);

    // * Check updater role
    collection = await ethers.getContract(VOODOO_MULTI_REWARD, buyer);

    // Permission error - Role checks
    await expect(
      collection.revealNFT(DEFAULT_TOKEN_ID, POST_REVEAL_BASE_URI + 0)
    ).to.be.revertedWith(REVEAL_PERMISSION_ERROR);

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, updater);
    // Reveal timer error - Timer checks
    await expect(
      collection.revealNFT(DEFAULT_TOKEN_ID, POST_REVEAL_BASE_URI + 0)
    ).to.be.revertedWith(REVEAL_TIMER_ERROR);

    if (developmentChains.includes(network.name)) {
      await moveTime(REVEAL_AFTER + 10);
      await moveBlock(1);
    }

    const revealTx = await collection.revealNFT(
      DEFAULT_TOKEN_ID,
      POST_REVEAL_BASE_URI + 0
    );
    const revealReceipt = await revealTx.wait(1);
    const tokenId =
      revealReceipt.events![revealReceipt.events!.length - 1].args!.tokenId;
    const metadata =
      revealReceipt.events![revealReceipt.events!.length - 1].args!.metadata;

    await expect(tokenId).to.be.equal(DEFAULT_TOKEN_ID);
    await expect(metadata).to.be.equal(POST_REVEAL_BASE_URI + 0);

    // * check if already revealed
    await expect(
      collection.revealNFT(DEFAULT_TOKEN_ID, POST_REVEAL_BASE_URI + 0)
    ).to.be.revertedWith(DUPLICATE_REVEAL_ERROR);
  });

  it("can withdraw funds to specified address", async () => {
    const { deployer, treasury, buyer } = await getNamedAccounts();

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, deployer);

    await collection.addTokens(
      DEFAULT_TOKEN_ID,
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
      ""
    );

    // ! only admin can withdraw funds

    const mintTx = await collection.mint(DEFAULT_TOKEN_ID, {
      value: ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
    });
    await mintTx.wait(1);

    const balance = await ethers.provider.getBalance(collection.address);

    await expect(balance).to.be.equal(
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString())
    );

    const previousBalance = await ethers.provider.getBalance(treasury);

    const withdrawTx = await collection.withdraw(treasury);
    await withdrawTx.wait(1);

    const treasuryBalance = await ethers.provider.getBalance(treasury);
    await expect(treasuryBalance).to.be.equal(previousBalance.add(balance));

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, buyer);
    await expect(collection.withdraw(treasury)).to.be.revertedWith(
      WITHDRAW_ERROR
    );
  });
});
