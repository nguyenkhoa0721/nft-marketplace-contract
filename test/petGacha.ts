import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Petty NFT", function () {
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
});
