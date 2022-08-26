<script setup lang="ts">
import { reactive } from "vue";
import router from "../router";

import Web3 from "web3";
import { onMounted } from "vue";
import detectEthereumProvider from "@metamask/detect-provider";

const electionFactoryAddress = import.meta.env.VITE_ELECTION_FACTORY_ADDRESS;
const electionFactoryAbi = JSON.parse(
  import.meta.env.VITE_ELECTION_FACTORY_ABI
);

const contractBudget = toEther(10);
const subscription = toEther(0.5);

const data: any = reactive({
  provider: {},
  web3: {},
  electionFactoryContract: {},
  accounts: [],
  currentAccount: "",
  noMetaMaskAlert: false,
  elections: [],
});

onMounted(async () => {
  data.provider = await detectEthereumProvider();
  console.log(`provider: ${data.provider}`);

  if (!data.provider) {
    data.noMetaMaskAlert = true;
    return;
  }

  data.web3 = new Web3(Web3.givenProvider);
  data.accounts = await data.provider.request({ method: "eth_accounts" });
  handleAccountsChanged(data.accounts);

  if (data.provider.chainId === "0x1") {
    alert("This is a test app. Please do not use the main network.");
  }
});

function toEther(value: number) {
  return value / 2000;
}

async function connect() {
  data.accounts = await data.provider.request({
    method: "eth_requestAccounts",
  });
  handleAccountsChanged(data.accounts);
}

function isConnected() {
  return data.currentAccount !== "";
}

function handleAccountsChanged(accounts: string[]) {
  if (accounts.length === 0) {
    console.log("Please connect to MetaMask.");
    return;
  }

  if (accounts[0] !== data.currentAccount) {
    data.currentAccount = data.web3.utils.toChecksumAddress(accounts[0]);
    console.log(`connected with account ${data.currentAccount}`);
    getContract();
    getElections();
  }
}

function getContract() {
  data.electionFactoryContract = new data.web3.eth.Contract(
    electionFactoryAbi,
    data.web3.utils.toChecksumAddress(electionFactoryAddress),
    { from: data.currentAccount }
  );
}

async function getElections() {
  const electionAddresses = await data.electionFactoryContract.methods
    .getElections()
    .call();
  data.elections = electionAddresses.map((address: string) => {
    return { address: address };
  });
  console.log(`election addresses: ${electionAddresses}`);
}

async function createElection() {
  const receipt = await data.electionFactoryContract.methods
    .createElection(
      ["burguer", "pizza"],
      data.web3.utils.toWei(String(subscription), "ether"),
      data.currentAccount
    )
    .send({
      from: data.currentAccount,
      value: data.web3.utils.toWei(String(contractBudget), "ether"),
    });

  console.log(`create election result: ${receipt}`);
  console.log(`result as json: ${JSON.stringify(receipt.receipt)}`);
  await getElections();
}

async function deleteElection(index: number) {
  await data.electionFactoryContract.methods.removeElection(index).send({
    from: data.currentAccount,
  });

  await getElections();
}

function goToDetail(address: string) {
  router.push(`/election/${address}`);
}
</script>

<template>
  <v-container class="py-8 px-6" fluid>
    <v-row>
      <v-col cols="12">
        <v-alert
          v-model="data.noMetaMaskAlert"
          closable
          close-label="Close Alert"
          density="comfortable"
          type="warning"
          variant="tonal"
          title="Closable Alert"
        >
          Debes tener el plugin de Metamask instalado para poder usar esta
          aplicación.
        </v-alert>
      </v-col>

      <v-col cols="12">
        <v-card>
          <v-card-item>
            <v-card-title>Acciones:</v-card-title>
            <v-card-text v-if="isConnected()">
              Bienvenido {{ data.currentAccount }}
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn @click="connect" v-if="!isConnected()">
                <template v-slot:prepend>
                  <v-icon>mdi-wifi</v-icon>
                </template>
                Conectar con Metamask
              </v-btn>
              <v-btn @click="createElection" v-if="isConnected()">
                <template v-slot:prepend>
                  <v-icon>mdi-vote</v-icon>
                </template>
                Nueva Votación
              </v-btn>
            </v-card-actions>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card>
          <v-card-title>Votaciones en curso:</v-card-title>

          <v-list two-line>
            <template v-for="(election, index) in data.elections" :key="index">
              <div class="d-flex flex-row align-center">
                <div class="ma-3 ml-4">
                  <v-icon>mdi-ballot</v-icon>
                </div>

                <div class="ma-3">
                  <v-list-item-title> Votación {{ index }} </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ election.address }}
                  </v-list-item-subtitle>
                </div>
                <v-spacer></v-spacer>

                <div class="ma-3 mr-4">
                  <v-btn
                    @click="goToDetail(election.address)"
                    class="mr-2"
                    icon
                  >
                    <v-icon>mdi-poll</v-icon>
                  </v-btn>
                  <v-btn @click="deleteElection(index)" icon>
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
              </div>

              <v-divider
                v-if="index !== data.elections.length - 1"
                :key="`divider-${index}`"
              >
              </v-divider>
            </template>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
