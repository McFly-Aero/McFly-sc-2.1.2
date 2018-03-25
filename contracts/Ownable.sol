pragma solidity ^0.4.19;

/**
 * @title Ownable smart contract
 * @author Copyright (c) 2016 Smart Contract Solutions, Inc.
 * @author "Manuel Araoz <manuelaraoz@gmail.com>"
 * @dev license: "MIT", source: https://github.com/OpenZeppelin/zeppelin-solidity
 * @author modification: Dmitriy Khizhinskiy @McFly.aero
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address public owner;
    address public candidate;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
    * @dev The Ownable constructor sets the original `owner` of the contract to the sender
    * account.
    */
    function Ownable() public {
        owner = msg.sender;
    }


    /**
    * @dev Throws if called by any account other than the owner.
    */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }


    /**
    * @dev Allows the current owner to _request_ transfer control of the contract to a newOwner.
    * @param newOwner The address to transfer ownership to.
    */
    function requestOwnership(address newOwner) onlyOwner public {
        require(newOwner != address(0));
        candidate = newOwner;
    }


    /**
    * @dev Allows the _NEW_ candidate to complete transfer control of the contract to him.
    */
    function confirmOwnership() public {
        require(candidate == msg.sender);
        OwnershipTransferred(owner, candidate);
        owner = candidate;
    }
}
