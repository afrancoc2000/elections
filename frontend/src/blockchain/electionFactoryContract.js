// import { web3 } from "./web3";
import electionFactoryAbi from "./electionFactoryAbi";
import electionFactoryAddress from "./electionFactoryAddress";
import Web3 from "web3";

export function createContract() {
  const web3 = new Web3(window.web3.provider);
  return new web3.eth.Contract(electionFactoryAbi, electionFactoryAddress);
}
