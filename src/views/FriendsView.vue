<template>
  <div class="friends-container fill-height">
    <v-container fluid class="py-8">
      <v-row>
        <v-col cols="12">
          <h1 class="text-h3 font-weight-bold mb-6 text-center page-title">
            <span>👥 Amigos & Conexões Literárias</span>
          </h1>

          <p class="text-subtitle-1 text-center mb-8 theme-text">
            Conecte-se com outros leitores, descubra livros e compartilhe sua jornada literária
          </p>
        </v-col>
      </v-row>

      <v-row>
        <!-- Primeira coluna: Pesquisa de amigos e solicitações -->
        <v-col cols="12" lg="3" md="4">
          <v-card class="rounded-xl pa-4 mb-6 animate-slide-up" elevation="2">
            <v-card-title class="text-h6 font-weight-bold">
              <v-icon icon="mdi-account-search" class="me-2" color="primary" />
              Encontrar amigos
            </v-card-title>

            <v-card-text>
              <v-tabs v-model="searchTab" bg-color="transparent">
                <v-tab value="search" class="text-subtitle-2">Buscar</v-tab>
              </v-tabs>

              <v-divider class="mb-3 mt-1"></v-divider>

              <v-window class="py-2" v-model="searchTab">
                <!-- Aba de busca -->
                <v-window-item value="search">
                  <v-form @submit.prevent="searchUsers">
                    <v-text-field
                      v-model="searchQuery"
                      label="Buscar por ID, email ou nome"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-magnify"
                      append-inner-icon="mdi-send"
                      rounded="lg"
                      hide-details
                      class="mb-3"
                      @click:append-inner="searchUsers"
                      placeholder="Digite o ID, email ou nome do usuário"
                    />

                    <p class="text-caption mb-4">
                      Digite o email exato, ID completo ou nome do usuário para adicionar como
                      amigo.
                    </p>
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
                    <v-list-item-subtitle class="text-truncate"
                      >ID: {{ user.id }}</v-list-item-subtitle
                    >

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

          <!-- Solicitações pendentes -->
          <v-card
            class="rounded-xl pa-4 mb-6 animate-slide-up"
            elevation="2"
            :style="{ animationDelay: '200ms' }"
          >
            <v-card-title
              class="d-flex align-center justify-space-between text-h6 font-weight-bold"
            >
              <div>
                <v-icon icon="mdi-account-clock" class="me-2" color="warning" />
                Solicitações recebidas
              </div>
              <v-chip
                color="warning"
                size="small"
                v-if="friendsStore.friendRequests && friendsStore.friendRequests.length > 0"
              >
                {{ friendsStore.friendRequests.length }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <v-list
                v-if="friendsStore.friendRequests && friendsStore.friendRequests.length > 0"
                class="pa-0"
              >
                <v-list-item
                  v-for="request in friendsStore.friendRequests"
                  :key="request.id"
                  class="mb-2 rounded-lg request-item"
                >
                  <v-list-item-title>{{ request.fromName || request.fromEmail }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">{{
                    request.fromEmail
                  }}</v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="d-flex gap-2">
                      <v-btn
                        variant="tonal"
                        color="success"
                        size="small"
                        icon="mdi-check"
                        @click="acceptFriendRequest(request.id)"
                      />
                      <v-btn
                        variant="outlined"
                        color="error"
                        size="small"
                        icon="mdi-close"
                        @click="rejectFriendRequest(request.id)"
                      />
                    </div>
                  </template>
                </v-list-item>
              </v-list>

              <div v-else class="text-center py-4 text-medium-emphasis">
                <v-icon icon="mdi-check-circle-outline" size="40" color="grey" />
                <p class="mt-2">Nenhuma solicitação pendente.</p>
              </div>
            </v-card-text>
          </v-card>

          <!-- Solicitações enviadas -->
          <v-card
            class="rounded-xl pa-4 mb-6 animate-slide-up"
            elevation="2"
            :style="{ animationDelay: '300ms' }"
          >
            <v-card-title
              class="d-flex align-center justify-space-between text-h6 font-weight-bold"
            >
              <div>
                <v-icon icon="mdi-account-arrow-right" class="me-2" color="info" />
                Solicitações enviadas
              </div>
              <v-chip
                color="info"
                size="small"
                v-if="
                  friendsStore.sentRequestsPending && friendsStore.sentRequestsPending.length > 0
                "
              >
                {{ friendsStore.sentRequestsPending.length }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <v-list
                v-if="
                  friendsStore.sentRequestsPending && friendsStore.sentRequestsPending.length > 0
                "
                class="pa-0"
              >
                <v-list-item
                  v-for="request in friendsStore.sentRequestsPending"
                  :key="request.id"
                  class="mb-2 rounded-lg request-item"
                >
                  <v-list-item-title>{{ request.senderName || 'Usuário' }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    Para: {{ request.senderEmail }}
                    <v-tooltip location="top">
                      <template v-slot:activator="{ props }">
                        <v-icon v-bind="props" size="small" color="info" class="ms-1">
                          mdi-information-outline
                        </v-icon>
                      </template>
                      <span
                        >ID:
                        {{
                          request.user_id_1 === authStore.userId
                            ? request.user_id_2
                            : request.user_id_1
                        }}</span
                      >
                    </v-tooltip>
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="d-flex gap-2">
                      <v-chip size="small" color="info">Pendente</v-chip>
                      <v-btn
                        variant="outlined"
                        color="error"
                        size="small"
                        icon="mdi-close"
                        @click="cancelFriendRequest(request.id)"
                      />
                    </div>
                  </template>
                </v-list-item>
              </v-list>

              <div v-else class="text-center py-4 text-medium-emphasis">
                <v-icon icon="mdi-account-arrow-right-outline" size="40" color="grey" />
                <p class="mt-2">Nenhuma solicitação enviada.</p>
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
                        <v-card-title>{{ friend.name || friend.email.split('@')[0] }}</v-card-title>
                        <v-card-subtitle>{{ friend.email }}</v-card-subtitle>
                      </v-card-item>

                      <v-card-text class="pt-0">
                        <v-chip size="small" color="primary" variant="outlined" class="mb-3">
                          {{ friend.bookCount || 0 }} livros na estante
                        </v-chip>

                        <!-- Botões de ação -->
                        <div class="d-flex justify-space-between align-center gap-2 mt-2">
                          <v-btn
                            block
                            color="primary"
                            variant="elevated"
                            prepend-icon="mdi-bookshelf"
                            @click="viewFriendBookshelf(friend)"
                            class="flex-grow-1"
                          >
                            Ver estante
                          </v-btn>

                          <v-menu location="bottom">
                            <template v-slot:activator="{ props }">
                              <v-btn
                                v-bind="props"
                                icon="mdi-dots-vertical"
                                variant="text"
                                size="small"
                                @click.stop
                              />
                            </template>
                            <v-list>
                              <v-list-item @click="removeFriend(friend.id)">
                                <v-list-item-title class="d-flex align-center text-error">
                                  <v-icon class="me-2" color="error">mdi-account-remove</v-icon>
                                  Remover amigo
                                </v-list-item-title>
                              </v-list-item>
                            </v-list>
                          </v-menu>
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

          <!-- Card separado para exibir a estante do amigo selecionado -->
          <v-card v-if="selectedFriend" class="rounded-xl pa-4 mt-4 animate-slide-up" elevation="2">
            <v-card-title
              class="d-flex align-center justify-space-between text-h6 font-weight-bold"
            >
              <div class="d-flex align-center">
                <v-avatar
                  :color="selectedFriend.photoURL ? undefined : 'primary'"
                  size="40"
                  class="me-2"
                >
                  <v-img v-if="selectedFriend.photoURL" :src="selectedFriend.photoURL" />
                  <v-icon v-else color="white">mdi-account</v-icon>
                </v-avatar>
                <span>
                  Estante de {{ selectedFriend.name || selectedFriend.email.split('@')[0] }}
                </span>
              </div>
              <v-btn
                icon="mdi-close"
                variant="text"
                @click="
                  selectedFriend = null
                  friendBooks = []
                "
              ></v-btn>
            </v-card-title>

            <v-card-text>
              <v-row v-if="friendBooks.length > 0">
                <v-col
                  v-for="book in friendBooks"
                  :key="book.id"
                  cols="12"
                  sm="6"
                  md="4"
                  lg="3"
                  class="d-flex"
                >
                  <v-card width="100%" class="friend-book-card" hover elevation="2">
                    <v-img
                      :src="book.coverImage || '/placeholder-book.png'"
                      height="200"
                      cover
                      class="align-end"
                    >
                      <v-chip
                        v-if="book.status !== undefined"
                        :color="getStatusColor(book.status)"
                        size="small"
                        class="ma-2"
                      >
                        {{ getStatusText(book.status) }}
                      </v-chip>
                    </v-img>

                    <v-card-title class="text-subtitle-1 text-truncate">
                      {{ book.title }}
                    </v-card-title>

                    <v-card-subtitle class="text-truncate">
                      {{ book.author }}
                    </v-card-subtitle>

                    <v-card-text>
                      <div v-if="book.rating || book.avaliacao" class="mb-1">
                        <v-rating
                          :model-value="book.rating || book.avaliacao"
                          readonly
                          size="small"
                          color="amber"
                          half-increments
                          density="compact"
                        ></v-rating>
                      </div>

                      <div v-if="book.genre" class="mb-1 text-caption">
                        <strong>Gênero:</strong> {{ book.genre }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <div v-else class="text-center py-8 text-medium-emphasis">
                <v-icon icon="mdi-bookshelf" size="64" color="grey" />
                <p class="text-h6 mt-4">Estante vazia</p>
                <p class="text-body-1">Este usuário ainda não adicionou livros à sua estante.</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Diálogo de confirmação para remover amigo -->
    <v-dialog v-model="confirmRemoveFriend" max-width="400" transition="dialog-bottom-transition">
      <v-card class="remove-dialog rounded-xl">
        <v-card-title class="bg-error text-white pa-4 text-h6">Confirmar remoção</v-card-title>
        <v-card-text class="pt-4 pb-2">
          <p>Tem certeza que deseja remover esta pessoa da sua lista de amigos?</p>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="confirmRemoveFriend = false"
            >Cancelar</v-btn
          >
          <v-btn color="error" @click="removeFriendConfirmed">Remover</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para notificações -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" @click="showSnackbar = false"></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from '@/stores/useAuthStore'
import { useFriendsStore } from '@/stores/useFriendsStore'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const friendsStore = useFriendsStore()
const router = useRouter()
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const displayedUsers = ref<any[]>([])
const hasSearched = ref(false)
const isProcessingRequest = ref<Record<string, boolean>>({})
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const selectedFriend = ref<any>(null)
const friendBooks = ref<any[]>([])
const searchTab = ref('search')
const confirmRemoveFriend = ref(false)
const friendToRemoveId = ref('')
const isLoadingAllUsers = ref(false)
const allUsersLoaded = ref(false)
const isLoadingAuthUsers = ref(false)

// Buscar usuários pelo email
const searchUsers = async () => {
  if (!searchQuery.value.trim()) return

  try {
    hasSearched.value = true
    searchResults.value = []

    // Usar o método do friendsStore para buscar usuários
    const result = await friendsStore.searchUsers(searchQuery.value.trim())

    if (result.users && result.users.length > 0) {
      searchResults.value = result.users.map((user) => ({
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
  }
}

// Carregar todos os usuários
const loadAllUsers = async () => {
  try {
    isLoadingAllUsers.value = true
    allUsersLoaded.value = false
    displayedUsers.value = []

    // Usar a nova função que busca os usuários públicos
    const result = await friendsStore.fetchAllUsersPublic()

    if (result.users && result.users.length > 0) {
      displayedUsers.value = result.users.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.name,
        photoURL: user.photoUrl,
        friendshipStatus: user.friendshipStatus,
        friendshipId: user.friendshipId,
        isSender: user.isSender,
      }))
      allUsersLoaded.value = true

      console.log(`Encontrados ${displayedUsers.value.length} usuários`)
    } else {
      console.log('Nenhum usuário encontrado')
    }
  } catch (error) {
    console.error('Erro ao carregar todos os usuários:', error)
    showNotification('Erro ao carregar usuários', 'error')
  } finally {
    isLoadingAllUsers.value = false
  }
}

// Carregar usuários do auth.users
const loadAuthUsers = async () => {
  try {
    isLoadingAuthUsers.value = true
    displayedUsers.value = []

    const result = await friendsStore.fetchAuthUsers()

    if (result.users && result.users.length > 0) {
      displayedUsers.value = result.users.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.name,
        photoURL: user.photoUrl,
        friendshipStatus: user.friendshipStatus,
        friendshipId: user.friendshipId,
        isSender: user.isSender,
      }))
    }
  } catch (error) {
    console.error('Erro ao carregar usuários do auth.users:', error)
    showNotification('Erro ao carregar usuários do auth.users', 'error')
  } finally {
    isLoadingAuthUsers.value = false
  }
}

// Determinar o ícone a ser exibido no botão de ação de amizade
const getFriendshipIcon = (userId: string) => {
  const user = displayedUsers.value.find((u) => u.id === userId)

  if (!user) return 'mdi-account-plus'

  // Ícones baseados no status da amizade
  if (user.friendshipStatus === 'accepted') {
    return 'mdi-check' // Já é amigo
  } else if (user.friendshipStatus === 'pending') {
    return user.isSender ? 'mdi-clock-outline' : 'mdi-account-arrow-left' // Pendente
  } else if (user.friendshipStatus === 'rejected') {
    return 'mdi-account-cancel' // Rejeitada
  } else {
    return 'mdi-account-plus' // Adicionar amigo
  }
}

// Determinar a cor do botão de ação de amizade
const getFriendshipColor = (userId: string) => {
  const user = displayedUsers.value.find((u) => u.id === userId)

  if (!user) return 'success'

  // Cores baseadas no status da amizade
  if (user.friendshipStatus === 'accepted') {
    return 'success' // Já é amigo
  } else if (user.friendshipStatus === 'pending') {
    return 'warning' // Pendente
  } else if (user.friendshipStatus === 'rejected') {
    return 'error' // Rejeitada
  } else {
    return 'primary' // Adicionar amigo
  }
}

// Lidar com ação de amizade (enviar solicitação, cancelar solicitação, etc)
const handleFriendAction = async (user: any) => {
  if (!authStore.userId) {
    showNotification('Você precisa estar logado para realizar esta ação', 'error')
    return
  }

  try {
    isProcessingRequest.value[user.id] = true

    if (user.friendshipStatus === 'accepted') {
      // Já é amigo, opção de remover
      friendToRemoveId.value = user.friendshipId
      confirmRemoveFriend.value = true
    } else if (user.friendshipStatus === 'pending') {
      if (user.isSender) {
        // Cancelar solicitação enviada
        const success = await friendsStore.cancelFriendRequest(user.friendshipId)
        if (success) {
          showNotification('Solicitação cancelada com sucesso')
          await searchUsers() // Recarregar resultados
        } else {
          showNotification('Erro ao cancelar solicitação', 'error')
        }
      } else {
        // Aceitar uma solicitação recebida
        const success = await friendsStore.acceptFriendRequest(user.friendshipId)
        if (success) {
          showNotification('Amizade aceita com sucesso!')
          await searchUsers() // Recarregar resultados
          await friendsStore.fetchFriends() // Atualizar lista de amigos
        } else {
          showNotification('Erro ao aceitar solicitação', 'error')
        }
      }
    } else {
      // Enviar nova solicitação
      const result = await friendsStore.sendFriendRequest(user.email)

      if (result.success) {
        showNotification('Solicitação de amizade enviada!')
        await searchUsers() // Recarregar resultados
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
      // Garantir que a lista de amigos seja atualizada explicitamente
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
      // A lista de solicitações será atualizada automaticamente via subscriptions
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
      await friendsStore.fetchSentRequests() // Atualizar lista de solicitações enviadas
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
      // Se o amigo removido era o selecionado, limpar a seleção
      if (selectedFriend.value && selectedFriend.value.id === friendToRemoveId.value) {
        selectedFriend.value = null
        friendBooks.value = []
      }

      showNotification('Amigo removido com sucesso')
    } else {
      showNotification('Erro ao remover amigo', 'error')
    }

    confirmRemoveFriend.value = false
  } catch (error) {
    console.error('Erro ao remover amigo:', error)
    showNotification('Erro ao remover amigo', 'error')
    confirmRemoveFriend.value = false
  }
}

// Selecionar um amigo
const selectFriend = (friend: any) => {
  if (selectedFriend.value && selectedFriend.value.id === friend.id) {
    selectedFriend.value = null
    friendBooks.value = []
  } else {
    selectedFriend.value = friend
    loadFriendBooks(friend.id)
  }
}

// Ver estante do amigo
const viewFriendBookshelf = (friend: any) => {
  // Redirecionar para a página BookshelfView com o ID do amigo como parâmetro
  router.push(`/bookshelf?friendId=${friend.id}`)
}

// Carregar livros de um amigo
const loadFriendBooks = async (friendId: string) => {
  try {
    friendBooks.value = []

    // Usar o store para carregar os livros do amigo
    const books = await friendsStore.fetchFriendBooks(friendId)
    friendBooks.value = books
  } catch (error) {
    console.error('Erro ao carregar estante do amigo:', error)
    showNotification('Erro ao carregar livros', 'error')
  }
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

/* Nova classe para aprimorar a visualização do card de amigos */
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

@media (max-width: 600px) {
  .page-title {
    font-size: 1.8rem;
  }
}
</style>
