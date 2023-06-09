import {
  DEFAULT_TOKEN_ID,
  DUPLICATE_REVEAL_ERROR,
  INSUFFICIENT_BALANCE,
  OPERATOR_ERROR_MESSAGE,
  POST_REVEAL_BASE_URI,
  PRE_REVEAL_BASE_URI,
  PRE_REVEAL_METADATA,
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
    // Get operator and buyer account
    const { operator, buyer } = await getNamedAccounts();
    collection = await ethers.getContract(VOODOO_MULTI_REWARD, operator);

    // Add new token by setting price
    const addTokenTx = await collection.addTokens(
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
      PRE_REVEAL_BASE_URI + PRE_REVEAL_METADATA
    );
    const addTokenReceipt = await addTokenTx.wait(1);
    const tokenId =
      addTokenReceipt.events![addTokenReceipt.events!.length - 1].args!.tokenId;

    // * check if token is created.
    await expect(tokenId).to.be.equal(DEFAULT_TOKEN_ID);

    // ! Accounts with other roles cannot add new tokens
    collection = await ethers.getContract(VOODOO_MULTI_REWARD, buyer);
    // Adding first token here
    await expect(
      collection.addTokens(
        ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
        PRE_REVEAL_BASE_URI + PRE_REVEAL_METADATA
      )
    ).to.be.revertedWith(OPERATOR_ERROR_MESSAGE);
  });

  it("can set price for selected token type", async () => {
    // Get operator and other accounts
    const { operator, buyer } = await getNamedAccounts();
    collection = await ethers.getContract(VOODOO_MULTI_REWARD, operator);

    const addTokenTx = await collection.addTokens(
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
      PRE_REVEAL_BASE_URI + PRE_REVEAL_METADATA
    );

    const addTokenReceipt = await addTokenTx.wait(1);

    let tokenId =
      addTokenReceipt.events![addTokenReceipt.events!.length - 1].args!.tokenId;

    await expect(tokenId).to.be.equal(DEFAULT_TOKEN_ID);

    // * Set price for selected token
    const setPriceTx = await collection.setTokenPrice(
      tokenId,
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString())
    );
    const setPriceReceipt = await setPriceTx.wait(1);
    tokenId =
      setPriceReceipt.events![setPriceReceipt.events!.length - 1].args!.tokenId;
    const price =
      setPriceReceipt.events![setPriceReceipt.events!.length - 1].args!.price;

    await expect(tokenId).to.be.equal(DEFAULT_TOKEN_ID);
    await expect(price).to.be.equal(
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString())
    );

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, buyer);

    await expect(
      collection.addTokens(
        ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
        PRE_REVEAL_BASE_URI + PRE_REVEAL_METADATA
      )
    ).to.be.revertedWith(OPERATOR_ERROR_MESSAGE);
  });

  it("can mint an NFT for selected token", async () => {
    const { deployer, buyer } = await getNamedAccounts();

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, deployer);

    await collection.addTokens(
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
      PRE_REVEAL_BASE_URI + PRE_REVEAL_METADATA
    );

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, buyer);
    // ! Mint with wrong price for selected token
    await expect(
      collection.mint(DEFAULT_TOKEN_ID, {
        value: ethers.utils.parseEther((PRICE_PER_TOKEN - 0.0001).toString()),
      })
    ).to.be.revertedWith(INSUFFICIENT_BALANCE);

    // * mint with correct price fro selected token
    let mintTx = await collection.mint(DEFAULT_TOKEN_ID, {
      value: ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
    });
    let mintReceipt = await mintTx.wait(1);
    let tokenId =
      mintReceipt.events![mintReceipt.events!.length - 1].args!.tokenId;
    let receiver =
      mintReceipt.events![mintReceipt.events!.length - 1].args!.receiver;
    await expect(tokenId).to.be.equal(DEFAULT_TOKEN_ID);
    await expect(receiver).to.be.equal(buyer);

    // * Mint another token with correct price for different user
    collection = await ethers.getContract(VOODOO_MULTI_REWARD, deployer);
    mintTx = await collection.mint(0, {
      value: ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
    });

    mintReceipt = await mintTx.wait(1);
    tokenId = mintReceipt.events![mintReceipt.events!.length - 1].args!.tokenId;
    receiver =
      mintReceipt.events![mintReceipt.events!.length - 1].args!.receiver;
    await expect(tokenId).to.be.equal(0);
    await expect(receiver).to.be.equal(deployer);
  });

  it("can reveal minted NFT after specific time", async () => {
    const { deployer, buyer, updater } = await getNamedAccounts();

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, deployer);

    let addTokenTx = await collection.addTokens(
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
      PRE_REVEAL_BASE_URI + PRE_REVEAL_METADATA
    );
    addTokenTx.wait(1);

    // * Check updater role
    collection = await ethers.getContract(VOODOO_MULTI_REWARD, buyer);

    // ! Reveal permission error for incorrect role
    await expect(
      collection.revealNFT(DEFAULT_TOKEN_ID, POST_REVEAL_BASE_URI + 0)
    ).to.be.revertedWith(REVEAL_PERMISSION_ERROR);

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, updater);

    // ! Cannot reveal before specified time
    await expect(
      collection.revealNFT(DEFAULT_TOKEN_ID, POST_REVEAL_BASE_URI + 0)
    ).to.be.revertedWith(REVEAL_TIMER_ERROR);

    // MOVING TIME AND BLOCK
    if (developmentChains.includes(network.name)) {
      await moveTime(REVEAL_AFTER + 10);
      await moveBlock(1);
    }

    // * Can reveal NFT metadata after all parameters are satisfied
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

    // ! check if already revealed
    await expect(
      collection.revealNFT(DEFAULT_TOKEN_ID, POST_REVEAL_BASE_URI + 0)
    ).to.be.revertedWith(DUPLICATE_REVEAL_ERROR);
  });

  it("can withdraw funds to specified address", async () => {
    const { deployer, treasury, buyer } = await getNamedAccounts();

    collection = await ethers.getContract(VOODOO_MULTI_REWARD, deployer);

    await collection.addTokens(
      ethers.utils.parseEther(PRICE_PER_TOKEN.toString()),
      PRE_REVEAL_BASE_URI + PRE_REVEAL_METADATA
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
    // * Check if withdraw amount is received correctly
    await expect(treasuryBalance).to.be.equal(previousBalance.add(balance));

    // ! Cannot withdraw if not owner
    collection = await ethers.getContract(VOODOO_MULTI_REWARD, buyer);
    await expect(collection.withdraw(treasury)).to.be.revertedWith(
      WITHDRAW_ERROR
    );
  });
});
