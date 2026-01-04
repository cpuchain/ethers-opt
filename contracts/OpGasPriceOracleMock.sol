// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OpGasPriceOracleMock {
    uint256 public immutable multiplier;

    constructor(uint256 _multiplier) {
        multiplier = _multiplier;
    }

    function getL1Fee(bytes memory _data) external view returns (uint256) {
        return _data.length * multiplier;
    }
}
