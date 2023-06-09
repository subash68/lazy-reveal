// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ERC1155.sol";

// This contract should be the operator 
contract VoodooMultiRewards is ERC1155, ReentrancyGuard {

    string public baseURI;
    string public contractURI;
    uint256 public constant REVEAL_AFTER = 3600 seconds;
    uint256 public constant MAX_INT = 2 ** 256 - 1;
    uint256 public constant MAX_ALLOCATION = 1;

    struct Token {
        string metadata;
        uint256 mintPrice;
        uint256 createdOn;
        bool revealed;
        bool enabled;
    }

    mapping(uint256 => Token) public nfts;

    event AddTokenType(uint256 tokenId);
    event SetMintPrice(uint256 tokenId, uint256 price);
    event TokenMinted(uint256 tokenId, address receiver);
    event TokenMetadataRevealed(uint256 tokenId, string metadata);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI, 
        string memory _contractURI
    ) ERC1155(_name, _symbol)  {
        baseURI = _baseURI;
        contractURI = _contractURI;
        owner = msg.sender;
    }

    modifier onlyOwner(address caller) {
        require(caller == owner, "Caller is not owner");
        _;
    }

    // Access: Everyone
    function mint(uint256 _tokenId) public payable {
        require(balanceOf(msg.sender, _tokenId) <= 0, "Already owning");
        require(msg.value >= nfts[_tokenId].mintPrice, "Insufficient balance");

        // Custom contract will have
        /*
            1. receiver
            2. token id
            3. Base uri for the token
            4. amount to mint - default (at most 1)
        */
        mintTo(msg.sender, _tokenId, MAX_ALLOCATION);

        emit TokenMinted(_tokenId, msg.sender);
    }

    // only admin and manager 
    function revealNFT(uint256 _tokenId, string memory _tokenURI) public {
        require(hasRole(UPDATE_TOKEN_ROLE, msg.sender), "Permission denied to reveal NFT");
        require(!nfts[_tokenId].revealed, "Already revealed");
        require(block.timestamp >= nfts[_tokenId].createdOn + REVEAL_AFTER, "Cannot reveal before timer");

        nfts[_tokenId].metadata = _tokenURI;
        nfts[_tokenId].revealed = true;



        emit TokenMetadataRevealed(_tokenId, _tokenURI);
    }

    function uri(uint256 _tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(nfts[_tokenId].metadata));
    }

    function withdraw(address receiver) external onlyOwner(msg.sender) nonReentrant() {
        // Sending to specified account
        (bool success, ) = receiver.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    function _startMinting(uint256 _tokenId) internal {
        nfts[_tokenId].enabled = true;
    }

    function pauseMint(uint256 _tokenId) public isOperator(msg.sender) {
        nfts[_tokenId].enabled = false;
    }

    // add new tokens to contract
    function addTokens(uint256 _price, string memory _tokenURI) public isOperator(msg.sender) {        
        uint256 _tokenId;
        _tokenId = addNewToken(MAX_INT, _tokenURI);
        
        nfts[_tokenId].revealed = false;
        nfts[_tokenId].metadata = _tokenURI;
        nfts[_tokenId].mintPrice = _price;
        nfts[_tokenId].createdOn = block.timestamp;

        _startMinting(_tokenId);

        // Return an event here
        emit AddTokenType(_tokenId);
    }

    // Set token price
    function setTokenPrice(uint256 _tokenId, uint256 _price) public  isOperator(msg.sender) {
        nfts[_tokenId].mintPrice = _price;

        emit SetMintPrice(_tokenId, _price);
    }

    // Get token price
    function getTokenPrice(uint256 _tokenId) public view returns (uint256) {
        return nfts[_tokenId].mintPrice;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}