pragma solidity 0.4.19;

import "./MintableToken.sol";

/**
 * @title McFly token smart contract
 * @author Copyright (c) 2018 McFly.aero
 * @author Dmitriy Khizhinskiy
 * @author "MIT"
 */
contract McFlyToken is MintableToken {
    string public constant name = "McFlyToken";
    string public constant symbol = "McFly";
    uint8 public constant decimals = 18;

    /// @dev mapping for whitelist
    mapping(address=>bool) whitelist;

    /// @dev event throw when allowed to transfer address added to whitelist
    /// @param from address
    event AllowTransfer(address from);

    /// @dev check for allowence of transfer
    modifier canTransfer() {
        require(mintingFinished || whitelist[msg.sender]);
        _;        
    }

    /// @dev add address to whitelist
    /// @param from address to add
    function allowTransfer(address from) onlyOwner public {
        whitelist[from] = true;
        AllowTransfer(from);
    }

    /// @dev Do the transfer from address to address value
    /// @param from address from
    /// @param to address to
    /// @param value uint256
    function transferFrom(address from, address to, uint256 value) canTransfer public returns (bool) {
        return super.transferFrom(from, to, value);
    }

    /// @dev Do the transfer from token address to "to" address value
    /// @param to address to
    /// @param value uint256 value
    function transfer(address to, uint256 value) canTransfer public returns (bool) {
        return super.transfer(to, value);
    }
}

