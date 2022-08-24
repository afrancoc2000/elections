<script setup lang="ts">
// import { createContract } from "../../blockchain/electionFactoryContract";

let id = 0;

const props = defineProps({
  msg: String,
});

// const contract = createContract();
const emit = defineEmits(["create"]);

function newElection() {
  alert(`Hello ${props.msg}!`);
  // const newContract = contract.methods.createElection({});
  emit("create", { name: "test", id: id++ });
}
</script>

<template>
  <button @click="newElection">Nueva Elección {{ msg }}</button>
</template>
