import { web3 } from "./web3";
import electionFactoryAbi from "./electionFactoryAbi";
import electionFactoryAddress from "./electionFactoryAddress";

export function createContract() {
  return new web3.eth.Contract(electionFactoryAbi, electionFactoryAddress);
}
