import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("marketplace", function () {
    let [admin, seller, buyer, feeRecipient, samplePaymentToken] = Array<any>(5).fill(null);
    let pet: any;
    let gold: any;
    let marketplace: any;
    let defaultFeeRate = 10;
    let defaultFeeDecimals = 0;
    let defaultPrice = ethers.utils.parseEther("100");
    let defaultBalance = ethers.utils.parseEther("10000");
    let address0 = "0x0000000000000000000000000000000000000000";

    beforeEach(async () => {
        [admin, seller, buyer, feeRecipient, samplePaymentToken] = await ethers.getSigners();

        const Gold = await ethers.getContractFactory("Gold");
        gold = await Gold.deploy();
        await gold.deployed();

        const Pet = await ethers.getContractFactory("PetGacha");
        pet = await Pet.deploy(gold.address);
        await pet.deployed();

        const Marketplace = await ethers.getContractFactory("Marketplace");
        marketplace = await Marketplace.deploy(
            pet.address,
            defaultFeeDecimals,
            defaultFeeRate,
            feeRecipient.address
        );
        await marketplace.deployed();
        await marketplace.addPaymentToken(gold.address);
        await gold.transfer(marketplace.address, defaultBalance);
        await gold.transfer(seller.address, defaultBalance);
    });

    describe("addPaymentToken", function () {
        it("should revert if paymentToken is Address 0", async function () {
            await expect(marketplace.addPaymentToken(address0)).to.be.revertedWith(
                "NFTMarketplace: paymentToken_ is zero address"
            );
        });
        it("should revert if paymentToken is already supported", async function () {
            await marketplace.addPaymentToken(samplePaymentToken.address);
            await expect(
                marketplace.addPaymentToken(samplePaymentToken.address)
            ).to.be.revertedWith("NFTMarketplace: paymentToken_ is already supported");
        });
        it("should add paymentToken correctly", async function () {
            await marketplace.addPaymentToken(samplePaymentToken.address);
            expect(
                await marketplace.isPaymentTokenSupported(samplePaymentToken.address)
            ).to.be.equal(true);
        });
    });

    describe("addOrder", function () {
        beforeEach(async () => {
            await gold.connect(seller).approve(pet.address, ethers.utils.parseEther("100"));
            await pet.connect(seller).openGacha(1, ethers.utils.parseEther("100"));
        });
        it("should revert if paymentToken is not supported", async function () {
            await pet.connect(seller).setApprovalForAll(marketplace.address, true);
            await expect(
                marketplace.connect(seller).addOrder(1, samplePaymentToken.address, defaultPrice)
            ).to.be.revertedWith("NFTMarketplace: paymentToken_ is not supported");
        });
        it("should revert if pet is not owned by seller", async function () {
            await pet.connect(seller).setApprovalForAll(marketplace.address, true);
            await expect(
                marketplace.connect(buyer).addOrder(1, gold.address, defaultPrice)
            ).to.be.revertedWith("NFTMarketplace: sender is not owner of token");
        });
        it("should revert if pet is not approved by marketplace", async function () {
            await expect(
                marketplace.connect(seller).addOrder(1, gold.address, defaultPrice)
            ).to.be.revertedWith(
                "NFTMarketplace: The contract is unauthorized to manage this token"
            );
        });
        it("should revert if price = 0", async function () {
            await pet.connect(seller).setApprovalForAll(marketplace.address, true);
            await expect(
                marketplace.connect(seller).addOrder(1, gold.address, ethers.utils.parseEther("0"))
            ).to.be.revertedWith("NFTMarketplace: price must be greater than 0");
        });
        it("should add order correctly", async function () {
            await pet.connect(seller).setApprovalForAll(marketplace.address, true);
            const addOrderTx = await marketplace
                .connect(seller)
                .addOrder(1, gold.address, defaultPrice);
            await expect(addOrderTx)
                .to.be.emit(marketplace, "OrderAdded")
                .withArgs(1, seller.address, 1, gold.address, defaultPrice);
            expect(await pet.ownerOf(1)).to.be.deep.equal(marketplace.address);
        });
    });
});
