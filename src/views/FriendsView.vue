<template>
  <div class="friends-container">
    <div class="container mx-auto">
      <div class="text-center mb-8">
        <h1 class="page-title mb-2">Amigos & Comunidade</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Conecte-se com outros leitores e descubra novas leituras
        </p>
      </div>

      <v-row>
        <!-- Primeira coluna: Busca e solicitações -->
        <v-col cols="12" lg="3" md="4">
          <!-- Card de busca -->
          <v-card
            class="rounded-xl pa-4 mb-6 animate-slide-up"
            elevation="2"
            :style="{ animationDelay: '100ms' }"
          >
            <v-card-title class="text-h6 font-weight-bold px-0 pb-3">
              <v-icon icon="mdi-account-search" class="me-2" color="primary" />
              Encontrar Amigos
            </v-card-title>

            <v-card-text class="px-0">
              <v-window v-model="searchTab">
                <v-window-item :value="0">
                  <v-form @submit.prevent="searchUsers">
                    <v-text-field
                      v-model="searchQuery"
                      label="Email do usuário"
                      prepend-inner-icon="mdi-email-search"
                      variant="outlined"
                      clearable
                      @keyup.enter="searchUsers"
                      :loading="isLoadingAllUsers"
                    />
                    <v-btn
                      type="submit"
                      color="primary"
                      block
                      variant="elevated"
                      prepend-icon="mdi-magnify"
                      :loading="isLoadingAllUsers"
                      :disabled="!searchQuery?.trim()"
                    >
                      Buscar
                    </v-btn>
                  </v-form>
                </v-window-item>
              </v-window>

              <v-divider class="my-3" />

              <!-- Resultados da busca -->
              <div v-if="displayedUsers.length > 0" class="search-results mt-4">
                <h3 class="text-subtitle-1 mb-3">Resultados</h3>

                <v-list lines="two">
                  <v-list-item
                    v-for="user in displayedUsers"
                    :key="user.id"
                    class="mb-2 rounded-lg search-result-item"
                  >
                    <template v-slot:prepend>
                      <v-avatar color="primary">
                        <v-img v-if="user.photoURL" :src="user.photoURL" />
                        <v-icon v-else color="white">mdi-account</v-icon>
                      </v-avatar>
                    </template>

                    <v-list-item-title>{{ user.displayName || 'Usuário' }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      <span class="font-weight-bold">ID:</span> {{ user.id }}
                    </v-list-item-subtitle>

                    <template v-slot:append>
                      <v-btn
                        variant="text"
                        :color="getFriendshipColor(user.id)"
                        :icon="getFriendshipIcon(user.id)"
                        :loading="isProcessingRequest[user.id]"
                        @click="handleFriendAction(user)"
                        :disabled="isProcessingRequest[user.id]"
                      />
                    </template>
                  </v-list-item>
                </v-list>
              </div>

              <div
                v-else-if="hasSearched || allUsersLoaded"
                class="text-center py-4 text-medium-emphasis"
              >
                <v-icon icon="mdi-account-search-outline" size="40" color="grey" />
                <p class="mt-2">Nenhum usuário encontrado.</p>
              </div>
            </v-card-text>
          </v-card>

          <!-- Solicitações recebidas -->
          <v-card
            class="rounded-xl pa-4 mb-6 animate-slide-up modern-card"
            elevation="3"
            :style="{ animationDelay: '200ms' }"
          >
            <v-card-title
              class="d-flex align-center justify-space-between text-h6 font-weight-bold px-0 pb-3"
            >
              <div class="d-flex align-center">
                <div class="icon-wrapper warning mr-3">
                  <v-icon color="white" size="20">mdi-account-clock</v-icon>
                </div>
                <div>
                  <h3 class="text-h6 mb-0">Solicitações Recebidas</h3>
                  <p class="text-caption text-medium-emphasis mb-0">
                    Pessoas que querem ser suas amigas
                  </p>
                </div>
              </div>
              <v-chip
                v-if="friendsStore.friendRequests && friendsStore.friendRequests.length > 0"
                color="warning"
                variant="flat"
                size="small"
                class="font-weight-bold"
              >
                {{ friendsStore.friendRequests.length }}
              </v-chip>
            </v-card-title>

            <v-card-text class="px-0">
              <div
                v-if="friendsStore.friendRequests && friendsStore.friendRequests.length > 0"
                class="requests-grid"
              >
                <div
                  v-for="request in friendsStore.friendRequests"
                  :key="request.id"
                  class="request-card received-request"
                >
                  <div class="request-content">
                    <div class="user-info">
                      <v-avatar size="48" color="primary" class="user-avatar">
                        <v-icon color="white" size="24">mdi-account</v-icon>
                      </v-avatar>
                      <div class="user-details">
                        <h4 class="user-name">{{ request.fromName || 'Usuário' }}</h4>
                        <p class="user-email">{{ request.fromEmail }}</p>
                        <p class="request-time">{{ formatTimeAgo(request.createdAt) }}</p>
                      </div>
                    </div>

                    <div class="request-actions">
                      <v-btn
                        variant="flat"
                        color="success"
                        size="small"
                        class="action-btn accept-btn"
                        @click="acceptFriendRequest(request.id)"
                      >
                        <v-icon size="16" class="mr-1">mdi-check</v-icon>
                        Aceitar
                      </v-btn>
                      <v-btn
                        variant="outlined"
                        color="error"
                        size="small"
                        class="action-btn reject-btn"
                        @click="rejectFriendRequest(request.id)"
                      >
                        <v-icon size="16" class="mr-1">mdi-close</v-icon>
                        Rejeitar
                      </v-btn>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="empty-state">
                <div class="empty-icon">
                  <v-icon size="48" color="grey-lighten-1">mdi-check-circle-outline</v-icon>
                </div>
                <h4 class="empty-title">Nenhuma solicitação pendente</h4>
                <p class="empty-subtitle">
                  Quando alguém te enviar uma solicitação de amizade, ela aparecerá aqui!
                </p>
              </div>
            </v-card-text>
          </v-card>

          <!-- Solicitações enviadas -->
          <v-card
            class="rounded-xl pa-4 mb-6 animate-slide-up modern-card"
            elevation="3"
            :style="{ animationDelay: '300ms' }"
          >
            <v-card-title
              class="d-flex align-center justify-space-between text-h6 font-weight-bold px-0 pb-3"
            >
              <div class="d-flex align-center">
                <div class="icon-wrapper info mr-3">
                  <v-icon color="white" size="20">mdi-account-arrow-right</v-icon>
                </div>
                <div>
                  <h3 class="text-h6 mb-0">Solicitações Enviadas</h3>
                  <p class="text-caption text-medium-emphasis mb-0">
                    Aguardando resposta dos usuários
                  </p>
                </div>
              </div>
              <v-chip
                v-if="
                  friendsStore.sentRequestsPending && friendsStore.sentRequestsPending.length > 0
                "
                color="info"
                variant="flat"
                size="small"
                class="font-weight-bold"
              >
                {{ friendsStore.sentRequestsPending.length }}
              </v-chip>
            </v-card-title>

            <v-card-text class="px-0">
              <div
                v-if="
                  friendsStore.sentRequestsPending && friendsStore.sentRequestsPending.length > 0
                "
                class="requests-grid"
              >
                <div
                  v-for="request in friendsStore.sentRequestsPending"
                  :key="request.id"
                  class="request-card sent-request"
                >
                  <div class="request-content">
                    <div class="user-info">
                      <v-avatar size="48" color="info" class="user-avatar">
                        <v-icon color="white" size="24">mdi-account</v-icon>
                      </v-avatar>
                      <div class="user-details">
                        <h4 class="user-name">{{ request.senderName || 'Usuário' }}</h4>
                        <p class="user-email">Para: {{ request.senderEmail }}</p>
                        <p class="request-time">{{ formatTimeAgo(request.createdAt) }}</p>
                      </div>
                    </div>

                    <div class="request-actions">
                      <v-chip size="small" color="info" variant="flat" class="status-chip">
                        <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                        Pendente
                      </v-chip>
                      <v-btn
                        variant="outlined"
                        color="error"
                        size="small"
                        class="action-btn cancel-btn rounded-xl"
                        @click="cancelFriendRequest(request.id)"
                      >
                        <v-icon size="16" class="mr-1">mdi-close</v-icon>
                        Cancelar
                      </v-btn>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="empty-state">
                <div class="empty-icon">
                  <v-icon size="48" color="grey-lighten-1">mdi-account-arrow-right-outline</v-icon>
                </div>
                <h4 class="empty-title">Nenhuma solicitação enviada</h4>
                <p class="empty-subtitle">Procure por usuários e envie solicitações de amizade!</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Segunda coluna: Lista de amigos e suas estantes -->
        <v-col cols="12" lg="9" md="8">
          <v-card
            class="rounded-xl pa-4 animate-slide-up"
            elevation="2"
            :style="{ animationDelay: '100ms' }"
          >
            <v-card-title
              class="d-flex align-center justify-space-between text-h6 font-weight-bold"
            >
              <div>
                <v-icon icon="mdi-account-group" class="me-2" color="primary" />
                Meus amigos
              </div>
              <v-chip color="primary" size="small">
                {{ friendsStore.friends.length }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <div v-if="friendsStore.friends.length > 0">
                <v-row>
                  <v-col
                    v-for="friend in friendsStore.friends"
                    :key="friend.id"
                    cols="12"
                    md="6"
                    lg="4"
                    xl="3"
                    class="d-flex"
                  >
                    <v-card width="100%" class="friend-card enhanced" elevation="3">
                      <v-card-item>
                        <v-avatar
                          class="mb-2"
                          size="80"
                          :color="friend.photoURL ? undefined : 'primary'"
                        >
                          <v-img v-if="friend.photoURL" :src="friend.photoURL" />
                          <v-icon v-else color="white" size="40">mdi-account</v-icon>
                        </v-avatar>
                        <v-card-title>{{
                          friend.name || friend.email?.split('@')[0]
                        }}</v-card-title>
                        <v-card-subtitle>{{ friend.email }}</v-card-subtitle>
                      </v-card-item>

                      <v-card-text class="pt-0">
                        <div class="d-flex flex-column gap-2 mt-3">
                          <v-btn
                            block
                            color="primary"
                            variant="elevated"
                            prepend-icon="mdi-bookshelf"
                            @click="viewFriendBookshelf(friend)"
                          >
                            Ver estante
                          </v-btn>
                          <v-btn
                            block
                            color="error"
                            class="mt-3"
                            variant="tonal"
                            prepend-icon="mdi-account-remove"
                            @click="openRemoveFriendDialog(friend)"
                          >
                            Remover Amigo
                          </v-btn>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>

              <div v-else class="text-center py-8 text-medium-emphasis">
                <v-icon icon="mdi-account-group-outline" size="64" color="grey" />
                <p class="text-h6 mt-4">Você ainda não tem amigos.</p>
                <p class="text-body-1">Use a busca para encontrar e adicionar amigos.</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Diálogos -->
    <v-dialog v-model="confirmRemoveFriend" max-width="400" persistent>
      <v-card class="remove-dialog">
        <v-card-title class="bg-error text-white pa-4">
          <v-icon icon="mdi-account-remove" class="me-2" />
          Remover Amigo
        </v-card-title>
        <v-card-text class="pa-4">
          <p>Tem certeza que deseja remover este amigo? Esta ação não pode ser desfeita.</p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="outlined" @click="confirmRemoveFriend = false"> Cancelar </v-btn>
          <v-btn color="error" variant="flat" @click="removeFriendConfirmed"> Remover </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="4000">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" @click="showSnackbar = false" />
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from '@/stores/useAuthStore'
import { useFriendsStore } from '@/stores/useFriendsStore'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// Stores
const friendsStore = useFriendsStore()
const authStore = useAuthStore()
const router = useRouter()

// Estados reativos
const searchTab = ref(0)
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const displayedUsers = ref<any[]>([])
const hasSearched = ref(false)
const isProcessingRequest = ref<Record<string, boolean>>({})

// Estados dos diálogos
const confirmRemoveFriend = ref(false)
const friendToRemoveId = ref('')

// Estados das notificações
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Estados de loading
const isLoadingAllUsers = ref(false)
const allUsersLoaded = ref(false)
const isLoadingAuthUsers = ref(false)

// Função para formatar tempo
const formatTimeAgo = (date: any) => {
  if (!date) return ''

  const now = new Date()
  const requestDate = new Date(date)
  const diffInMinutes = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Agora mesmo'
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h atrás`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d atrás`

  return requestDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}

// Buscar usuários pelo email
const searchUsers = async () => {
  if (!searchQuery.value.trim()) return

  try {
    hasSearched.value = true
    searchResults.value = []
    isLoadingAllUsers.value = true

    // Usar o método do friendsStore para buscar usuários
    const result = await friendsStore.searchUsers(searchQuery.value.trim())

    if (result.users && result.users.length > 0) {
      searchResults.value = result.users.map((user: any) => ({
        id: user.id,
        email: user.email,
        displayName: user.name,
        photoURL: user.photoUrl,
        friendshipStatus: user.friendshipStatus,
        friendshipId: user.friendshipId,
        isSender: user.isSender,
      }))
    }
    displayedUsers.value = searchResults.value
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    showNotification('Erro ao buscar usuários', 'error')
  } finally {
    isLoadingAllUsers.value = false
  }
}

// Função para abrir diálogo de remoção
const openRemoveFriendDialog = (friend: any) => {
  friendToRemoveId.value = friend.friendshipId || friend.id
  confirmRemoveFriend.value = true
}

// Determinar o ícone a ser exibido no botão de ação de amizade
const getFriendshipIcon = (userId: string) => {
  const user = displayedUsers.value.find((u) => u.id === userId)

  if (!user) return 'mdi-account-plus'

  if (user.friendshipStatus === 'accepted') {
    return 'mdi-check'
  } else if (user.friendshipStatus === 'pending') {
    return user.isSender ? 'mdi-clock-outline' : 'mdi-account-arrow-left'
  } else if (user.friendshipStatus === 'rejected') {
    return 'mdi-account-cancel'
  } else {
    return 'mdi-account-plus'
  }
}

// Determinar a cor do botão de ação de amizade
const getFriendshipColor = (userId: string) => {
  const user = displayedUsers.value.find((u) => u.id === userId)

  if (!user) return 'success'

  if (user.friendshipStatus === 'accepted') {
    return 'success'
  } else if (user.friendshipStatus === 'pending') {
    return 'warning'
  } else if (user.friendshipStatus === 'rejected') {
    return 'error'
  } else {
    return 'primary'
  }
}

// Lidar com ação de amizade
const handleFriendAction = async (user: any) => {
  if (!authStore.userId) {
    showNotification('Você precisa estar logado para realizar esta ação', 'error')
    return
  }

  try {
    isProcessingRequest.value[user.id] = true

    if (user.friendshipStatus === 'accepted') {
      friendToRemoveId.value = user.friendshipId
      confirmRemoveFriend.value = true
    } else if (user.friendshipStatus === 'pending') {
      if (user.isSender) {
        const success = await friendsStore.cancelFriendRequest(user.friendshipId)
        if (success) {
          showNotification('Solicitação cancelada com sucesso')
          await searchUsers()
        } else {
          showNotification('Erro ao cancelar solicitação', 'error')
        }
      } else {
        const success = await friendsStore.acceptFriendRequest(user.friendshipId)
        if (success) {
          showNotification('Amizade aceita com sucesso!')
          await searchUsers()
          await friendsStore.fetchFriends()
        } else {
          showNotification('Erro ao aceitar solicitação', 'error')
        }
      }
    } else {
      const result = await friendsStore.sendFriendRequest(user.email)

      if (result.success) {
        showNotification('Solicitação de amizade enviada!')
        await searchUsers()
      } else if (result.alreadyFriends) {
        showNotification('Vocês já são amigos', 'info')
      } else if (result.pendingRequest) {
        showNotification('Já existe uma solicitação pendente', 'info')
      } else {
        showNotification('Erro ao enviar solicitação', 'error')
      }
    }
  } catch (error) {
    console.error('Erro ao processar ação de amizade:', error)
    showNotification('Erro ao processar solicitação', 'error')
  } finally {
    isProcessingRequest.value[user.id] = false
  }
}

// Aceitar solicitação de amizade
const acceptFriendRequest = async (requestId: string) => {
  try {
    const success = await friendsStore.acceptFriendRequest(requestId)

    if (success.success) {
      showNotification('Amizade aceita com sucesso!')
      await friendsStore.fetchFriends()
    } else {
      showNotification('Erro ao aceitar solicitação', 'error')
    }
  } catch (error) {
    console.error('Erro ao aceitar solicitação de amizade:', error)
    showNotification('Erro ao aceitar solicitação', 'error')
  }
}

// Rejeitar solicitação de amizade
const rejectFriendRequest = async (requestId: string) => {
  try {
    const success = await friendsStore.rejectFriendRequest(requestId)

    if (success.success) {
      showNotification('Solicitação de amizade rejeitada')
    } else {
      showNotification('Erro ao rejeitar solicitação', 'error')
    }
  } catch (error) {
    console.error('Erro ao rejeitar solicitação de amizade:', error)
    showNotification('Erro ao rejeitar solicitação', 'error')
  }
}

// Cancelar solicitação de amizade enviada
const cancelFriendRequest = async (requestId: string) => {
  try {
    const success = await friendsStore.cancelFriendRequest(requestId)

    if (success) {
      showNotification('Solicitação de amizade cancelada')
      await friendsStore.fetchSentRequests()
    } else {
      showNotification('Erro ao cancelar solicitação', 'error')
    }
  } catch (error) {
    console.error('Erro ao cancelar solicitação de amizade:', error)
    showNotification('Erro ao cancelar solicitação', 'error')
  }
}

// Remover amigo (confirmado)
const removeFriendConfirmed = async () => {
  if (!friendToRemoveId.value) return

  try {
    const success = await friendsStore.removeFriend(friendToRemoveId.value)

    if (success.success) {
      showNotification('Amigo removido com sucesso')
      await friendsStore.fetchFriends()
    } else {
      showNotification('Erro ao remover amigo', 'error')
    }
  } catch (error) {
    console.error('Erro ao remover amigo:', error)
    showNotification('Erro ao remover amigo', 'error')
  } finally {
    confirmRemoveFriend.value = false
    friendToRemoveId.value = ''
  }
}

// Ver estante do amigo
const viewFriendBookshelf = (friend: any) => {
  // Redirecionar para a página BookshelfView com o ID do amigo como parâmetro
  router.push(`/bookshelf?friendId=${friend.id}`)
}

// Ir para detalhes do livro do amigo
const goToFriendBook = (bookId: string, friendId: string) => {
  router.push(`/book/${bookId}/${friendId}`)
}

// Obter texto do status de leitura
const getStatusText = (status: number | string) => {
  const statusNum = Number(status)
  switch (statusNum) {
    case 2:
      return 'Lendo'
    case 1:
      return 'Já Li'
    default:
      return 'Quero Ler'
  }
}

// Obter cor do status de leitura
const getStatusColor = (status: number | string) => {
  const statusNum = Number(status)
  switch (statusNum) {
    case 2:
      return 'info'
    case 1:
      return 'success'
    default:
      return 'grey'
  }
}

// Função para mostrar notificações
const showNotification = (text: string, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  showSnackbar.value = true
}

// Carregar dados ao montar o componente
onMounted(async () => {
  try {
    // Inicializar buscando amigos e solicitações pendentes
    await friendsStore.fetchFriends()
    await friendsStore.fetchFriendRequests()
    await friendsStore.fetchSentRequests()
  } catch (error) {
    console.error('Erro ao carregar dados de amigos:', error)
    showNotification('Erro ao carregar seus amigos', 'error')
  }
})
</script>

<style scoped>
.friends-container {
  width: 100%;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  padding: 1rem;
  position: relative;
}

.page-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.5px;
}

.search-result-item {
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  margin-bottom: 8px;
  background-color: rgb(var(--v-theme-surface));
  border-radius: 8px;
}

.search-result-item:hover {
  background-color: rgb(var(--v-theme-surface-variant));
  border-left: 3px solid rgb(var(--v-theme-primary));
  transform: translateX(3px);
}

.friend-card {
  transition: all 0.3s ease;
  height: 100%;
  text-align: center;
  background-color: rgb(var(--v-theme-surface));
  border-radius: 16px;
  overflow: hidden;
}

.friend-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.friend-card.enhanced {
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
}

.friend-card.enhanced:hover {
  border-color: rgba(var(--v-theme-primary), 0.6);
  box-shadow: 0 8px 20px rgba(var(--v-theme-primary), 0.15);
}

.friend-book-card {
  height: 100%;
  transition: all 0.3s ease;
  background-color: rgb(var(--v-theme-surface));
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
}

.friend-book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.request-item {
  transition: background-color 0.2s ease;
  border-radius: 8px;
  margin-bottom: 8px;
}

.request-item:hover {
  background-color: rgb(var(--v-theme-surface-variant));
}

.remove-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.animate-slide-up {
  animation: slide-up 0.6s ease;
}

.theme-text {
  color: rgb(var(--v-theme-on-background));
}

/* CARDS MODERNOS */
.modern-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
}

.modern-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.2);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.12);
}

/* WRAPPER DOS ÍCONES */
.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.icon-wrapper.warning {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.icon-wrapper.info {
  background: linear-gradient(135deg, #2196f3, #1976d2);
}

/* GRID DE SOLICITAÇÕES */
.requests-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

@media (min-width: 768px) {
  .requests-grid {
    grid-template-columns: 1fr;
    max-width: 100%;
  }
}

@media (min-width: 1200px) {
  .requests-grid {
    grid-template-columns: 1fr;
    max-width: 100%;
  }
}

/* CARDS DE SOLICITAÇÃO */
.request-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.request-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--v-theme-primary), var(--v-theme-secondary));
}

.request-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.received-request {
  border-color: rgba(255, 152, 0, 0.3);
}

.received-request::before {
  background: linear-gradient(90deg, #ff9800, #f57c00);
}

.received-request:hover {
  border-color: rgba(255, 152, 0, 0.5);
}

.sent-request {
  border-color: rgba(33, 150, 243, 0.3);
}

.sent-request::before {
  background: linear-gradient(90deg, #2196f3, #1976d2);
}

.sent-request:hover {
  border-color: rgba(33, 150, 243, 0.5);
}

/* CONTEÚDO DA SOLICITAÇÃO */
.request-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.user-avatar {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.user-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.8;
}

.request-time {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
  opacity: 0.6;
}

/* AÇÕES */
.request-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.action-btn {
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: none;
  border-radius: 12px;
  min-width: 80px;
  height: 36px;
}

.accept-btn {
  background: linear-gradient(135deg, #4caf50, #388e3c) !important;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.reject-btn,
.cancel-btn {
  border-width: 2px;
  font-weight: 500;
}

.status-chip {
  font-size: 0.75rem;
  font-weight: 500;
}

/* ESTADO VAZIO */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 8px 0;
}

.empty-subtitle {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0;
  opacity: 0.8;
}

/* RESPONSIVIDADE MOBILE */
@media (max-width: 600px) {
  .page-title {
    font-size: 1.8rem;
  }

  .request-card {
    padding: 16px;
  }

  .user-info {
    gap: 10px;
  }

  .user-avatar {
    width: 40px !important;
    height: 40px !important;
  }

  .request-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .empty-state {
    padding: 24px 16px;
  }

  .icon-wrapper {
    width: 36px;
    height: 36px;
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
