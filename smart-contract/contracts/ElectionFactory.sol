/*
Copyright SecureKey Technologies Inc. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

pragma solidity ^0.8.16;

import "./Election.sol";

contract ElectionFactory {
    Election[] private elections;

    function createElection(
        string[] memory options,
        uint256 subscriptionPayment, 
        address manager
    ) public payable {
        Election election = new Election{value: msg.value}(options, subscriptionPayment, manager);
        elections.push(election);
    }

    function getElections() public view returns (Election[] memory) {
        return elections;
    }

    function removeElection(uint256 index) public {
        if (index >= elections.length) return;
        
        elections[index].closeElection();
        for (uint256 i = index; i < elections.length - 1; i++) {
            elections[i] = elections[i + 1];
        }
        elections.pop();
    }
}
