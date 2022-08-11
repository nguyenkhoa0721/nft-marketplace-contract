// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PetGacha is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCount;
    Counters.Counter private _gachaIdCount;
    Counters.Counter private _breedIdCount;

    string private _baseTokenURI;
    IERC20 public immutable gold;

   constructor(address goldAddress_) ERC721("Pet", "PET") {
        gold = IERC20(goldAddress_);
        _gachaIdCount.increment();
        _idToGacha[_gachaIdCount.current()] = Gacha(100 * 10**18, [60, 40, 0]);
        _gachaIdCount.increment();
        _idToGacha[_gachaIdCount.current()] = Gacha(200 * 10**18, [30, 50, 20]);
        _gachaIdCount.increment();
        _idToGacha[_gachaIdCount.current()] = Gacha(300 * 10**18, [10, 40, 50]);
        _gachaIdCount.increment();
        _idToGacha[_gachaIdCount.current()] = Gacha(100 * 10**18, [100, 0, 0]);
        _gachaIdCount.increment();
        _idToGacha[_gachaIdCount.current()] = Gacha(100 * 10**18, [0, 100, 0]);
        _gachaIdCount.increment();
        _idToGacha[_gachaIdCount.current()] = Gacha(100 * 10**18, [0, 0, 100]);
        _rankToBreedTime[1] = 1 days;
        _rankToBreedTime[2] = 2 days;
        _rankToBreedTime[3] = 3 days;
    }

    
    struct BreedInfo {
        uint256 startTime;
        uint256 breedTime;
        address owner;
        uint256 matron;
        uint256 sire;
        uint8 newRank;
    }

    struct Gacha {
        uint256 price;
        uint8[3] rankRate;
    }
    
    struct Pet {
        uint8 rank;
        uint8 stat;
    }

    uint8[3] public ranks = [1, 2, 3];
    mapping(uint256 => Gacha) public _idToGacha;
    mapping(uint256 => Pet) public _tokenIdToPet;
    mapping(uint256 => BreedInfo) public _idToBreedInfo;
    mapping(uint8 => uint256) public _rankToBreedTime;
  
    function openGacha(uint8 gachaId_, uint256 price_)
        public
        returns (uint256)
    {
        require(_idToGacha[gachaId_].price > 0, "PetGacha: invalid gacha");
        require(
            price_ == _idToGacha[gachaId_].price,
            "PetGacha: price not match"
        );
        gold.transferFrom(_msgSender(), address(this), price_);
        _tokenIdCount.increment();
        uint256 _tokenId = _tokenIdCount.current();
        uint8 _rank = _generateRandomRankWithRatio(
            ranks,
            _idToGacha[gachaId_].rankRate
        );
        _mint(_msgSender(), _tokenId);
        _tokenIdToPet[_tokenId] = Pet(_rank, 0);
        return _tokenId;
    }

    function breedPets(uint256 tokenId1_, uint256 tokenId2_) public {
        require(
            ownerOf(tokenId1_) == _msgSender(),
            "PetGacha: sender is not owner of token"
        );
        require(
            (getApproved(tokenId1_) == address(this) &&
                getApproved(tokenId2_) == address(this)) ||
                isApprovedForAll(_msgSender(), address(this)),
            "PetGacha: The contract is unauthorized to manage this token"
        );
        uint8 _rank = _tokenIdToPet[tokenId1_].rank;
        require(
            _rank == _tokenIdToPet[tokenId2_].rank,
            "PetGacha: must same rank"
        );
        require(_rank < 3, "PetGacha: pet is at the highest rank");
        uint8 _newRank = _rank + 1;
        _burn(tokenId1_);
        _burn(tokenId2_);
        delete _tokenIdToPet[tokenId1_];
        delete _tokenIdToPet[tokenId2_];

        _breedIdCount.increment();
        uint256 _breedId = _breedIdCount.current();
        _idToBreedInfo[_breedId] = BreedInfo(
            block.timestamp,
            _rankToBreedTime[_rank],
            _msgSender(),
            tokenId1_,
            tokenId2_,
            _newRank
        );
   }

   function claimsPet(uint256 breedId_) public {
        BreedInfo memory _breedInfo = _idToBreedInfo[breedId_];
        require(
            _breedInfo.owner == _msgSender(),
            "PetGacha: sender is not breed owner"
        );
        require(
            _breedInfo.startTime + _breedInfo.breedTime < block.timestamp,
            "PetGacha: breed time hasn't been exceeded"
        );
        delete _idToBreedInfo[breedId_];
        _tokenIdCount.increment();
        uint256 _newTokenId = _tokenIdCount.current();
        _mint(_msgSender(), _newTokenId);
        _tokenIdToPet[_newTokenId] = Pet(_breedInfo.newRank, 0);
    }

    function _generateRandomRankWithRatio(
        uint8[3] memory rankRate_,
        uint8[3] memory ratios_ 
    ) public view returns (uint8) {
        uint256 rand = _randInRange(1, 100);
        uint16 flag = 0;
        for (uint8 i = 0; i < rankRate_.length; i++) {
            if (rand <= ratios_[i] + flag && rand >= flag) {
                return rankRate_[i];
            }
            flag = flag + ratios_[i];
        }
        return 0;
    }

    function _randInRange(uint256 min, uint256 max)
        public
        view
        returns (uint256)
    {
        uint256 num = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.difficulty, msg.sender)
            )
        ) % (max + 1 - min);
        return num + min;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
    function updateBaseTokenURI(string memory baseTokenURI_) public onlyOwner {
        _baseTokenURI = baseTokenURI_;
    }
}