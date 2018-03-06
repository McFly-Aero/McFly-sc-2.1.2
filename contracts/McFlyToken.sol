pragma solidity ^0.4.19;

/**
 * Copyright (c) 2018 McFly.aero
 * author: Dmitriy Khizhinskiy
 * license: "MIT"
 */

import './MintableToken.sol';

contract McFlyToken is MintableToken {

    string public constant name = "McFlyToken";
    string public constant symbol = "McFly";
    uint8 public constant decimals = 18;

    mapping(address=>bool) whitelist;

    event AllowTransfer(address from);

    modifier canTransfer() {
        require(mintingFinished || whitelist[msg.sender]);
        _;        
    }

    function allowTransfer(address from) onlyOwner public {
        AllowTransfer(from);
        whitelist[from] = true;
    }

    function transferFrom(address from, address to, uint256 value) canTransfer public returns (bool) {
        return super.transferFrom(from, to, value);
    }

    function transfer(address to, uint256 value) canTransfer public returns (bool) {
        return super.transfer(to, value);
    }
}

