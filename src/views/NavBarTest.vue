<template>
  <nav class="navbar">
    <!-- Botões de navegação centralizados -->
    <div class="navbar-menu navbar-menu-center">
      <BaseButton variant="text" color="accent" size="large" class="nav-button">
        <RouterLink to="/bookshelf">Home</RouterLink>
      </BaseButton>
      <BaseButton variant="text" color="accent" size="large" class="nav-button">
        <RouterLink to="/addBook">Adicionar livro</RouterLink>
      </BaseButton>
      <BaseButton variant="text" color="accent" size="large" class="nav-button">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
      </BaseButton>
    </div>

    <!-- Ícone de usuário com menu à direita -->
    <div class="navbar-menu navbar-menu-right">
      <v-menu offset-y>
        <template #activator="{ props }">
          <BaseButton v-bind="props" icon color="accent" class="user-button">
            <v-icon>mdi-account</v-icon>
          </BaseButton>
        </template>
        <v-list>
          <v-list-item>
            <BaseButton variant="text" @click="goToDashboard"> Dashboard </BaseButton>
          </v-list-item>
          <v-list-item>
            <BaseButton variant="text" color="error" @click="handleLogout">
              Logout
            </BaseButton>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  try {
    await authStore.logout();
    console.log("Usuário desconectado");
    router.push("/login");
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }
};

const goToDashboard = () => {
  router.push("/dashboard");
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #4e342e;
  /* Cor escolhida para a navbar */
  color: var(--v-text);
  padding: 0.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 80px;
  /* Aumentando a altura da navbar */
}

.navbar-logo h1 {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
  color: var(--v-text);
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
  /* Espaçamento entre os botões */
}

.navbar-menu-center {
  flex-grow: 1;
  /* Faz com que os botões ocupem o espaço disponível */
  justify-content: center;
  /* Centraliza os botões */
}

.navbar-menu-right {
  justify-content: flex-end;
  /* Alinha o botão do usuário à direita */
}

.navbar-menu a {
  color: inherit;
  text-decoration: none;
  font-family: "Times New Roman", Times, serif;
  /* Fonte diferente para os botões */
  font-size: 1.2rem;
  /* Aumentando o tamanho da fonte */
}

.navbar-menu a:hover {
  color: var(--v-accent);
  /* Cor de destaque */
}

.nav-button {
  font-family: "Times New Roman", Times, serif;
  /* Fonte diferente para os botões */
  font-size: 1.2rem;
  /* Aumentando o tamanho da fonte */
}

.user-button {
  font-size: 1.2rem;
  /* Aumentando o tamanho da fonte */
}
</style>
