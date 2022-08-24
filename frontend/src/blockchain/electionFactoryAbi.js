const electionAbi = [
  {
    inputs: [
      {
        internalType: "string[]",
        name: "options",
        type: "string[]",
      },
      {
        internalType: "uint256",
        name: "subscriptionPayment",
        type: "uint256",
      },
    ],
    name: "createElection",
    outputs: [],
    stateMutability: "payable",
    type: "function",
    payable: true,
  },
  {
    inputs: [],
    name: "getElections",
    outputs: [
      {
        internalType: "contract Election[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
];

export default electionAbi;
