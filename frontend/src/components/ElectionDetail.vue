<script setup lang="ts">
import { onMounted, reactive } from "vue";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import router from "../router";
import { Election } from "../models/election";

const inWrongStateError = (state: number) => {
  const stateLabel = getStateLabel(state);
  return `Para iniciar la votación, esta debe encontrarse en estado '${stateLabel}'.`;
};
const authorizeError = "No tiene permisos para iniciar la votación.";

const props = defineProps({
  address: String,
});

const stateLabel = ["Iniciado", "Subscripciones", "Votaciones", "Resultados"];

const electionAbi = JSON.parse(import.meta.env.VITE_ELECTION_ABI);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = reactive({
  provider: {},
  web3: {},
  electionContract: {},
  accounts: [],
  currentAccount: "",
  election: Election,
  showErrorAlert: false,
  errorAlertMessage: "",
});

onMounted(async () => {
  data.provider = await detectEthereumProvider();
  console.log(`provider: ${data.provider}`);

  if (!data.provider) {
    router.push("/");
    return;
  }

  data.web3 = new Web3(Web3.givenProvider);
  data.accounts = await data.provider.request({ method: "eth_accounts" });
  handleAccountsChanged(data.accounts);
});

function handleAccountsChanged(accounts: string[]) {
  if (accounts.length === 0) {
    console.log("Please connect to MetaMask.");
    return;
  }

  if (accounts[0] !== data.currentAccount) {
    data.currentAccount = data.web3.utils.toChecksumAddress(accounts[0]);
    console.log(`connected with account ${data.currentAccount}`);
    getContract();
  }
}

async function getContract() {
  data.electionContract = new data.web3.eth.Contract(
    electionAbi,
    data.web3.utils.toChecksumAddress(props.address),
    { from: data.currentAccount }
  );

  data.election = new Election();
  data.election.owner = await data.electionContract.methods.getOwner().call();
  data.election.manager = await data.electionContract.methods
    .getManager()
    .call();
  data.election.state = Number(
    await data.electionContract.methods.getState().call()
  );
  data.election.options = await data.electionContract.methods
    .getOptions()
    .call();
  data.election.subscriptions = await data.electionContract.methods
    .getSubscriptions()
    .call();
  data.election.totalVotes = await data.electionContract.methods
    .getTotalVotes()
    .call();
  data.election.votes = await data.electionContract.methods.getVotes().call();
  console.log("votes: " + data.election.votes + " " + data.election.votes[1]);

  data.electionContract.events.SubscriptionFinished(
    { fromBlock: 0 },
    onSubscriptionFinished
  );
  data.electionContract.events.VotingFinished(
    { fromBlock: 0 },
    onVotingFinished
  );
  data.electionContract.events.UserSubscribed(
    { fromBlock: 0 },
    onUserSubscribed
  );
  data.electionContract.events.UserVoted({ fromBlock: 0 }, onUserVoted);
}

function onSubscriptionFinished() {
  data.election.state = 2;
}

function onVotingFinished() {
  data.election.state = 3;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onUserSubscribed(event: any) {
  data.election.totalSubscriptions = event.returnValues.totalSubscriptions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onUserVoted(event: any) {
  data.election.totalVotes = event.returnValues.totalVotes;
}

function isManager() {
  return data.currentAccount === data.election.manager;
}

function getStateLabel(state: number) {
  if (state < stateLabel.length) {
    return stateLabel[state];
  } else {
    console.log(`No se reconoce el estado: ${data.election.state}`);
    return "Desconocido";
  }
}

function alert(message: string) {
  data.errorAlertMessage = message;
  data.showErrorAlert = true;
}

async function startSubscribing() {
  data.electionContract.methods
    .startSubscribing()
    .send({ from: data.currentAccount });

  try {
    await data.electionContract.methods
      .startSubscribing()
      .send({ from: data.currentAccount });

    data.election.state = Number(
      await data.electionContract.methods.getState().call()
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.message.includes("Invalid State")) {
      alert(inWrongStateError(0));
    } else if (error.message.includes("Not a manager")) {
      alert(authorizeError);
    }
  }
}

async function startVoting() {
  try {
    await data.electionContract.methods
      .startVoting()
      .send({ from: data.currentAccount });

    data.election.state = Number(
      await data.electionContract.methods.getState().call()
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.message.includes("Invalid State")) {
      alert(inWrongStateError(1));
    } else if (error.message.includes("Not a manager")) {
      alert(authorizeError);
    }
  }
}

async function stopVoting() {
  try {
    await data.electionContract.methods
      .stopVoting()
      .send({ from: data.currentAccount });

    data.election.state = Number(
      await data.electionContract.methods.getState().call()
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.message.includes("Invalid State")) {
      alert(inWrongStateError(2));
    } else if (error.message.includes("Not a manager")) {
      alert(authorizeError);
    }
  }
}

async function subscribe() {
  data.electionContract.methods.subscribe().send({ from: data.currentAccount });
}

function getVotes(option: number) {
  if (
    Array.isArray(data.election.votes) &&
    option < data.election.votes.length
  ) {
    return data.election.votes[option];
  }
  return 0;
}
</script>

<template>
  <div class="about">
    <v-container class="py-8 px-6" fluid>
      <v-row>
        <v-col cols="12">
          <v-alert
            v-model="data.showErrorAlert"
            closable
            close-label="Cerrar"
            density="comfortable"
            type="error"
            variant="tonal"
            title="Error en la aplicación"
          >
            {{ data.errorAlertMessage }}
          </v-alert>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="6">
          <v-container class="ma-0 pa-0">
            <v-row>
              <v-col cols="12">
                <v-card>
                  <v-card-title>Estado</v-card-title>
                  <v-card-text>
                    <p class="text-h3 text-left">
                      {{ getStateLabel(data.election.state) }}
                    </p>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="6">
                <v-card height="170px">
                  <v-card-title>Personas inscritas</v-card-title>
                  <div>
                    <p class="text-h1 text-center ma-3">
                      {{ data.election.subscriptions }}
                    </p>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="6">
                <v-card height="170px">
                  <v-card-title>Votos realizados</v-card-title>
                  <div>
                    <p class="text-h1 text-center ma-3">
                      {{ data.election.totalVotes }}
                    </p>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12">
                <v-card>
                  <v-card-title>Acciones</v-card-title>
                  <v-card-actions>
                    <v-btn
                      @click="startSubscribing()"
                      v-if="isManager() && data.election.state === 0"
                    >
                      <template v-slot:prepend>
                        <v-icon>mdi-ballot</v-icon>
                      </template>
                      Iniciar subscripciones
                    </v-btn>

                    <v-btn
                      @click="startVoting()"
                      v-if="isManager() && data.election.state === 1"
                    >
                      <template v-slot:prepend>
                        <v-icon>mdi-vote</v-icon>
                      </template>
                      Iniciar votaciones
                    </v-btn>

                    <v-btn
                      @click="stopVoting()"
                      v-if="isManager() && data.election.state === 2"
                    >
                      <template v-slot:prepend>
                        <v-icon>mdi-alarm</v-icon>
                      </template>
                      Terminar votaciones
                    </v-btn>

                    <v-btn
                      @click="subscribe()"
                      v-if="data.election.state === 1"
                    >
                      <template v-slot:prepend>
                        <v-icon>mdi-hand</v-icon>
                      </template>
                      ¡Quiero Subscribirme!
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </v-col>

        <v-col cols="6">
          <v-card>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-container>
                    <v-row>
                      <v-col cols="6">
                        <v-img src="/src/assets/pizza.jpg" alt="Pizza" />
                      </v-col>
                      <v-col cols="6" :align-self="'center'">
                        <div>
                          <p class="text-h1 text-center ma-3">
                            {{ getVotes(0) }}
                          </p>
                          <p class="text-center">
                            <v-btn
                              @click="subscribe()"
                              v-if="data.election.state === 2"
                            >
                              <template v-slot:prepend>
                                <v-icon>mdi-pizza</v-icon>
                              </template>
                              ¡Quiero Pizza!
                            </v-btn>
                          </p>
                        </div>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-col>

                <v-col cols="12">
                  <v-container>
                    <v-row>
                      <v-col cols="6">
                        <v-img
                          src="/src/assets/hamburguesa.jpg"
                          alt="Hamburguesa"
                        />
                      </v-col>
                      <v-col cols="6" :align-self="'center'">
                        <div>
                          <p class="text-h1 text-center ma-3">
                            {{ getVotes(1) }}
                          </p>
                          <p class="text-center">
                            <v-btn
                              @click="subscribe()"
                              v-if="data.election.state === 2"
                            >
                              <template v-slot:prepend>
                                <v-icon>mdi-food</v-icon>
                              </template>
                              ¡Hamburguesa!
                            </v-btn>
                          </p>
                        </div>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-col>
              </v-row>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
