<script setup lang="ts">
defineProps({
  index: Number,
  address: String,
});
</script>

<template>
  <v-list-item>
    <v-icon>mdi-vote</v-icon>
    <v-list-item-content>
      <v-list-item-title>Votación {{ index }}</v-list-item-title>

      <v-list-item-subtitle>
        {{ address }}
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>
