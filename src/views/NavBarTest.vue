<template>
  <nav class="navbar">
    <div class="navbar-content">
      <!-- Logo da aplicação -->
      <div class="navbar-logo">
        <a @click="goToBookshelf" class="logo-link" style="cursor: pointer">
          <v-icon icon="mdi-book-open-page-variant" class="logo-icon" />
          <h1 class="logo-text text-serif">LitShelf</h1>
        </a>
      </div>

      <!-- Botões de navegação centralizados (visíveis apenas em desktop) -->
      <div class="navbar-menu navbar-menu-center d-none d-lg-flex">
        <v-btn
          variant="text"
          color="accent"
          size="large"
          class="nav-button"
          @click="goToBookshelf"
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
        <!-- Botão de tema (sempre visível) -->
        <v-btn
          icon
          variant="text"
          color="accent"
          @click="toggleDarkMode"
          class="theme-toggle-btn"
          size="small"
          :title="isDarkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
        >
          <v-icon size="20">{{ isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
        </v-btn>

        <!-- Menu do usuário (desktop) -->
        <div class="d-none d-md-flex">
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
                  <v-img
                    v-if="userProfilePicture"
                    :src="userProfilePicture"
                    alt="Avatar do usuário"
                  ></v-img>
                  <v-icon v-else color="white" size="18">mdi-account</v-icon>
                </v-avatar>
                <span class="username-text d-none d-lg-inline">{{ userDisplayName }}</span>
                <v-icon class="ml-1" size="18">mdi-chevron-down</v-icon>
                <v-badge
                  v-if="hasNotifications"
                  color="error"
                  content="2"
                  dot
                  floating
                  offset-x="-8"
                  offset-y="8"
                ></v-badge>
              </v-btn>
            </template>

            <v-card min-width="200" class="menu-card">
              <v-list density="compact">
                <v-list-item prepend-icon="mdi-account" @click="goToProfile">
                  <v-list-item-title>Meu Perfil</v-list-item-title>
                </v-list-item>

                <v-divider class="my-1"></v-divider>

                <v-list-item prepend-icon="mdi-logout" color="error" @click="confirmLogout = true">
                  <v-list-item-title>Sair</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>

        <!-- Botão menu mobile (visível apenas em mobile) -->
        <v-btn
          icon
          variant="text"
          color="accent"
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="mobile-menu-btn d-md-none"
          size="small"
        >
          <v-icon size="24">{{ mobileMenuOpen ? 'mdi-close' : 'mdi-menu' }}</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Menu móvel (visível quando aberto) -->
    <v-expand-transition>
      <div v-if="mobileMenuOpen" class="mobile-menu d-md-none">
        <v-list density="comfortable">
          <!-- Perfil do usuário no mobile -->
          <v-list-item class="user-mobile-item">
            <template v-slot:prepend>
              <v-avatar size="40" color="primary">
                <v-img
                  v-if="userProfilePicture"
                  :src="userProfilePicture"
                  alt="Avatar do usuário"
                ></v-img>
                <v-icon v-else color="white" size="20">mdi-account</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-medium">{{ userDisplayName }}</v-list-item-title>
            <v-list-item-subtitle>Ver perfil</v-list-item-subtitle>
            <template v-slot:append>
              <v-badge v-if="hasNotifications" color="error" content="2" dot></v-badge>
            </template>
          </v-list-item>

          <v-divider class="my-2"></v-divider>

          <!-- Navegação principal -->
          <v-list-item
            @click="goToBookshelf"
            :active="isActiveRoute('/bookshelf')"
            class="nav-mobile-item"
          >
            <template v-slot:prepend>
              <v-icon color="accent" size="22">mdi-bookshelf</v-icon>
            </template>
            <v-list-item-title>Minha Estante</v-list-item-title>
          </v-list-item>

          <v-list-item
            to="/addBook"
            :active="isActiveRoute('/addBook')"
            @click="mobileMenuOpen = false"
            class="nav-mobile-item"
          >
            <template v-slot:prepend>
              <v-icon color="accent" size="22">mdi-book-plus</v-icon>
            </template>
            <v-list-item-title>Adicionar Livro</v-list-item-title>
          </v-list-item>

          <v-list-item
            to="/dashboard"
            :active="isActiveRoute('/dashboard')"
            @click="mobileMenuOpen = false"
            class="nav-mobile-item"
          >
            <template v-slot:prepend>
              <v-icon color="accent" size="22">mdi-chart-box</v-icon>
            </template>
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item>

          <v-list-item
            to="/friends"
            :active="isActiveRoute('/friends')"
            @click="mobileMenuOpen = false"
            class="nav-mobile-item"
          >
            <template v-slot:prepend>
              <v-icon color="accent" size="22">mdi-account-group</v-icon>
            </template>
            <v-list-item-title>Amigos</v-list-item-title>
          </v-list-item>

          <v-divider class="my-2"></v-divider>

          <!-- Configurações -->
          <v-list-item
            @click="
              () => {
                goToProfile()
                mobileMenuOpen = false
              }
            "
            class="nav-mobile-item"
          >
            <template v-slot:prepend>
              <v-icon color="accent" size="22">mdi-account-cog</v-icon>
            </template>
            <v-list-item-title>Meu Perfil</v-list-item-title>
          </v-list-item>

          <v-list-item @click="toggleDarkMode" class="nav-mobile-item">
            <template v-slot:prepend>
              <v-icon color="accent" size="22">{{
                isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night'
              }}</v-icon>
            </template>
            <v-list-item-title>{{ isDarkMode ? 'Modo Claro' : 'Modo Escuro' }}</v-list-item-title>
          </v-list-item>

          <v-divider class="my-2"></v-divider>

          <!-- Logout -->
          <v-list-item
            @click="
              () => {
                confirmLogout = true
                mobileMenuOpen = false
              }
            "
            class="nav-mobile-item logout-item"
          >
            <template v-slot:prepend>
              <v-icon color="error" size="22">mdi-logout</v-icon>
            </template>
            <v-list-item-title class="text-error">Sair</v-list-item-title>
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
import { useAuthStore } from '@/stores/useAuthStore'
import { useBookshelfStore } from '@/stores/useBookshelfStore'
import { supabase } from '@/supabase'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from 'vuetify'

const authStore = useAuthStore()
const bookshelfStore = useBookshelfStore()
const router = useRouter()
const route = useRoute()
const theme = useTheme()
const confirmLogout = ref(false)
const isDarkMode = ref(false)
const hasNotifications = ref(false) // Simulação de notificações
const mobileMenuOpen = ref(false) // Controle do menu móvel
const profileData = ref({
  name: '',
  profilePictureUrl: '',
})

// Nome de exibição do usuário - agora busca do profileData
const userDisplayName = computed(() => {
  return profileData.value.name || 'Usuário'
})

// Imagem de perfil do usuário - agora busca do profileData
const userProfilePicture = computed(() => {
  return profileData.value.profilePictureUrl || null
})

// Carregar dados do perfil
const loadProfileData = async () => {
  if (!authStore.userId) return

  try {
    // Buscar o perfil do usuário no Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('name, profile_picture_url')
      .eq('id', authStore.userId)
      .single()

    if (error) {
      console.error('Erro ao carregar dados do perfil:', error)
      return
    }

    if (data) {
      profileData.value = {
        name: data.name || authStore.user?.email?.split('@')[0] || 'Usuário',
        profilePictureUrl: data.profile_picture_url || null,
      }
    }
  } catch (err) {
    console.error('Erro ao buscar perfil:', err)
  }
}

// Verificar se a rota atual está ativa
const isActiveRoute = (path: string) => {
  return route.path === path || route.path.startsWith(path)
}

// Função para navegar para a estante pessoal com reset completo do estado
const goToBookshelf = async () => {
  // Limpar o estado do store para garantir que não há mais referência aos livros do amigo
  bookshelfStore.setViewingFriend(null)

  // Forçar uma nova consulta para carregar apenas os livros do usuário atual
  await bookshelfStore.fetchBooks()

  // Fechar menu móvel
  mobileMenuOpen.value = false

  // Navegar para a página da estante sem parâmetros de consulta
  router.push('/bookshelf')
}

// Carregar preferência de tema do localStorage
onMounted(() => {
  // Simular notificações após 3 segundos
  setTimeout(() => {
    hasNotifications.value = true
  }, 3000)

  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'customDarkTheme') {
    isDarkMode.value = true
    theme.global.name.value = 'customDarkTheme'
  }

  // Fechar o menu móvel ao mudar de rota
  router.beforeEach(() => {
    mobileMenuOpen.value = false
    return true
  })

  // Fechar o menu móvel ao clicar fora dele
  document.addEventListener('click', (e) => {
    if (
      mobileMenuOpen.value &&
      !e.target.closest('.mobile-menu') &&
      !e.target.closest('.mobile-menu-btn')
    ) {
      mobileMenuOpen.value = false
    }
  })

  // Carregar dados do perfil
  loadProfileData()
})

// Alternar entre modo claro/escuro
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  theme.global.name.value = isDarkMode.value ? 'customDarkTheme' : 'customTheme'
  localStorage.setItem('theme', isDarkMode.value ? 'customDarkTheme' : 'customTheme')
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
  }
}

const goToProfile = () => {
  router.push('/profile')
}

const goToSettings = () => {
  router.push('/settings')
}
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
  min-height: 64px;
}

.navbar-logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
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
  from {
    transform: scale(1);
    opacity: 0.9;
  }
  to {
    transform: scale(1.1);
    opacity: 1;
  }
}

.logo-text {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(to right, #ffc107, #ffd54f);
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
  gap: 0.5rem;
  flex-shrink: 0;
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
  padding: 0.25rem 0.75rem;
  text-transform: none;
  transition: all 0.3s ease;
  max-width: 200px;
}

.user-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.username-text {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.menu-card {
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.theme-toggle-btn {
  margin-right: 4px;
}

.animate-pulse {
  animation: pulse-subtle 2s infinite;
}

@keyframes pulse-subtle {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
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
  max-height: calc(100vh - 64px);
  overflow-y: auto;
}

.user-mobile-item {
  background-color: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
}

.nav-mobile-item {
  min-height: 56px;
  transition: all 0.2s ease;
  padding: 12px 20px;
}

.nav-mobile-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.nav-mobile-item.router-link-active {
  background-color: rgba(255, 204, 128, 0.15);
  border-left: 4px solid var(--v-accent-base);
}

.logout-item:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

/* Responsividade */
@media (max-width: 1280px) {
  .navbar-menu-center {
    display: none !important;
  }
}

@media (max-width: 960px) {
  .username-text {
    display: none !important;
  }

  .user-button {
    padding: 0.25rem 0.5rem;
  }
}

@media (max-width: 600px) {
  .navbar-content {
    padding: 0.5rem 1rem;
    min-height: 56px;
  }

  .logo-text {
    font-size: 1.5rem;
  }

  .logo-icon {
    font-size: 26px;
    margin-right: 6px;
  }

  .theme-toggle-btn {
    margin-right: 2px;
  }

  .mobile-menu {
    max-height: calc(100vh - 56px);
  }

  .nav-mobile-item {
    min-height: 48px;
    padding: 10px 16px;
  }

  .user-mobile-item {
    padding: 12px 16px;
  }
}

@media (max-width: 400px) {
  .navbar-content {
    padding: 0.5rem 0.75rem;
  }

  .logo-text {
    font-size: 1.3rem;
  }

  .logo-icon {
    font-size: 24px;
    margin-right: 4px;
  }
}

/* Estados touch para mobile */
@media (hover: none) and (pointer: coarse) {
  .nav-mobile-item:active {
    background-color: rgba(255, 255, 255, 0.15);
    transform: scale(0.98);
  }

  .user-button:active {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .mobile-menu-btn:active {
    background-color: rgba(255, 255, 255, 0.15);
  }
}

/* Melhor área de toque para dispositivos móveis */
@media (max-width: 768px) {
  .mobile-menu-btn {
    min-width: 44px;
    min-height: 44px;
  }

  .theme-toggle-btn {
    min-width: 44px;
    min-height: 44px;
  }

  .nav-mobile-item {
    min-height: 48px;
  }
}
</style>
