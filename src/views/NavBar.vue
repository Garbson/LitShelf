<template>
  <nav class="navbar">
    <ul class="nav-links">
      <li><RouterLink to="/">Home</RouterLink></li>
      <li><RouterLink to="/dashboard">Dashboard</RouterLink></li>
      <li><RouterLink to="/bookshelf">Estante</RouterLink></li>
      <li><button @click="handleLogout" class="logout-button">Logout</button></li>
    </ul>
  </nav>
</template>

<script lang="ts" setup>
import { useAuthStore } from '@/stores/useAuthStore'
const authStore = useAuthStore()

const handleLogout = async () => {
  try {
    await authStore.logout()
    console.log('Usuário desconectado')
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: center;
  background-color: #f8f9fa;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
}

.nav-links li {
  font-size: 1rem;
}

.nav-links a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-links a:hover {
  color: #007bff;
}

.logout-button {
  background: none;
  border: none;
  color: #ff4d4f;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.3s ease;
}

.logout-button:hover {
  color: #d11a2a;
}
</style>
