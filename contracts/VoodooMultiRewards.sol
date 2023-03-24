// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./access/GranularRoles.sol";

contract VoodooMultiRewards is ERC1155, GranularRoles, ReentrancyGuard {

    string public baseURI;
    uint256 public constant REVEAL_AFTER = 3600 seconds;

    address private owner_;

    struct Token {
        string metadata;
        uint256 mintPrice;
        uint256 createdOn;
        bool revealed;
        bool enabled;
    }

    mapping(uint256 => Token) public nfts;

    event AddTokenType(uint256 tokenId);

    constructor(string memory _baseURI) ERC1155(_baseURI) GranularRoles(msg.sender) {
        baseURI = _baseURI;
        owner_ = msg.sender;
    }

    modifier isOperator(address caller) {
        require(hasRole(OPERATOR_ROLE, caller), "Caller is not an operator");
        _;
    }

    modifier onlyOwner(address caller) {
        require(caller == owner(), "Caller is not owner");
        _;
    }

    function owner() public view returns (address) {
        return owner_;
    }

    // Access: Everyone
    function mint(uint256 _tokenId) public payable {
        require(balanceOf(msg.sender, _tokenId) <= 0, "Already owning");
        require(msg.value >= nfts[_tokenId].mintPrice, "Insufficient balance");

        _mint(msg.sender, _tokenId, 1, "");
    }

    // only admin and manager 
    function revealNFT(uint256 _tokenId, string memory _tokenURI) public {
        require(!hasRole(UPDATE_TOKEN_ROLE, msg.sender), "Permission denied to reveal NFT");
        require(!nfts[_tokenId].revealed, "Already revealed");
        require(block.timestamp >= nfts[_tokenId].createdOn + REVEAL_AFTER, "Cannot reveal before timer");

        nfts[_tokenId].metadata = _tokenURI;
        nfts[_tokenId].revealed = true;
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
    function addTokens(uint256 _tokenId, uint256 _price, string memory _tokenURI) public isOperator(msg.sender) {
        // Check if already present

        nfts[_tokenId].revealed = false;
        nfts[_tokenId].metadata = _tokenURI;
        nfts[_tokenId].mintPrice = _price;

        _startMinting(_tokenId);

        // Return an event here
        emit AddTokenType(_tokenId);
    }

    // Set token price

    // Get token price

    function getTokenPrice(uint256 _tokenId) public view returns (uint256) {
        return nfts[_tokenId].mintPrice;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}