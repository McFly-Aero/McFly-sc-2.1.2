pragma solidity ^0.4.19;

import "./MultiOwners.sol";
import "./SafeMath.sol";

/**
 * @title Haltable smart contract - controls owner access
 * @author Copyright (c) 2018 McFly.aero
 * @author Dmitriy Khizhinskiy
 * @author "MIT"
 */
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


    /// @dev called by the owner on emergency, triggers stopped state
    function halt() external onlyOwner {
        halted = true;
    }


    /// @dev called by the owner on end of emergency, returns to normal state
    function unhalt() external onlyOwner onlyInEmergency {
        halted = false;
    }

}
