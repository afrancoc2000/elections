<script setup lang="ts">
defineProps({
  index: Number,
  address: String,
});
</script>

<template>
  <v-list-item>
    <v-list-item-avatar color="grey darken-1"> </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title>Votación {{ index }}</v-list-item-title>

      <v-list-item-subtitle>
        {{ address }}
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>
