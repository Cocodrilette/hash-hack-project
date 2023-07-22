// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Controller is Ownable {

    event makeCommit(bytes32 indexed hash, uint indexed blockNumber);
    event makeReveal(bytes32 indexed hash, uint indexed blockNumber);

    struct Commitment {
        bytes32 hash;
        bool complete;
    }

    enum Direction {
        Short, 
        Long
    }

    mapping(bytes32 => Commitment) public commitments;
    mapping(bytes32 => bool) public revealed;

    function commit(bytes32 hashOfOrder) external onlyOwner {
        Commitment memory com = Commitment({
            hash : hashOfOrder,
            complete : false
        });
        
        commitments[hashOfOrder] = com;

        emit makeCommit(hashOfOrder,block.number);
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
        require(hash == commitments[hash].hash);

        commitments[hash].complete = true;
        revealed[hash] = true;

        emit makeReveal(hash,block.number);
    }
    
}
