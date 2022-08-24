/*
Copyright SecureKey Technologies Inc. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

pragma solidity ^0.8.16;

contract Election {
    enum State {
        Started,
        Subscribing,
        Voting,
        Finished
    }

    event SubscriptionFinished(address addr, bool outOfBudget);
    event VotingFinished(address addr, uint256[] votes);

    event UserSubscribed(address addr, address userAddress, uint totalSubscribers);
    event UserVoted(address addr, address userAddress, uint totalVotes);


    address public owner;
    State public state;
    uint256 subscriptionPayment;
    uint256 subscribers;

    uint256[] votes;
    string[] options;
    mapping(address => bool) hasVoted;
    mapping(address => bool) hasSubscribed;

    modifier inState(State expectedState) {
        require(state == expectedState, "Invalid State");
        _;
    }

    modifier isOwner() {
        require(msg.sender == owner, "Not an owner");
        _;
    }

    constructor(string[] memory _options, uint256 _subscriptionPayment)
        payable
    {
        options = _options;
        votes = new uint256[](options.length);
        owner = msg.sender;
        state = State.Started;
        subscriptionPayment = _subscriptionPayment;
    }

    function subscribe() public inState(State.Subscribing) {
        require(!hasSubscribed[msg.sender], "Account has already subscribed");
        hasSubscribed[msg.sender] = true;
        subscribers++;
        payable(msg.sender).transfer(subscriptionPayment);

        if (address(this).balance < subscriptionPayment) {
            emit SubscriptionFinished(address(this), true);
            state = State.Voting;
            payable(owner).transfer(address(this).balance);
        }
        emit UserSubscribed(address(this), msg.sender, subscribers);
    }

    function vote(uint256 option) public inState(State.Voting) {
        require(0 <= option && option < options.length, "Invalid option");
        require(hasSubscribed[msg.sender], "Account has not subscribed");
        require(!hasVoted[msg.sender], "Account has already voted");
        votes[option] = votes[option] + 1;
        hasVoted[msg.sender] = true;

        uint totalVotes = getTotalVotes();
        if (totalVotes == subscribers) {
            emit VotingFinished(address(this), votes);
            state = State.Finished;
        }
        emit UserVoted(address(this), msg.sender, totalVotes);
    }

    function startSubscribing() public inState(State.Started) isOwner {
        state = State.Subscribing;
    }

    function startVoting() public inState(State.Subscribing) isOwner {
        emit SubscriptionFinished(address(this), false);
        state = State.Voting;
    }

    function stopVoting() public inState(State.Voting) isOwner {
        emit VotingFinished(address(this), votes);
        state = State.Finished;
    }

    function closeElection() public isOwner {
        selfdestruct(payable(owner));
    }

    function getTotalVotes() public view returns (uint256) {
        uint256 totalVotes;
        for (uint256 i = 0; i < votes.length; i++) {
            totalVotes = totalVotes + votes[i];
        }
        return totalVotes;
    }

    function getOptions() public view returns (string[] memory) {
        return options;
    }

    function getVotes() public view returns (uint256[] memory) {
        return votes;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
