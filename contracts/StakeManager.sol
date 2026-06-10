// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract StakeManager {
    mapping(address => uint256) public totalStaked;

    event Staked(address indexed staker, address indexed creator, uint256 amount);

    function stake(address creator) external payable {
        require(msg.value > 0, "Must stake ETH");
        totalStaked[creator] += msg.value;
        emit Staked(msg.sender, creator, msg.value);
    }

    function getTotalStaked(address creator) external view returns (uint256) {
        return totalStaked[creator];
    }
}
