let Election = artifacts.require("./Election.sol");

contract("Election", function (accounts) {
  let election;
  let owner;
  let voter1;
  let voter2;
  let manager;

  const electionBudget = 0.1;
  const subscriptionFee = 0.05;

  beforeEach(async function () {
    owner = accounts[0];
    voter1 = accounts[1];
    voter2 = accounts[2];
    manager = accounts[3];
    election = await Election.new(
      ["burguer", "pizza"],
      toWei(subscriptionFee),
      manager,
      {
        from: owner,
        value: toWei(electionBudget),
      }
    );
  });

  it("has no votes by default", async function () {
    let votes = await election.getVotes.call();
    expect(toNumbers(votes)).to.deep.equal([0, 0]);
  });

  it("has electionBudget by default", async function () {
    let balance = await election.getBalance.call();
    expect(balance).to.deep.equal(toBigNumber(toWei(electionBudget)));
  });

  it("has state Started by default", async function () {
    let state = await election.getState.call();
    expect(state.toNumber()).to.equal(0);
  });

  it("cant subscribe in started state", async function () {
    try {
      await election.subscribe({ from: voter1 });
      fail();
    } catch (error) {
      expect(error.message).to.equal(
        "Returned error: VM Exception while processing transaction: revert Invalid State -- Reason given: Invalid State."
      );
    }
  });

  it("can not change to subscribing in started state if not manager", async function () {
    try {
      await election.startSubscribing({ from: voter1 });
      fail();
    } catch (error) {
      expect(error.message).to.equal(
        "Returned error: VM Exception while processing transaction: revert Not a manager -- Reason given: Not a manager."
      );
    }
  });

  it("can change to subscribing in started state", async function () {
    await election.startSubscribing({ from: manager });
    let state = await election.getState.call();
    expect(state.toNumber()).to.equal(1);
  });

  it("can subscribe in subscribing state, and balances change", async function () {
    const initial = Number(await web3.eth.getBalance(voter1));

    await election.startSubscribing({ from: manager });
    const receipt = await election.subscribe({ from: voter1 });

    // Obtain gas used from the receipt
    const gasUsed = Number(receipt.receipt.gasUsed);
    console.log(`GasUsed: ${gasUsed}`);
    const gasPrice = Number(receipt.receipt.effectiveGasPrice);
    console.log(`GasPrice: ${gasPrice}`);
    console.log(`Gas PxQ: ${gasPrice * gasUsed}`);

    let balance = await election.getBalance.call();
    expect(balance).to.deep.equal(
      toBigNumber(toWei(electionBudget - subscriptionFee))
    );

    const final = Number(await web3.eth.getBalance(voter1));
    expect(final).to.equal(
      initial + Number(toWei(subscriptionFee)) - gasPrice * gasUsed
    );
  });

  it("can not subscribe more than once", async function () {
    try {
      await election.startSubscribing({ from: manager });
      await election.subscribe({ from: voter1 });
      await election.subscribe({ from: voter1 });
      fail();
    } catch (error) {
      expect(error.message).to.equal(
        "Returned error: VM Exception while processing transaction: revert Account has already subscribed -- Reason given: Account has already subscribed."
      );
    }
  });

  it("changes to voting when no more budget", async function () {
    await election.startSubscribing({ from: manager });
    await election.subscribe({ from: voter1 });
    await election.subscribe({ from: voter2 });

    let state = await election.getState.call();
    expect(state.toNumber()).to.equal(2);
  });

  it("changes to voting when set by manager", async function () {
    await election.startSubscribing({ from: manager });
    await election.subscribe({ from: voter1 });
    await election.startVoting({ from: manager });

    let state = await election.getState.call();
    expect(state.toNumber()).to.equal(2);
  });

  it("fails when change to voting by not manager", async function () {
    try {
      await election.startSubscribing({ from: manager });
      await election.subscribe({ from: voter1 });
      await election.startVoting({ from: voter1 });
      fail();
    } catch (error) {
      expect(error.message).to.equal(
        "Returned error: VM Exception while processing transaction: revert Not a manager -- Reason given: Not a manager."
      );
    }
  });

  it("updates votes when voting", async function () {
    await election.startSubscribing({ from: manager });
    await election.subscribe({ from: voter1 });
    await election.subscribe({ from: voter2 });

    await election.vote(0, { from: voter1 });

    let votes = await election.getVotes.call();
    expect(toNumbers(votes)).to.deep.equal([1, 0]);
  });

  it("fails if non subscriber votes", async function () {
    try {
      await election.startSubscribing({ from: manager });
      await election.subscribe({ from: voter1 });
      await election.startVoting({ from: manager });

      await election.vote(0, { from: voter2 });
      fail();
    } catch (error) {
      expect(error.message).to.equal(
        "Returned error: VM Exception while processing transaction: revert Account has not subscribed -- Reason given: Account has not subscribed."
      );
    }
  });

  it("fails if not a valid option", async function () {
    try {
      await election.startSubscribing({ from: manager });
      await election.subscribe({ from: voter1 });
      await election.startVoting({ from: manager });

      await election.vote(5, { from: voter1 });
      fail();
    } catch (error) {
      expect(error.message).to.equal(
        "Returned error: VM Exception while processing transaction: revert Invalid option -- Reason given: Invalid option."
      );
    }
  });

  it("fails if voting more than once", async function () {
    try {
      await election.startSubscribing({ from: manager });
      await election.subscribe({ from: voter1 });
      await election.subscribe({ from: voter2 });

      await election.vote(0, { from: voter1 });
      await election.vote(0, { from: voter1 });
      fail();
    } catch (error) {
      expect(error.message).to.equal(
        "Returned error: VM Exception while processing transaction: revert Account has already voted -- Reason given: Account has already voted."
      );
    }
  });

  it("changes to finished when everyone votes", async function () {
    await election.startSubscribing({ from: manager });
    await election.subscribe({ from: voter1 });
    await election.subscribe({ from: voter2 });

    await election.vote(0, { from: voter1 });
    await election.vote(0, { from: voter2 });

    let votes = await election.getVotes.call();
    expect(toNumbers(votes)).to.deep.equal([2, 0]);

    let state = await election.getState.call();
    expect(state.toNumber()).to.equal(3);
  });

  it("changes to finished when stop voting", async function () {
    await election.startSubscribing({ from: manager });
    await election.subscribe({ from: voter1 });
    await election.subscribe({ from: voter2 });

    await election.vote(1, { from: voter1 });
    await election.stopVoting({ from: manager });

    let votes = await election.getVotes.call();
    expect(toNumbers(votes)).to.deep.equal([0, 1]);

    let state = await election.getState.call();
    expect(state.toNumber()).to.equal(3);
  });

  it("fails if changes to stop voting by not an owner", async function () {
    try {
        await election.startSubscribing({ from: manager });
        await election.subscribe({ from: voter1 });
        await election.subscribe({ from: voter2 });
    
        await election.vote(1, { from: voter1 });
        await election.stopVoting({ from: voter1 });
        fail();
    } catch (error) {
        expect(error.message).to.equal('Returned error: VM Exception while processing transaction: revert Not a manager -- Reason given: Not a manager.');
    }
  });

  it("fails if changes to stop voting in wrong state", async function () {
    try {
        await election.stopVoting({ from: manager });
        fail();
    } catch (error) {
        expect(error.message).to.equal('Returned error: VM Exception while processing transaction: revert Invalid State -- Reason given: Invalid State.');
    }
  });

  it("calculates total votes", async function () {
    await election.startSubscribing({ from: manager });
    await election.subscribe({ from: voter1 });
    await election.subscribe({ from: voter2 });

    await election.vote(0, { from: voter1 });
    await election.vote(1, { from: voter2 });

    let totalVotes = await election.getTotalVotes.call();
    expect(Number(totalVotes)).to.equal(2);
  });


  function toNumbers(bigNumbers) {
    return bigNumbers.map(function (bigNumber) {
      return bigNumber.toNumber();
    });
  }

  function toWei(number) {
    return web3.utils.toWei(String(number), "ether");
  }

  function toBigNumber(number) {
    return web3.utils.toBN(number);
  }
});
