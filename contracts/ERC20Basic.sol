pragma solidity ^0.4.19;

/**
 * @title ERC20 Basic smart contract
 * @author Copyright (c) 2016 Smart Contract Solutions, Inc.
 * @author "Manuel Araoz <manuelaraoz@gmail.com>"
 * @dev Simpler version of ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/179
 * @dev license: "MIT", source: https://github.com/OpenZeppelin/zeppelin-solidity
 * @author modification: Dmitriy Khizhinskiy @McFly.aero
 */
contract ERC20Basic {
    function totalSupply() public view returns (uint256);
    function balanceOf(address who) public view returns (uint256);
    function transfer(address to, uint256 value) public returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
}