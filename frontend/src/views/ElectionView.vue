<script setup lang="ts">
import ElectionDetail from "../components/ElectionDetail.vue";
</script>

<template>
  <ElectionDetail :address="$route.params.address" />
</template>
