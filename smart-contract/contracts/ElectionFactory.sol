/*
Copyright SecureKey Technologies Inc. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

pragma solidity ^0.8.16;

import "./Election.sol";

contract ElectionFactory {

    struct RichElection {
        Election election;
        address manager;
    }

    RichElection[] private elections;

    event ElectionsUpdated(address addr, RichElection[] elections);

    function createElection(
        string[] memory options,
        uint256 subscriptionPayment,
        address manager
    ) public payable {
        Election election = new Election{value: msg.value}(
            options,
            subscriptionPayment,
            manager
        );
        elections.push(RichElection(election, manager));
        emit ElectionsUpdated(address(this), elections);
    }

    function removeElection(uint256 index) public {
        require(index < elections.length, "Not a valid index");

        address manager = elections[index].manager;
        require(msg.sender == manager, "Not the election manager");

        elections[index].election.closeElection();
        for (uint256 i = index; i < elections.length - 1; i++) {
            elections[i] = elections[i + 1];
        }
        elections.pop();
        emit ElectionsUpdated(address(this), elections);
    }

    function getElections() public view returns (RichElection[] memory) {
        return elections;
    }
}
