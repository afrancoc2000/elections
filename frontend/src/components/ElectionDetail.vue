<script setup lang="ts">
import { onMounted, reactive } from "vue";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import router from "../router";
import { Election } from "../models/election";

const electionAbi = JSON.parse(import.meta.env.VITE_ELECTION_ABI);
const stateLabel = ["Iniciado", "Subscripciones", "Votaciones", "Resultados"];
const yesNoLabel = (value: boolean) => {
  return value ? "Si" : "No";
};

const inWrongStateError = (state: number) => {
  const stateLabel = getStateLabel(state);
  return `Para iniciar la votación, esta debe encontrarse en estado '${stateLabel}'.`;
};
const authorizeError = "No tiene permisos para iniciar la votación.";

const props = defineProps({
  address: String,
});

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
  pizzaDialog: false,
  burguerDialog: false,
  tieDialog: false,
});

onMounted(async () => {
  data.provider = await detectEthereumProvider();
  data.provider.on("accountsChanged", onAccountsChange);

  if (!data.provider) {
    router.push("/");
    return;
  }

  data.web3 = new Web3(Web3.givenProvider);
  data.accounts = await data.provider.request({ method: "eth_accounts" });

  await handleAccountsChanged(data.accounts);
});

async function handleAccountsChanged(accounts: string[]) {
  if (accounts.length === 0) {
    router.push("/");
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
  data.election.manager = await data.electionContract.methods.getManager().call();
  data.election.state = Number(await data.electionContract.methods.getState().call());
  data.election.options = await data.electionContract.methods.getOptions().call();
  data.election.subscriptions = await data.electionContract.methods.getSubscriptions().call();
  data.election.totalVotes = await data.electionContract.methods.getTotalVotes().call();
  data.election.votes = await data.electionContract.methods.getVotes().call();
  data.election.hasSubscribed = await data.electionContract.methods.getHasSubscribed().call();
  data.election.hasVoted = await data.electionContract.methods.getHasVoted().call();
  data.election.balance = await data.electionContract.methods.getBalance().call();

  data.electionContract.events.StateChanged({}, onStateChanged);
  data.electionContract.events.UserSubscribed({}, onUserSubscribed);
  data.electionContract.events.UserVoted({}, onUserVoted);
}

async function onAccountsChange() {
  data.accounts = await data.provider.request({ method: "eth_accounts" });
  handleAccountsChanged(data.accounts);
}

async function onStateChanged(error: Error, event: any) {
  data.election.state = Number(event.returnValues.newState);
  if (data.election.state === 3) {
    data.election.votes = await data.electionContract.methods.getVotes().call();
    if (Number(data.election.votes[0]) > Number(data.election.votes[1])) {
      data.pizzaDialog = true;
    } else if (Number(data.election.votes[0]) < Number(data.election.votes[1])) {
      data.burguerDialog = true;
    } else {
      data.tieDialog = true;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function onUserSubscribed(error: Error, event: any) {
  data.election.subscriptions = event.returnValues.totalSubscriptions;
  data.election.hasSubscribed = await data.electionContract.methods.getHasSubscribed().call();
  data.election.balance = await data.electionContract.methods.getBalance().call();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function onUserVoted(error: Error, event: any) {
  data.election.totalVotes = event.returnValues.totalVotes;
  data.election.votes = event.returnValues.votes;
  data.election.hasVoted = await data.electionContract.methods.getHasVoted().call();
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

async function vote(value: number) {
  data.electionContract.methods.vote(value).send({ from: data.currentAccount });
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

function toEher(value: number) {
  if (!value) {
    return 0;
  }
  return data.web3.utils.fromWei(String(value), "ether");
}
</script>

<template>
  <div class="about">
    <v-container class="py-8 px-6" fluid>
      <v-row>
        <v-col cols="12">
          <v-alert v-model="data.showErrorAlert" closable close-label="Cerrar" density="comfortable" type="error"
            variant="tonal" title="Error en la aplicación">
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
                    <p class="text-h3 text-left pb-2">
                      {{ getStateLabel(data.election.state) }}
                    </p>
                    <v-divider></v-divider>
                    <p class="text-subtitle-2 text-left pt-2">
                      Balance: {{ toEher(data.election.balance) }} | Inscrito:
                      {{ yesNoLabel(data.election.hasSubscribed) }} | Voto:
                      {{ yesNoLabel(data.election.hasVoted) }}
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
                    <v-btn @click="startSubscribing()" v-if="isManager() && data.election.state === 0">
                      <template v-slot:prepend>
                        <v-icon>mdi-ballot</v-icon>
                      </template>
                      Iniciar subscripciones
                    </v-btn>

                    <v-btn @click="startVoting()" v-if="isManager() && data.election.state === 1">
                      <template v-slot:prepend>
                        <v-icon>mdi-vote</v-icon>
                      </template>
                      Iniciar votaciones
                    </v-btn>

                    <v-btn @click="stopVoting()" v-if="isManager() && data.election.state === 2">
                      <template v-slot:prepend>
                        <v-icon>mdi-alarm</v-icon>
                      </template>
                      Terminar votaciones
                    </v-btn>

                    <v-btn @click="subscribe()" v-if="data.election.state === 1 && !data.election.hasSubscribed">
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
                        <v-img src="/pizza.jpg" alt="Pizza"></v-img>
                      </v-col>
                      <v-col cols="6" :align-self="'center'">
                        <div>
                          <p class="text-h1 text-center ma-3">
                            {{ getVotes(0) }}
                          </p>
                          <p class="text-center">
                            <v-btn @click="vote(0)" v-if="data.election.state === 2 && !data.election.hasVoted">
                              <template v-slot:prepend>
                                <v-icon>mdi-pizza</v-icon>
                              </template>
                              ¡Quiero Pizza!
                            </v-btn>
                            <span v-else class="text-h5">Amantes de la pizza</span>
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
                        <v-img src="/hamburguesa.jpg" alt="Hamburguesa" />
                      </v-col>
                      <v-col cols="6" :align-self="'center'">
                        <div>
                          <p class="text-h1 text-center ma-3">
                            {{ getVotes(1) }}
                          </p>
                          <p class="text-center">
                            <v-btn @click="vote(1)" v-if="data.election.state === 2 && !data.election.hasVoted">
                              <template v-slot:prepend>
                                <v-icon>mdi-food</v-icon>
                              </template>
                              ¡Hamburguesa!
                            </v-btn>
                            <span v-else class="text-h5">Fans de hamburguesas</span>
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

    <v-dialog v-model="data.pizzaDialog" max-width="640">
      <v-card elevation="10">
        <v-img src="/pizza.jpg"></v-img>
        <v-card-title class="text-h5"> Y el ganador es... ¡La Pizza! </v-card-title>
        <v-card-text>
          La pizza gana a la hamburguesa en la carrera por el trono del alimento más consumido del planeta. Originaria
          de Italia, se ha extendido con éxito por todo el mundo gracias a su relativamente fácil preparación y la
          comodidad de su consumo. Más de 5.000 millones de pizzas son vendidas actualmente alrededor del mundo.
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="green darken-1" text @click="data.pizzaDialog = false">
            Aceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="data.burguerDialog" max-width="640">
      <v-card elevation="10">
        <v-img src="/hamburguesa.jpg"></v-img>
        <v-card-title class="text-h5"> Y el ganador es... ¡La Hamburguesa! </v-card-title>
        <v-card-text>
          La hamburguesa se encuentra en el top de comidas preferidas, en competencia con la pizza. Y es lógico que
          te guste tanto, el contraste de sabores, de salsas, los numerosos condimentos, la jugosa carne, todo esto
          envuelto entre dos rebanadas de un delicioso pan. ¿Quién se puede resistir?
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="green darken-1" text @click="data.burguerDialog = false">
            Aceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="data.tieDialog" max-width="640">
      <v-card elevation="10">
        <v-img src="/empate.jpg"></v-img>
        <v-card-title class="text-h5"> Es increible... ¡Tenemos un empate! </v-card-title>
        <v-card-text>
          No somos los primeros en intentar descifrar esta competencia, pero ¿qué más podíamos esperar? Nos encontramos
          frente a dos platos irresistibles que son el sueño de grandes y chicos, que mejor que una tarde entre amigos
          con una buena cerveza y cualquiera de estos dos platos. No los pongamos a competir, ¡disfrutemos de ambos!
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="green darken-1" text @click="data.tieDialog = false">
            Aceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
  <img src="../assets/hamburguesa.jpg" class="d-none" />
  <img src="../assets/pizza.jpg" class="d-none" />
  <img src="../assets/empate.jpg" class="d-none" />
</template>
