<script setup lang="ts">
import ElectionItem from "./ElectionItem.vue";
import CreateElection from "./CreateElection.vue";
import { reactive } from "vue";

const elections: any[] = reactive([]);

function updateElections(election: any) {
  elections.push(election);
}
</script>

<template>
  <v-container class="py-8 px-6" fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-item>
            <v-card-title>Crear elección:</v-card-title>
            <v-card-actions>
              <CreateElection @create="updateElections"></CreateElection>
            </v-card-actions>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card>
          <v-card-title>Votaciones en curso:</v-card-title>

          <v-list two-line>
            <template v-for="(election, index) in elections" :key="index">
              <ElectionItem :address="election.address" :index="index"></ElectionItem>
              <v-divider v-if="index !== elections.length - 1" :key="`divider-${index}`" inset>
              </v-divider>
            </template>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
