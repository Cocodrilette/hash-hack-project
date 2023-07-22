// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Controller is Ownable {

    event MakeCommit(bytes32 indexed hash, uint indexed blockNumber);
    event MakeReveal(bytes32 indexed hash, uint indexed blockNumber);
    event InspestorAuthorized(address newInspector);

    error RevealDoesNotMatch();
    error TickerExpired(bytes32 hash);

    struct Commitment {
        bytes32 hash;
        bool revealed;
        uint blockId;
    }

    struct Reveal {
        string tickerSymbol;
        string orderType;
        string accountType;
        uint quantity;
        uint price;
        uint timeInForce;
        Direction direction;
    }

    enum Direction {
        Short, 
        Long
    }

    bytes32[] public hashes;
    mapping(bytes32 => Commitment) public commitments;
    mapping(bytes32 => Reveal) public reveals;
    mapping(address => bool) public authorizedInspectors;

    constructor() {
        authorizedInspectors[msg.sender] = true;
    }

    function commit(bytes32 hashOfOrder) external onlyOwner {
        uint blockNumber = block.number;

        Commitment memory com = Commitment({
            hash: hashOfOrder,
            revealed: false,
            blockId: blockNumber
        });
        
        hashes.push(com.hash);
        commitments[hashOfOrder] = com;

        emit MakeCommit(hashOfOrder,block.number);
    }

    function reveal(
        string memory tickerSymbol,
        string memory orderType,
        string memory accountType,
        uint quantity,
        uint price,
        uint timeInForce,
        Direction direction
    ) external onlyOwner {
        bytes32 hash = keccak256(abi.encode(
            tickerSymbol,
            orderType,
            accountType,
            quantity,
            price,
            timeInForce,
            direction
        ));

        if (hash != commitments[hash].hash) revert RevealDoesNotMatch();
        if (timeInForce < block.timestamp) revert TickerExpired(hash);
        
        reveals[hash] = Reveal(
            tickerSymbol,
            orderType, 
            accountType, 
            quantity, 
            price,
            timeInForce,
            direction
        );
        commitments[hash].revealed = true;

        emit MakeReveal(hash,block.number);
    }

    function authorizeInspector(address addr) external onlyOwner {
        authorizedInspectors[addr] = true;

        emit InspestorAuthorized(addr);
    }

    function getHashes() public view onlyOwner returns(bytes32[] memory) {
        return hashes;
    }

}
