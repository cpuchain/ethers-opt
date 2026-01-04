// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from 'openzeppelin-contracts/access/Ownable.sol';

/// @dev Test remappings
contract OwnableTest is Ownable {
    constructor() Ownable(msg.sender) {}
}
