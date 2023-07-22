import { ethers } from "hardhat";

async function main() {
  const con = await ethers.deployContract("Controller");
  await con.waitForDeployment();

  console.log("Address: " + (await con.getAddress()));
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// contract 0x754B75A0c622bB5f3Da5068636596aC0F2ca2e73
