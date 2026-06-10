// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CreatorRegistry {
    mapping(address => bool) public isRegistered;
    mapping(address => string) public creatorNames;

    event CreatorRegistered(address indexed creator, string name);

    function registerCreator(string calldata name, string calldata) external {
        require(!isRegistered[msg.sender], "Already registered");
        isRegistered[msg.sender] = true;
        creatorNames[msg.sender] = name;
        emit CreatorRegistered(msg.sender, name);
    }
}
