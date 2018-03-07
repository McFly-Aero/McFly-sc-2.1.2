pragma solidity ^0.4.19;

/**
 * @title LengthValidator smart contract - fix ERC20 short address attack
 * @author Copyright (c) 2018 McFly.aero
 * @author Dmitriy Khizhinskiy
 * @author "MIT"
 */
contract LengthValidator {
    modifier valid_short(uint _cntArgs) {
        assert(msg.data.length == (_cntArgs * 32 + 4));
        _;
    }
}