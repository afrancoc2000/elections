export class Election {
  public address: string;
  public owner: string;
  public manager: string;
  public state: number;
  public options: string[];
  public subscriptions: number;
  public totalVotes: number;
  public votes: number[];

  constructor() {
    this.address = "";
    this.owner = "";
    this.manager = "";
    this.state = 0;
    this.options = [];
    this.subscriptions = 0;
    this.totalVotes = 0;
    this.votes = [];
  }
}
