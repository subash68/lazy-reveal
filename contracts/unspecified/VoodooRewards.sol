// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import openzeppelin contract
import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VoodooRewards is Ownable, ERC721A {

    uint256 public constant MAX_SUPPLY = 10;
    uint256 public constant PRICE_PER_TOKEN = 0.001 ether;
    uint256 public constant REVEAL_AFTER = 3600 seconds;
    uint256 private startTime;
    bool public mintPaused;
    bool public tokenRevealed;
    string private _baseTokenURI;
    string private _contractURI;

    constructor(bool _paused, bool _tokenRevealed, string memory contractURI_) ERC721A("VoodooRewards", "VCR") {
        mintPaused = _paused; // Start with false
        tokenRevealed = _tokenRevealed;
        _contractURI = contractURI_;
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function mint(uint256 _quantity) external payable {
        require(!mintPaused, "Minting is paused");
        require(startTime > 0, "Minting has not started");
        require(_totalMinted() + _quantity <= MAX_SUPPLY, "Reached supply limit");
        require(msg.value >= _quantity * PRICE_PER_TOKEN, "Price sent is too low");
        _safeMint(msg.sender, _quantity);
    }

    // Set Base url for the collection
    function setBaseURI(string calldata baseURI) external onlyOwner {
        require(!tokenRevealed, "Unable to set baseURI after revealing");
        _baseTokenURI = baseURI;
    }

    // reveal metadata after minting
    function revealTokenURI(string calldata baseURI) public onlyOwner {
        // time should be checked -- with respect to start time
        require(block.timestamp >= startTime + REVEAL_AFTER, "Time remaining to reveal");
        // max supply and total supply should be checked
        _baseTokenURI = baseURI;
        tokenRevealed = true;
    }

    // token URI function to handle pre-reveal and post-reveal
    function tokenURI(uint256 _tokenId) public override view returns(string memory) {
        if(!_exists(_tokenId)) revert URIQueryForNonexistentToken();

        string memory baseURI_ = _baseURI();
        if(!tokenRevealed) {
            // If the token uri is not revealed then return common token uri for all the token
            return bytes(baseURI_).length != 0 ? string(abi.encodePacked(baseURI_, "base.json")) : "";
        } else {
            // include token id after revealing
            return string(abi.encodePacked(baseURI_, _toString(_tokenId)));
        }
    }

    function _baseURI() internal override view returns(string memory) {
        return _baseTokenURI;
    }

    // Add withdraw function here
    function withdraw() external onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    function pauseMint(bool _paused) external onlyOwner {
        require(!mintPaused, "Mint already paused");
        mintPaused = _paused;
    }

    function startMint() external onlyOwner {
        require(!mintPaused, "Mint already in progress");
        // Set start time here
        startTime = block.timestamp;
        mintPaused = false;
    }

    // add burn feature here


}