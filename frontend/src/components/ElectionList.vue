<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Vue from "vue";
import { reactive, onMounted } from "vue";
import router from "../router";

import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import { Election } from "../models/election";

const electionFactoryAddress = import.meta.env.VITE_ELECTION_FACTORY_ADDRESS;
const electionFactoryAbi = JSON.parse(
  import.meta.env.VITE_ELECTION_FACTORY_ABI
);

const data: any = reactive({
  contractBudget: 0,
  subscriptionValue: 0,
  valid: true,
  provider: {},
  web3: {},
  electionFactoryContract: {},
  accounts: [],
  currentAccount: "",
  elections: [],
  showErrorAlert: false,
  errorAlertMessage: "",
  instructionsDialog: false,
});

const budgetRules = [(value: unknown) => !!value || "El valor es requerido"];
const subscriptionRules = [
  (value: unknown) => !!value || "La subscripción es requerida",
  (value: number) =>
    value <= data.contractBudget ||
    "La subscripción debe ser menor que el valor del contrato",
];
const allowedProviders = ["0x64", "0x4d", "0x539"];

onMounted(async () => {
  data.provider = await detectEthereumProvider();
  data.provider.on("accountsChanged", onAccountsChange);

  if (!data.provider) {
    alert(
      "Debes tener el plugin de Metamask instalado para poder usar esta aplicación."
    );
    return;
  }

  data.web3 = new Web3(Web3.givenProvider);
  data.accounts = await data.provider.request({ method: "eth_accounts" });
  handleAccountsChanged(data.accounts);

  if (!allowedProviders.includes(data.provider.chainId)) {
    console.log("ChainID: " + data.provider.chainId);
    alert(
      "Debes conectarte a la red de Gnosis para poder usar esta aplicación."
    );
  }
});

async function onAccountsChange() {
  data.accounts = await data.provider.request({ method: "eth_accounts" });
  data.currentAccount = "";
  await handleAccountsChanged(data.accounts);
}

async function connect() {
  if (!data.provider) {
    alert(
      "Debes tener el plugin de Metamask instalado para poder usar esta aplicación. Para más información has clic en el botón de instrucciones en la sección anterior."
    );
    return;
  }

  data.accounts = await data.provider.request({
    method: "eth_requestAccounts",
  });
  handleAccountsChanged(data.accounts);
}

function isConnected() {
  return data.currentAccount !== "";
}

function alert(message: string) {
  data.errorAlertMessage = message;
  data.showErrorAlert = true;
}

async function handleAccountsChanged(accounts: string[]) {
  if (accounts.length === 0) {
    alert("Por favor conecta tu cuenta con Metamask");
    return;
  }

  if (accounts[0] !== data.currentAccount) {
    data.currentAccount = data.web3.utils.toChecksumAddress(accounts[0]);
    console.log(`connected with account ${data.currentAccount}`);
    getContract();
    await getElections();
  }
}

function getContract() {
  data.electionFactoryContract = new data.web3.eth.Contract(
    electionFactoryAbi,
    data.web3.utils.toChecksumAddress(electionFactoryAddress),
    { from: data.currentAccount }
  );
  data.electionFactoryContract.events.ElectionsUpdated({}, onElectionsUpdated);
}

async function getElections() {
  const electionAddresses = await data.electionFactoryContract.methods
    .getElections()
    .call();

  if (electionAddresses === null) {
    data.elections = [];
    return;
  }

  data.elections = buildElections(electionAddresses);
  console.log(`election addresses: ${JSON.stringify(electionAddresses)}`);
}

function buildElections(electionAddresses: string[][]) {
  return electionAddresses.map((richElection: string[]) => {
    const election = new Election();
    election.address = richElection[0];
    election.manager = richElection[1];
    return election;
  });
}

function onElectionsUpdated(error: Error, event: any) {
  data.elections = buildElections(event.returnValues.elections);
}

async function createElection() {
  await data.electionFactoryContract.methods
    .createElection(
      ["burguer", "pizza"],
      data.web3.utils.toWei(String(data.subscriptionValue), "ether"),
      data.currentAccount
    )
    .send({
      from: data.currentAccount,
      value: data.web3.utils.toWei(String(data.contractBudget), "ether"),
    });
}

async function deleteElection(index: number) {
  await data.electionFactoryContract.methods.removeElection(index).send({
    from: data.currentAccount,
  });
}

function goToDetail(address: string) {
  router.push({ name: "election", params: { address } });
}

function isElectionManager(election: Election) {
  return data.currentAccount === election.manager;
}

function goToFaucet() {
  window.open("https://faucet.poa.network", "_blank");
}

function getAlias(election: Election) {
  return election.address.slice(-4);
}
</script>

<template>
  <template>
    <div class="text-center">
      <v-dialog v-model="data.instructionsDialog" width="650">
        <v-card>
          <v-card-title class="text-h5 mt-3"> Instrucciones: </v-card-title>
          <v-divider color="#10D25F"></v-divider>
          <v-card-text>
            <p>Para poder usar esta app debes seguir los siguientes pasos:</p>
            <ul class="ml-4 mt-2">
              <li class="mb-1">
                1. Instala el plugin de Metamask en tu navegador.
              </li>
              <li class="mb-1">
                2. Inicia el plugin creando una cuenta, ten cuidado de guardar
                bien las palabras secretas y tu clave.
              </li>
              <li class="mb-1">
                3. Agrega una nueva red en Metamask con los siguientes datos:
                <ul class="ml-4">
                  <li>
                    <span class="instructions-label">Network Name:</span> POA
                    Sokol Testnet
                  </li>
                  <li>
                    <span class="instructions-label">New RPC URL:</span>
                    https://sokol.poa.network
                  </li>
                  <li><span class="instructions-label">ChainID:</span> 77</li>
                  <li><span class="instructions-label">Symbol:</span> SPOA</li>
                  <li>
                    <span class="instructions-label">Block Explorer URL:</span>
                    https://blockscout.com/poa/soko
                  </li>
                </ul>
              </li>
              <li class="mb-1">
                4. Obten SPOA de prueba para poder usar la app
                <v-chip color="#10D25F" @click="goToFaucet()">aquí</v-chip>
              </li>
              <li class="mb-1">
                5. Ya puedes usar la aplicación, no te gastes todo tu dinero, si
                vas a crear una votación no uses más de
                <span class="instructions-label">0.005</span> de tu presupuesto.
              </li>
            </ul>
          </v-card-text>

          <v-divider color="#10D25F"></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="#10D25F" text @click="data.instructionsDialog = false">
              Cerrar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </template>

  <v-container class="py-8 px-6" fluid>
    <v-row>
      <v-col cols="12">
        <v-alert v-model="data.showErrorAlert" closable close-label="Cerrar" density="comfortable" type="error"
          variant="tonal" title="Error en la aplicación">
          {{  data.errorAlertMessage  }}
        </v-alert>
      </v-col>
      <v-col cols="12">
        <v-banner two-line>
          <v-container fluid class="ma-0 pa-0">
            <v-row>
              <v-col cols="auto">
                <v-avatar slot="icon" color="#10D25F" size="40">
                  <v-icon icon="mdi-lightbulb" color="white">
                    mdi-lightbulb
                  </v-icon>
                </v-avatar>
              </v-col>
              <v-col cols="auto" class="mr-auto">
                <p v-if="isConnected()">Bienvenido {{  data.currentAccount  }}</p>
                <p>
                  Esta es una DApp de votaciones con la que vas a descifrar el
                  enigma de qué prefiere la gente, la pizza o la hamburguesa!
                </p>
                <p>
                  Se encuentra desplegada en la blockchain de prueba para Gnosis
                  de Zocol. Espero que la disfrutes.
                </p>
              </v-col>
              <v-col cols="auto">
                <v-spacer></v-spacer>
                <v-btn color="success" @click.stop="data.instructionsDialog = true">
                  Instrucciones
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-banner>
      </v-col>

      <v-col cols="12">
        <v-card>
          <v-card-item>
            <v-card-title>Acciones:</v-card-title>
            <v-form ref="createForm" v-model="data.valid">
              <v-container fluid>
                <v-row :align="'center'" :justify="'center'" v-if="!isConnected()">
                  <v-col cols="auto">Por favor conecta tu cuenta con Metamask para empezar a
                    usar la aplicación</v-col>
                  <v-col cols="2">
                    <v-btn @click="connect">
                      <template v-slot:prepend>
                        <v-icon>mdi-wifi</v-icon>
                      </template>
                      Conectar
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row :justify="'start'" v-if="isConnected()">
                  <v-col cols="auto" lg="1" :align-self="'center'">
                    <div>Nueva Votación:</div>
                  </v-col>
                  <v-col cols="3" lg="2">
                    <v-text-field v-model="data.contractBudget" hide-details="auto" label="Valor contrato" type="number"
                      step="0.001" suffix="ETH" class="create-input" :rules="budgetRules" />
                  </v-col>
                  <v-col cols="3" lg="2">
                    <v-text-field v-model="data.subscriptionValue" hide-details="auto" label="Valor Subscripción"
                      type="number" step="0.0001" suffix="ETH" class="create-input" :rules="subscriptionRules" />
                  </v-col>
                  <v-col cols="3" lg="2" :align-self="'end'" depressed>
                    <v-btn color="success" @click="createElection" :disabled="!data.valid">
                      <template v-slot:prepend>
                        <v-icon>mdi-vote</v-icon>
                      </template>
                      Crear
                    </v-btn>
                  </v-col>
                  <v-col cols="auto"></v-col>
                </v-row>
              </v-container>
            </v-form>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" v-if="isConnected()">
        <v-card>
          <v-card-title>Votaciones en curso:</v-card-title>

          <v-list two-line>
            <template v-for="(election, index) in data.elections" :key="index">
              <div class="d-flex flex-row align-center">
                <div class="ma-3 ml-4">
                  <v-icon>mdi-ballot</v-icon>
                </div>

                <div class="ma-3">
                  <v-list-item-title> Votación {{  getAlias(election)  }} </v-list-item-title>
                  <v-list-item-subtitle>
                    {{  election.address  }}
                  </v-list-item-subtitle>
                </div>
                <v-spacer></v-spacer>

                <div class="ma-3 mr-4">
                  <v-btn @click="goToDetail(election.address)" class="mr-2" icon>
                    <v-icon>mdi-poll</v-icon>
                  </v-btn>
                  <v-btn @click="deleteElection(index)" v-if="isElectionManager(election)" icon>
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
              </div>

              <v-divider v-if="index !== data.elections.length - 1" :key="`divider-${index}`">
              </v-divider>
            </template>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.instructions-label {
  color: #10d25f;
  font-weight: bold;
}
</style>
