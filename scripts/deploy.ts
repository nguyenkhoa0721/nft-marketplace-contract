import { ethers } from "hardhat";

async function main() {
    let feeRecipientAdress = "0xa98BE07248cb1D9715Ec428330D3c42ed057834a";
    let pet: any;
    let gold: any;
    let marketplace: any;
    let defaultFeeRate = 10;
    let defaultFeeDecimals = 0;

    const Gold = await ethers.getContractFactory("Gold");
    gold = await Gold.deploy();
    await gold.deployed();
    console.log("Gold deployed to", gold.address);

    const Pet = await ethers.getContractFactory("PetGacha");
    pet = await Pet.deploy(gold.address);
    await pet.deployed();
    console.log("Pet deployed to", pet.address);

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(
        pet.address,
        defaultFeeDecimals,
        defaultFeeRate,
        feeRecipientAdress
    );
    await marketplace.deployed();
    await marketplace.addPaymentToken(gold.address);
    console.log("Marketplace deployed to", marketplace.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// Gold deployed to 0x8D39cEc3A743dA1DfA12A79cE57262D66710b64b
// Pet deployed to 0x8c6dcDa84b0F4D27Cb14D45bA9A90b8C8D04D565
// Marketplace deployed to 0x7A36eAd9008434D4f1AA4dF6445D1179D2a0Afa0
