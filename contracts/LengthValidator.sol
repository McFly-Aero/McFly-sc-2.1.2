pragma solidity ^0.4.18;

/**
 * Copyright (c) 2018 McFly.aero
 * author: Dmitriy Khizhinskiy
 * license: "MIT"
 */

contract LengthValidator {
    /**
     * ERC20 Short Address Attack - fix
     */
    modifier valid_short(uint _cntArgs) {
        assert(msg.data.length == (_cntArgs * 32 + 4));
        _;
    }
}