import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("Deploying TipPost contract...");

  const TipPost = await ethers.getContractFactory("TipPost");
  const tipPost = await TipPost.deploy();
  await tipPost.deployed();

  console.log("TipPost deployed to:", tipPost.address);

  // Verify on Etherscan (if API key provided)
  if (process.env.ETHERSCAN_API_KEY) {
    try {
      await hre.run("verify:verify", {
        address: tipPost.address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });