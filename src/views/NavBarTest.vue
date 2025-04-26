<template>
  <nav class="navbar">
    <div class="navbar-content">
      <!-- Logo da aplicação -->
      <div class="navbar-logo">
        <router-link to="/bookshelf" class="logo-link">
          <v-icon icon="mdi-book-open-page-variant" class="logo-icon" />
          <h1 class="logo-text text-serif">LitShelf</h1>
        </router-link>
      </div>

      <!-- Botões de navegação centralizados (visíveis apenas em desktop) -->
      <div class="navbar-menu navbar-menu-center d-none d-md-flex">
        <v-btn 
          variant="text" 
          color="accent" 
          size="large" 
          class="nav-button"
          to="/bookshelf" 
          :class="{ 'active-route': isActiveRoute('/bookshelf') }"
        >
          <v-icon class="mr-2">mdi-bookshelf</v-icon>
          <span>Minha Estante</span>
        </v-btn>
        
        <v-btn 
          variant="text" 
          color="accent" 
          size="large" 
          class="nav-button"
          to="/addBook" 
          :class="{ 'active-route': isActiveRoute('/addBook') }"
        >
          <v-icon class="mr-2">mdi-book-plus</v-icon>
          <span>Adicionar</span>
        </v-btn>
        
        <v-btn 
          variant="text" 
          color="accent" 
          size="large" 
          class="nav-button"
          to="/dashboard" 
          :class="{ 'active-route': isActiveRoute('/dashboard') }"
        >
          <v-icon class="mr-2">mdi-chart-box</v-icon>
          <span>Dashboard</span>
        </v-btn>
        
        <v-btn 
          variant="text" 
          color="accent" 
          size="large" 
          class="nav-button"
          to="/friends" 
          :class="{ 'active-route': isActiveRoute('/friends') }"
        >
          <v-icon class="mr-2">mdi-account-group</v-icon>
          <span>Amigos</span>
        </v-btn>
      </div>

      <!-- Menu do usuário à direita -->
      <div class="navbar-menu navbar-menu-right">
        <!-- Botão menu mobile (visível apenas em mobile) -->
        <v-btn
          icon
          variant="text"
          color="accent"
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="mobile-menu-btn d-md-none"
        >
          <v-icon>{{ mobileMenuOpen ? 'mdi-close' : 'mdi-menu' }}</v-icon>
        </v-btn>
        
        <v-btn 
          icon
          variant="text"
          color="accent"
          @click="toggleDarkMode"
          class="theme-toggle-btn"
          :title="isDarkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
        >
          <v-icon>{{ isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
        </v-btn>
        
        <v-menu location="bottom end" transition="slide-y-transition">
          <template #activator="{ props }">
            <v-btn 
              v-bind="props" 
              variant="text" 
              color="accent" 
              class="user-button"
              :class="{ 'animate-pulse': hasNotifications }"
            >
              <v-avatar size="32" class="mr-2" color="primary">
                <v-icon color="white">mdi-account</v-icon>
              </v-avatar>
              <span class="username-text">{{ userDisplayName }}</span>
              <v-icon class="ml-2" small>mdi-chevron-down</v-icon>
              <v-badge
                v-if="hasNotifications"
                color="error"
                content="2"
                dot
                floating
                offset-x="-12"
                offset-y="12"
              ></v-badge>
            </v-btn>
          </template>
          
          <v-card min-width="200" class="menu-card">
            <v-list>
              <v-list-item prepend-icon="mdi-account" @click="goToProfile">
                <v-list-item-title>Meu Perfil</v-list-item-title>
              </v-list-item>
              
              <v-list-item prepend-icon="mdi-cog" @click="goToSettings">
                <v-list-item-title>Configurações</v-list-item-title>
              </v-list-item>
              
              <v-divider class="my-2"></v-divider>
              
              <v-list-item prepend-icon="mdi-logout" color="error" @click="confirmLogout = true">
                <v-list-item-title>Sair</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </div>
    </div>
    
    <!-- Menu móvel (visível quando aberto) -->
    <v-expand-transition>
      <div v-if="mobileMenuOpen" class="mobile-menu d-md-none">
        <v-list>
          <v-list-item 
            to="/bookshelf" 
            :active="isActiveRoute('/bookshelf')"
            @click="mobileMenuOpen = false"
          >
            <template v-slot:prepend>
              <v-icon color="accent">mdi-bookshelf</v-icon>
            </template>
            <v-list-item-title>Minha Estante</v-list-item-title>
          </v-list-item>
          
          <v-list-item 
            to="/addBook" 
            :active="isActiveRoute('/addBook')"
            @click="mobileMenuOpen = false"
          >
            <template v-slot:prepend>
              <v-icon color="accent">mdi-book-plus</v-icon>
            </template>
            <v-list-item-title>Adicionar Livro</v-list-item-title>
          </v-list-item>
          
          <v-list-item 
            to="/dashboard" 
            :active="isActiveRoute('/dashboard')"
            @click="mobileMenuOpen = false"
          >
            <template v-slot:prepend>
              <v-icon color="accent">mdi-chart-box</v-icon>
            </template>
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item>
          
          <v-list-item 
            to="/friends" 
            :active="isActiveRoute('/friends')"
            @click="mobileMenuOpen = false"
          >
            <template v-slot:prepend>
              <v-icon color="accent">mdi-account-group</v-icon>
            </template>
            <v-list-item-title>Amigos</v-list-item-title>
          </v-list-item>
          
          <v-divider class="my-2"></v-divider>
          
          <v-list-item @click="toggleDarkMode">
            <template v-slot:prepend>
              <v-icon color="accent">{{ isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
            </template>
            <v-list-item-title>{{ isDarkMode ? 'Modo Claro' : 'Modo Escuro' }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
    </v-expand-transition>
    
    <!-- Dialog de confirmação de logout -->
    <v-dialog v-model="confirmLogout" max-width="400" transition="dialog-top-transition">
      <v-card class="logout-dialog">
        <v-card-title class="text-h5 bg-primary text-white pa-4">Confirmar Saída</v-card-title>
        <v-card-text class="pt-5 pb-3">
          <p>Tem certeza que deseja sair da sua conta?</p>
        </v-card-text>
        <v-card-actions class="pb-4 px-4">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" color="primary" @click="confirmLogout = false">Cancelar</v-btn>
          <v-btn variant="elevated" color="error" class="ml-3" @click="handleLogout">Sair</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </nav>
</template>

<script lang="ts" setup>
import { useAuthStore } from "@/stores/useAuthStore";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTheme } from "vuetify";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const theme = useTheme();
const confirmLogout = ref(false);
const isDarkMode = ref(false);
const hasNotifications = ref(false); // Simulação de notificações
const mobileMenuOpen = ref(false); // Controle do menu móvel

// Nome de exibição do usuário
const userDisplayName = computed(() => {
  if (authStore.user?.displayName) {
    return authStore.user.displayName;
  } else if (authStore.user?.email) {
    // Extrair nome do email (parte antes do @)
    return authStore.user.email.split('@')[0];
  }
  return "Usuário";
});

// Verificar se a rota atual está ativa
const isActiveRoute = (path: string) => {
  return route.path === path || route.path.startsWith(path);
};

// Carregar preferência de tema do localStorage
onMounted(() => {
  // Simular notificações após 3 segundos
  setTimeout(() => {
    hasNotifications.value = true;
  }, 3000);
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'customDarkTheme') {
    isDarkMode.value = true;
    theme.global.name.value = 'customDarkTheme';
  }
  
  // Fechar o menu móvel ao mudar de rota
  router.beforeEach(() => {
    mobileMenuOpen.value = false;
    return true;
  });
  
  // Fechar o menu móvel ao clicar fora dele
  document.addEventListener('click', (e) => {
    if (mobileMenuOpen.value && !e.target.closest('.mobile-menu') && !e.target.closest('.mobile-menu-btn')) {
      mobileMenuOpen.value = false;
    }
  });
});

// Alternar entre modo claro/escuro
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  theme.global.name.value = isDarkMode.value ? 'customDarkTheme' : 'customTheme';
  localStorage.setItem('theme', isDarkMode.value ? 'customDarkTheme' : 'customTheme');
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push("/login");
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }
};

const goToProfile = () => {
  router.push("/profile");
};

const goToSettings = () => {
  router.push("/settings");
};
</script>

<style scoped>
.navbar {
  width: 100%;
  background-color: var(--v-primary-base);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  position: sticky;
  top: 0;
  z-index: var(--z-index-navbar);
}

.navbar-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1.5rem;
}

.navbar-logo {
  display: flex;
  align-items: center;
}

.logo-link {
  text-decoration: none;
  color: var(--v-text);
  display: flex;
  align-items: center;
}

.logo-icon {
  color: var(--v-accent-base);
  margin-right: 8px;
  font-size: 30px;
  animation: pulse 2s infinite alternate;
}

@keyframes pulse {
  from { transform: scale(1); opacity: 0.9; }
  to { transform: scale(1.1); opacity: 1; }
}

.logo-text {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(to right, #FFC107, #FFD54F);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navbar-menu-center {
  flex-grow: 1;
  justify-content: center;
}

.navbar-menu-right {
  justify-content: flex-end;
  gap: 1rem;
}

.nav-button {
  font-size: 1rem;
  text-transform: none;
  position: relative;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.nav-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.nav-button.active-route {
  background-color: rgba(255, 204, 128, 0.2);
  position: relative;
}

.nav-button.active-route::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 30px;
  height: 3px;
  background-color: var(--v-accent-base);
  transform: translateX(-50%);
  border-radius: 3px;
}

.user-button {
  border-radius: 20px;
  padding: 0.25rem 1rem;
  text-transform: none;
  transition: all 0.3s ease;
}

.user-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.username-text {
  font-weight: 500;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-card {
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.theme-toggle-btn {
  margin-right: 8px;
}

.animate-pulse {
  animation: pulse-subtle 2s infinite;
}

@keyframes pulse-subtle {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.logout-dialog {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

/* Menu móvel */
.mobile-menu {
  background-color: var(--v-primary-base);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
  width: 100%;
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
}

.mobile-menu .v-list-item {
  min-height: 56px;
  transition: all 0.2s ease;
}

.mobile-menu .v-list-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.mobile-menu .v-list-item--active {
  background-color: rgba(255, 204, 128, 0.2);
}

/* Responsividade */
@media (max-width: 960px) {
  .nav-button span {
    display: none;
  }
  
  .nav-button .v-icon {
    margin-right: 0 !important;
    font-size: 24px;
  }
  
  .navbar-menu-center {
    gap: 0;
  }
}

@media (max-width: 600px) {
  .navbar-content {
    padding: 0.5rem 1rem;
  }
  
  .logo-text {
    font-size: 1.4rem;
  }
  
  .username-text {
    display: none;
  }
  
  .mobile-menu-btn {
    margin-right: 4px;
  }
}
</style>
