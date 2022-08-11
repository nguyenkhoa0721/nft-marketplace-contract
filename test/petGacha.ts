import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("Pet NFT", function () {
    let accountA: any, accountB: any, accountC: any;
    let petGacha: any;
    let gold: any;
    let address0 = ethers.constants.AddressZero;
    let defaulBalance = ethers.utils.parseEther("1000000000");
    let priceGacha1 = ethers.utils.parseEther("100");
    let priceGacha2 = ethers.utils.parseEther("200");
    let priceGacha3 = ethers.utils.parseEther("300");
    let oneDay = 60 * 60 * 24;

    beforeEach(async () => {
        [accountA, accountB, accountC] = await ethers.getSigners();

        const Gold = await ethers.getContractFactory("Gold");
        gold = await Gold.deploy();
        await gold.deployed();

        const PetGacha = await ethers.getContractFactory("PetGacha");
        petGacha = await PetGacha.deploy(gold.address);
        await petGacha.deployed();

        await gold.approve(petGacha.address, defaulBalance);
    });

    describe("openGacha", function () {
        it("revert if gacha not exist", async function () {
            await expect(petGacha.openGacha(7, priceGacha1)).to.be.revertedWith(
                "PetGacha: invalid gacha"
            );
        });
        it("revert if price not match", async function () {
            await expect(petGacha.openGacha(1, priceGacha2)).to.be.revertedWith(
                "PetGacha: price not match"
            );
        });
        it("should open gacha 1 correctly", async function () {
            const its = 3;
            for (let i = 1; i <= its; i++) {
                await petGacha.openGacha(1, priceGacha1);
                const pet = await petGacha._tokenIdToPet(i);
                console.log(pet.rank);
                expect(await petGacha.ownerOf(i)).to.be.equal(accountA.address);
            }
            expect(await gold.balanceOf(petGacha.address)).to.be.equal(priceGacha1.mul(its));
            expect(await gold.balanceOf(accountA.address)).to.be.equal(
                defaulBalance.sub(priceGacha1.mul(its))
            );
        });
        it("should open gacha 2 correctly", async function () {
            const its = 3;
            for (let i = 1; i <= its; i++) {
                await petGacha.openGacha(2, priceGacha2);
                const pet = await petGacha._tokenIdToPet(i);
                console.log(pet.rank);
                expect(await petGacha.ownerOf(i)).to.be.equal(accountA.address);
            }
            expect(await gold.balanceOf(petGacha.address)).to.be.equal(priceGacha2.mul(its));
            expect(await gold.balanceOf(accountA.address)).to.be.equal(
                defaulBalance.sub(priceGacha2.mul(its))
            );
        });
        it("should open gacha 3 correctly", async function () {
            const its = 3;
            for (let i = 1; i <= its; i++) {
                await petGacha.openGacha(3, priceGacha3);
                const pet = await petGacha._tokenIdToPet(i);
                console.log(pet.rank);
                expect(await petGacha.ownerOf(i)).to.be.equal(accountA.address);
            }
            expect(await gold.balanceOf(petGacha.address)).to.be.equal(priceGacha3.mul(its));
            expect(await gold.balanceOf(accountA.address)).to.be.equal(
                defaulBalance.sub(priceGacha3.mul(its))
            );
        });
    });
    describe("breedPets", function () {
        it("should revert if not owner", async function () {
            await petGacha.setApprovalForAll(petGacha.address, true);
            await petGacha.openGacha(1, priceGacha1);
            await petGacha.openGacha(1, priceGacha1);
            await expect(petGacha.connect(accountB).breedPets(1, 2)).to.be.revertedWith(
                "PetGacha: sender is not owner of token"
            );
        });
        it("should revert if not same rank", async function () {
            await petGacha.setApprovalForAll(petGacha.address, true);
            await petGacha.openGacha(4, priceGacha1);
            await petGacha.openGacha(5, priceGacha1);
            await expect(petGacha.breedPets(1, 2)).to.be.revertedWith("PetGacha: must same rank");
        });
        it("should revert if petty is at the highest rank", async function () {
            await petGacha.setApprovalForAll(petGacha.address, true);
            await petGacha.openGacha(6, priceGacha1);
            await petGacha.openGacha(6, priceGacha1);
            await expect(petGacha.breedPets(1, 2)).to.be.revertedWith(
                "PetGacha: pet is at the highest rank"
            );
        });
        it("should revert if nft hasnt been approved", async function () {
            await petGacha.openGacha(4, priceGacha1);
            await petGacha.openGacha(4, priceGacha1);
            await expect(petGacha.breedPets(1, 2)).to.be.revertedWith(
                "PetGacha: The contract is unauthorized to manage this token"
            );
        });
        it("should breed correctly rank 1", async function () {
            await petGacha.setApprovalForAll(petGacha.address, true);
            await petGacha.openGacha(4, priceGacha1);
            await petGacha.openGacha(4, priceGacha1);
            await petGacha.breedPets(1, 2);
            await expect(petGacha.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID");
            await expect(petGacha.ownerOf(2)).to.be.revertedWith("ERC721: invalid token ID");
            const blockNum = await ethers.provider.getBlockNumber();
            const block = await ethers.provider.getBlock(blockNum);

            let breedInfo = await petGacha._idToBreedInfo(1);
            expect(breedInfo.startTime).to.be.equal(await block.timestamp);
            expect(breedInfo.breedTime).to.be.equal(oneDay);
            expect(breedInfo.owner).to.be.equal(accountA.address);
            expect(breedInfo.matron).to.be.equal(1);
            expect(breedInfo.sire).to.be.equal(2);
            expect(breedInfo.newRank).to.be.equal(2);
        });
        it("should breed correctly rank 2", async function () {
            await petGacha.setApprovalForAll(petGacha.address, true);
            await petGacha.openGacha(5, priceGacha1);
            await petGacha.openGacha(5, priceGacha1);
            await petGacha.breedPets(1, 2);
            await expect(petGacha.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID");
            const blockNum = await ethers.provider.getBlockNumber();
            const block = await ethers.provider.getBlock(blockNum);
            await expect(petGacha.ownerOf(2)).to.be.revertedWith("ERC721: invalid token ID");
            let breedInfo = await petGacha._idToBreedInfo(1);
            expect(breedInfo.startTime).to.be.equal(await block.timestamp);
            expect(breedInfo.breedTime).to.be.equal(oneDay * 2);
            expect(breedInfo.owner).to.be.equal(accountA.address);
            expect(breedInfo.matron).to.be.equal(1);
            expect(breedInfo.sire).to.be.equal(2);
            expect(breedInfo.newRank).to.be.equal(3);
        });
    });
    describe("claimsPet", function () {
        it("should revert if not owner", async function () {
            await petGacha.setApprovalForAll(petGacha.address, true);
            await petGacha.openGacha(4, priceGacha1);
            await petGacha.openGacha(4, priceGacha1);
            await petGacha.breedPets(1, 2);
            await expect(petGacha.connect(accountB).claimsPet(1)).to.be.revertedWith(
                "PetGacha: sender is not breed owner"
            );
        });
        it("should revert if not exceed claim time rank 1", async function () {
            await petGacha.setApprovalForAll(petGacha.address, true);
            await petGacha.openGacha(4, priceGacha1);
            await petGacha.openGacha(4, priceGacha1);
            await petGacha.breedPets(1, 2);
            await network.provider.send("evm_increaseTime", [oneDay * 1 - 1]);
            await expect(petGacha.claimsPet(1)).to.be.revertedWith(
                "PetGacha: breed time hasn't been exceeded"
            );
        });
        it("should claim correctly rank 1", async function () {
            await petGacha.setApprovalForAll(petGacha.address, true);
            await petGacha.openGacha(4, priceGacha1);
            await petGacha.openGacha(4, priceGacha1);
            await petGacha.breedPets(1, 2);
            await network.provider.send("evm_increaseTime", [oneDay * 1 + 1]);
            await petGacha.claimsPet(1);
            const petty3 = await petGacha._tokenIdToPet(3);
            expect(petty3.rank).to.be.equal(2);
            let breedInfo = await petGacha._idToBreedInfo(1);
            expect(breedInfo.startTime).to.be.equal(0);
            expect(breedInfo.breedTime).to.be.equal(0);
            expect(breedInfo.owner).to.be.equal(address0);
            expect(breedInfo.matron).to.be.equal(0);
            expect(breedInfo.sire).to.be.equal(0);
            expect(breedInfo.newRank).to.be.equal(0);
        });
        it("should revert if not exceed breed time rank 2", async function () {
            await petGacha.setApprovalForAll(petGacha.address, true);
            await petGacha.openGacha(5, priceGacha1);
            await petGacha.openGacha(5, priceGacha1);
            await petGacha.breedPets(1, 2);
            await network.provider.send("evm_increaseTime", [oneDay * 2 - 1]);
            await expect(petGacha.claimsPet(1)).to.be.revertedWith(
                "PetGacha: breed time hasn't been exceeded"
            );
        });
        it("should claim correctly rank 2", async function () {
            await petGacha.setApprovalForAll(petGacha.address, true);
            await petGacha.openGacha(5, priceGacha1);
            await petGacha.openGacha(5, priceGacha1);
            await petGacha.breedPets(1, 2);
            await network.provider.send("evm_increaseTime", [oneDay * 2 + 1]);
            await petGacha.claimsPet(1);
            const petty3 = await petGacha._tokenIdToPet(3);
            expect(petty3.rank).to.be.equal(3);
            let breedInfo = await petGacha._idToBreedInfo(1);
            expect(breedInfo.startTime).to.be.equal(0);
            expect(breedInfo.breedTime).to.be.equal(0);
            expect(breedInfo.owner).to.be.equal(address0);
            expect(breedInfo.matron).to.be.equal(0);
            expect(breedInfo.sire).to.be.equal(0);
            expect(breedInfo.newRank).to.be.equal(0);
        });
    });
});
