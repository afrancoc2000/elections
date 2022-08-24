<script setup lang="ts">
import ElectionItem from "./ElectionItem.vue";
import CreateElection from "./CreateElection.vue";
import { reactive, ref } from 'vue'

const greeting = ref("Ani");
const elections: any[] = reactive([]);

function updateElections(election: any) {
  elections.push(election);
  console.log(election);
  console.log(elections);
}
</script>

<template>
  <div>
    <CreateElection :msg="greeting" @create="updateElections"></CreateElection>
  </div>

  <div>
    <ul>
      <li v-for="election in elections" :key="election.id">
        <ElectionItem :name="election.name"></ElectionItem>
      </li>
    </ul>
  </div>
</template>
