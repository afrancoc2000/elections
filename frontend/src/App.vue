<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Vue from "vue";
import router from "./router";

function goToHome() {
  router.push("/");
}
function goToGithub() {
  window.open("https://github.com/afrancoc2000/elections", "_blank");
}
</script>

<template>
  <v-app id="inspire">
    <v-app-bar app>
      <img src="./assets/logo.png" class="logo" alt="Logo Ceiba" />
      <v-toolbar-title>
        Elecciones con Blockchain - Ceiba DevFest 2022
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="goToHome()" icon>
        <v-icon>mdi-home</v-icon>
      </v-btn>
      <v-btn @click="goToGithub()" icon>
        <v-icon>mdi-github</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<style scoped>
@import "./assets/main.css";
</style>
