let ElectionFactory = artifacts.require("./ElectionFactory.sol");

contract("ElectionFactory", function (accounts) {
  let electionFactory;
  let owner;

  const electionBudget = 0.1;
  const subscriptionFee = 0.05;

  beforeEach(async function () {
    owner = accounts[0];
    electionFactory = await ElectionFactory.new({ from: owner });
  });

  it("has no elections by default", async function () {
    let elections = await electionFactory.getElections.call();
    expect(elections).to.deep.equal([]);
  });

  it("can create a new election", async function () {
    await electionFactory.createElection(
      ["burguer", "pizza"],
      toWei(subscriptionFee),
      { from: owner, value: toWei(electionBudget) }
    );

    let elections = await electionFactory.getElections.call();
    expect(elections.length).to.equal(1);
  });

  it("can remove an election", async function () {
    await electionFactory.createElection(
      ["burguer", "pizza"],
      toWei(subscriptionFee),
      { from: owner, value: toWei(electionBudget) }
    );

    let elections = await electionFactory.getElections.call();
    expect(elections.length).to.equal(1);
    
    await electionFactory.removeElection(0);
    elections = await electionFactory.getElections.call();
    expect(elections.length).to.equal(0);
  });

  function toWei(number) {
    return web3.utils.toWei(String(number), "ether");
  }
});
