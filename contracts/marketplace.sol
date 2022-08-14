pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Marketplace is Ownable {
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Order {
        address seller;
        address buyer;
        uint256 tokenId;
        address paymentToken;
        uint256 price;
    }

    Counters.Counter private _orderIdCount;
    IERC721 public immutable nftContract;
    mapping(uint256 => Order) orders;
    uint256 public feeDecimal;
    uint256 public feeRate;
    address public feeRecipient;
    EnumerableSet.AddressSet private _supportedPaymentTokens;

    // Events
    event OrderAdded(
        uint256 indexed orderId,
        address indexed seller,
        uint256 indexed tokenId,
        address paymentToken,
        uint256 price
    );
    event OrderCancelled(uint256 indexed orderId);
    event OrderMatched(
        uint256 indexed orderId,
        address indexed seller,
        address indexed buyer,
        uint256 tokenId,
        address paymentToken,
        uint256 price
    );
    event FeeRateUpdated(uint256 feeDecimal, uint256 feeRate);

    constructor(
        address nftAddress_,
        uint256 feeDecimal_,
        uint256 feeRate_,
        address feeRecipient_
    ) {
        require(
            nftAddress_ != address(0),
            "NFTMarketplace: nftAddress_ is zero address"
        );

        nftContract = IERC721(nftAddress_);
        _updateFeeRecipient(feeRecipient_);
        _updateFeeRate(feeDecimal_, feeRate_);
        _orderIdCount.increment();
    }

    // Internal function
    function _updateFeeRecipient(address feeRecipient_) internal {
        require(
            feeRecipient_ != address(0),
            "NFTMarketplace: feeRecipient_ is zero address"
        );
        feeRecipient = feeRecipient_;
    }

    function _updateFeeRate(uint256 feeDecimal_, uint256 feeRate_) internal {
        require(
            feeRate_ < 10**(feeDecimal_ + 2),
            "NFTMarketplace: feeRate is too high"
        );
        feeDecimal = feeDecimal_;
        feeRate = feeRate_;
        emit FeeRateUpdated(feeDecimal, feeRate);
    }

    // onlyOwner function
    function updateFeeRecipient(address feeRecipient_) external onlyOwner {
        _updateFeeRecipient(feeRecipient_);
    }

    function updateFeeRate(uint256 feeDecimal_, uint256 feeRate_)
        external
        onlyOwner
    {
        _updateFeeRate(feeDecimal_, feeRate_);
    }

    function addPaymentToken(address paymentToken_) external onlyOwner {
        require(
            paymentToken_ != address(0),
            "NFTMarketplace: paymentToken_ is zero address"
        );
        require(
            !_supportedPaymentTokens.contains(paymentToken_),
            "NFTMarketplace: paymentToken_ is already supported"
        );
        _supportedPaymentTokens.add(paymentToken_);
    }

    //ulti
    function _calculateFee(uint256 orderId_) private view returns (uint256) {
        Order storage _order = orders[orderId_];
        if (feeRate == 0) {
            return 0;
        }
        return (feeRate * _order.price) / 10**(feeDecimal + 2);
    }

    function isSeller(uint256 orderId_, address seller_)
        public
        view
        returns (bool)
    {
        return orders[orderId_].seller == seller_;
    }

    function isPaymentTokenSupported(address paymentToken_)
        public
        view
        returns (bool)
    {
        return _supportedPaymentTokens.contains(paymentToken_);
    }

    modifier onlySupportedPaymentToken(address paymentToken_) {
        require(
            isPaymentTokenSupported(paymentToken_),
            "NFTMarketplace: paymentToken_ is not supported"
        );
        _;
    }

    //orders
    function addOrder(
        uint256 tokenId_,
        address paymentToken_,
        uint256 price_
    ) public onlySupportedPaymentToken(paymentToken_) {
        require(
            nftContract.ownerOf(tokenId_) == _msgSender(),
            "NFTMarketplace: sender is not owner of token"
        );
        require(
            nftContract.getApproved(tokenId_) == address(this) ||
                nftContract.isApprovedForAll(_msgSender(), address(this)),
            "NFTMarketplace: The contract is unauthorized to manage this token"
        );
        require(price_ > 0, "NFTMarketplace: price must be greater than 0");
        uint256 _orderId = _orderIdCount.current();
        orders[_orderId] = Order(
            _msgSender(),
            address(0),
            tokenId_,
            paymentToken_,
            price_
        );
        _orderIdCount.increment();
        nftContract.transferFrom(_msgSender(), address(this), tokenId_);
        emit OrderAdded(
            _orderId,
            _msgSender(),
            tokenId_,
            paymentToken_,
            price_
        );
    }

    function cancelOrder(uint256 orderId_) external {
        Order storage order = orders[orderId_];
        require(order.seller == _msgSender(), "NFTMarketplace: must be seller");
        require(
            order.buyer == address(0),
            "NFTMarketplace: buyer must be zero"
        );
        uint256 _tokenId = order.tokenId;
        delete orders[orderId_];
        nftContract.transferFrom(address(this), _msgSender(), _tokenId);
        emit OrderCancelled(orderId_);
    }

    function executeOrder(uint256 orderId_) external {
        Order storage order = orders[orderId_];
        require(order.price > 0, "NFTMarketplace: order has been cancel");
        require(
            order.buyer != order.seller,
            "NFTMarketplace: buyer must not be seller"
        );
        require(
            order.buyer != address(0),
            "NFTMarketplace: buyer must not be zero"
        );
        order.buyer = _msgSender();
        uint256 _fee = _calculateFee(orderId_);
        if (_fee > 0) {
            IERC20(order.paymentToken).transferFrom(
                _msgSender(),
                feeRecipient,
                _fee
            );
        }
        IERC20(order.paymentToken).transferFrom(
            _msgSender(),
            order.seller,
            order.price - _fee
        );
        nftContract.transferFrom(address(this), _msgSender(), order.tokenId);
        emit OrderMatched(
            orderId_,
            order.seller,
            order.buyer,
            order.tokenId,
            order.paymentToken,
            order.price
        );
    }
}
