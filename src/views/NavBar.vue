<template>
  <nav class="navbar">
    <!-- Nome do aplicativo à esquerda -->
    <div class="navbar-logo">
      <h1>LitShelf</h1>
    </div>

    <!-- Botões de navegação e menu à direita -->
    <div class="navbar-menu">
      <!-- Botões de navegação -->
      <BaseButton variant="text" color="white" size="small">
        <RouterLink to="/">Home</RouterLink>
      </BaseButton>
      <BaseButton variant="text" color="white" size="small">
        <RouterLink to="/bookshelf">Estante</RouterLink>
      </BaseButton>
      <BaseButton variant="text" color="white" size="small">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
      </BaseButton>

      <!-- Ícone de usuário com menu -->
      <v-menu offset-y>
        <template #activator="{ props }">
          <BaseButton v-bind="props" icon color="white">
            <v-icon>mdi-account</v-icon>
          </BaseButton>
        </template>
        <v-list>
          <v-list-item>
            <BaseButton variant="text" @click="goToDashboard"> Dashboard </BaseButton>
          </v-list-item>
          <v-list-item>
            <BaseButton variant="text" color="error" @click="handleLogout"> Logout </BaseButton>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  try {
    await authStore.logout()
    console.log('Usuário desconectado')
    router.push('/login')
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
  }
}

const goToDashboard = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(90deg, #8d6e63, #4e342e); /* Gradiente marrom */
  color: white;
  padding: 0.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Garamond', serif; /* Fonte que remete a uma biblioteca */
}

.navbar-logo h1 {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
  color: #ffffff;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 1rem; /* Espaçamento entre os botões */
}

.navbar-menu a {
  color: inherit;
  text-decoration: none;
}

.navbar-menu a:hover {
  color: #ffcc80; /* Cor de destaque */
}
</style>
