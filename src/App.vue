<template>
  <div>
    <!-- Navbar sempre no topo e visível apenas quando autenticado -->
    <div v-if="isAuthenticated" class="navbar-container">
      <Navbar />
    </div>
    <!-- Conteúdo principal -->
    <div class="mx-auto d-flex justify-center" style="width: 100% !important">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts" setup>
import Navbar from '@/views/Navbar.vue'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

// Obtenha o estado de autenticação da store
const authStore = useAuthStore()
const isAuthenticated = computed(() => !!authStore.user)
</script>

<style scoped>
/* Estilo para fixar o Navbar no topo */
.navbar-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
</style>
