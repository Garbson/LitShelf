<template>
  <v-container fluid class="d-flex justify-center align-center mx-auto fill-height">
    <div>
      <h1>Criar Conta</h1>
      <form @submit.prevent="handleSignup">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />

        <label for="password">Senha:</label>
        <input type="password" id="password" v-model="password" required />

        <button type="submit">Registrar</button>
      </form>
    </div>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

const email = ref('')
const password = ref('')
const authStore = useAuthStore()

const handleSignup = async () => {
  try {
    await authStore.signup(email.value, password.value)
  } catch (error) {
    alert(error.message || 'Falha ao criar conta.')
  }
}
</script>
<style scoped>
.fill-height {
  height: 100vh !important;
  background-image: url(/public/bgLogin.jpg);
  background-size: cover;
}
</style>
