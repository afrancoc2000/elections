<script setup lang="ts">
defineProps({
  name: String,
  id: Number,
});
</script>

<template>
  <div>
    {{ name }}
  </div>
</template>
