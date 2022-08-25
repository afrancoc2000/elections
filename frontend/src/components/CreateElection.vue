<script setup lang="ts">
// import { createContract } from "../blockchain/electionFactoryContract";
import Web3 from "web3";
import electionFactoryAddress from "../blockchain/electionFactoryAddress";
import electionFactoryAbi from "../blockchain/electionFactoryAbi";
import { onMounted } from 'vue'

// const contract = createContract();
const emit = defineEmits(["create"]);
let contract: any;

onMounted(() => {
  // Logic
});

function newElection() {
  // const newContract = contract.methods.createElection({});
  emit("create", { name: "test" });
}
</script>

<template>
  <v-btn @click="newElection">
    <template v-slot:prepend>
      <v-icon>mdi-vote</v-icon>
    </template>
    Nueva Votación
  </v-btn>
</template>
