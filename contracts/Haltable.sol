pragma solidity ^0.4.19;

/**
 * Copyright (c) 2018 McFly.aero
 * author: Dmitriy Khizhinskiy
 * license: "MIT"
 */

import './MultiOwners.sol';
import './SafeMath.sol';

contract Haltable is MultiOwners {
    bool public halted;

    modifier stopInEmergency {
        require(!halted);
        _;
    }

    modifier onlyInEmergency {
        require(halted);
        _;
    }

    // called by the owner on emergency, triggers stopped state
    function halt() external onlyOwner {
        halted = true;
    }

    // called by the owner on end of emergency, returns to normal state
    function unhalt() external onlyOwner onlyInEmergency {
        halted = false;
    }

}
