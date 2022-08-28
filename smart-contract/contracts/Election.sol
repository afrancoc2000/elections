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

    event StateChanged(address addr, State newState);
    event UserSubscribed(address addr, address userAddress, uint totalSubscriptions);
    event UserVoted(address addr, address userAddress, uint totalVotes, uint256[] votes);

    address owner;
    address manager;
    State state;
    uint256 subscriptionPayment;
    uint256 subscriptions;

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

    modifier isManager() {
        require(msg.sender == manager, "Not a manager");
        _;
    }

    constructor(string[] memory _options, uint256 _subscriptionPayment, address _manager)
        payable
    {
        options = _options;
        votes = new uint256[](options.length);
        owner = msg.sender;
        state = State.Started;
        subscriptionPayment = _subscriptionPayment;
        manager = _manager;
    }

    function subscribe() public inState(State.Subscribing) {
        require(!hasSubscribed[msg.sender], "Account has already subscribed");
        require(address(this).balance >= subscriptionPayment, "Not enough money to subscribe");
        hasSubscribed[msg.sender] = true;
        subscriptions++;
        payable(msg.sender).transfer(subscriptionPayment);

        if (address(this).balance < subscriptionPayment) {
            state = State.Voting;
            emit StateChanged(address(this), state);
            payable(owner).transfer(address(this).balance);
        }
        emit UserSubscribed(address(this), msg.sender, subscriptions);
    }

    function vote(uint256 option) public inState(State.Voting) {
        require(0 <= option && option < options.length, "Invalid option");
        require(hasSubscribed[msg.sender], "Account has not subscribed");
        require(!hasVoted[msg.sender], "Account has already voted");
        votes[option] = votes[option] + 1;
        hasVoted[msg.sender] = true;

        uint totalVotes = getTotalVotes();
        if (totalVotes == subscriptions) {
            state = State.Finished;
            emit StateChanged(address(this), state);
        }
        emit UserVoted(address(this), msg.sender, totalVotes, votes);
    }

    function startSubscribing() public inState(State.Started) isManager {
        state = State.Subscribing;
        emit StateChanged(address(this), state);
    }

    function startVoting() public inState(State.Subscribing) isManager {
        state = State.Voting;
        emit StateChanged(address(this), state);
    }

    function stopVoting() public inState(State.Voting) isManager {
        state = State.Finished;
        emit StateChanged(address(this), state);
    }

    function closeElection() public isOwner {
        selfdestruct(payable(manager));
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

    function getOwner() public view returns (address) {
        return owner;
    }

    function getManager() public view returns (address) {
        return manager;
    }

    function getState() public view returns (State) {
        return state;
    }

    function getSubscriptions() public view returns (uint256) {
        return subscriptions;
    }

    function getHasSubscribed() public view returns (bool) {
        return hasSubscribed[msg.sender];
    }

    function getHasVoted() public view returns (bool) {
        return hasVoted[msg.sender];
    }

}
