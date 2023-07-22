import {} from "../typechain-types/contracts/Controller";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

enum OrderType {
  BUY = "BUY",
  SELL = "SELL",
}

enum AccountType {
  RETIREMENT = "RETIREMENT",
  INSTITUTIONAL = "INSTITUTIONAL",
}

enum Direction {
  LONG = 0,
  SHORT = 1,
}

export interface Reveal {
  tickerSymbol: string;
  orderType: OrderType;
  accountType: AccountType;
  quantity: number;
  price: number;
  timeInForce: number;
  direction: Direction;
}

const abiCoder = new ethers.AbiCoder();
const keccak256 = ethers.keccak256;

describe("Controller", function () {
  async function deployFixture() {
    const [admin, notAdmin] = await ethers.getSigners();

    const Controller = await ethers.getContractFactory("Controller");
    const controller = await Controller.deploy();

    const commit: Reveal = {
      tickerSymbol: "NVDA",
      orderType: OrderType.BUY,
      accountType: AccountType.INSTITUTIONAL,
      quantity: 1550,
      price: 445,
      timeInForce: new Date(2023, 7, 22, 23, 12, 6).getTime(),
      direction: Direction.LONG,
    };

    return { controller, commit, notAdmin };
  }

  describe("Commit", async function () {
    it("Should make a commit", async () => {
      const { controller, commit } = await loadFixture(deployFixture);

      const hash = keccak256(
        abiCoder.encode(
          ["string", "string", "string", "uint", "uint", "uint", "uint"],
          [
            commit.tickerSymbol,
            commit.orderType,
            commit.accountType,
            commit.quantity,
            commit.price,
            commit.timeInForce,
            commit.direction,
          ]
        )
      );

      console.log({ hash });

      await controller.commit(hash);

      const savedCommit = await controller.commitments(hash);

      expect(savedCommit).to.deep.equal([hash, false, BigInt(2)]);
    });
  });

  describe("Reveal", async function () {
    it("Should reveal when valid commit", async () => {
      const { controller, commit } = await loadFixture(deployFixture);

      const hash = keccak256(
        abiCoder.encode(
          ["string", "string", "string", "uint", "uint", "uint", "uint"],
          [
            commit.tickerSymbol,
            commit.orderType,
            commit.accountType,
            commit.quantity,
            commit.price,
            commit.timeInForce,
            commit.direction,
          ]
        )
      );

      console.log({ commit });

      await controller.commit(hash);

      await controller.reveal(
        commit.tickerSymbol,
        commit.orderType,
        commit.accountType,
        commit.quantity,
        commit.price,
        commit.timeInForce,
        commit.direction
      );

      const revealedCommit = await controller.commitments(hash);

      expect(revealedCommit[1] /* revealed */).to.be.true;
    });

    it("Should revert when invalid commit", async () => {
      const { controller, commit } = await loadFixture(deployFixture);

      const hash = keccak256(
        abiCoder.encode(
          ["string", "string", "string", "uint", "uint", "uint", "uint"],
          [
            commit.tickerSymbol,
            commit.orderType,
            commit.accountType,
            1,
            commit.price,
            commit.timeInForce,
            commit.direction,
          ]
        )
      );

      await controller.commit(hash);

      await expect(
        controller.reveal(
          commit.tickerSymbol,
          commit.orderType,
          commit.accountType,
          commit.quantity,
          commit.price,
          commit.timeInForce,
          commit.direction
        )
      ).to.be.revertedWithCustomError(controller, "RevealDoesNotMatch");
    });
  });

  describe("Authorize Inspector", function () {
    it("Should revert if the caller is not the owner", async () => {
      const { controller, notAdmin } = await loadFixture(deployFixture);

      const newInspector = ethers.Wallet.createRandom().address;

      await expect(
        controller.connect(notAdmin).authorizeInspector(newInspector)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should return false if not authorized inspector", async () => {
      const { controller } = await loadFixture(deployFixture);

      const newInspector = ethers.Wallet.createRandom().address;
      const isInspector = await controller.authorizedInspectors(newInspector);

      expect(isInspector).to.be.false;
    });

    it("Should add an authorized inspector", async () => {
      const { controller } = await loadFixture(deployFixture);

      const newInspector = ethers.Wallet.createRandom().address;

      await controller.authorizeInspector(newInspector);

      const isInspector = await controller.authorizedInspectors(newInspector);

      expect(isInspector).to.be.true;
    });
  });
});
