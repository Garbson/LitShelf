<template>
  <div class="friends-container literary-bg fill-height">
    <v-container fluid class="py-8">
      <v-row>
        <v-col cols="12">
          <h1 class="text-h3 font-weight-bold mb-6 text-center gradient-heading animate-fade-in">
            Amigos & Conexões Literárias
          </h1>
          
          <p class="text-subtitle-1 text-center mb-8">
            Conecte-se com outros leitores, descubra livros e compartilhe sua jornada literária
          </p>
        </v-col>
      </v-row>

      <v-row>
        <!-- Primeira coluna: Pesquisa de amigos e solicitações -->
        <v-col cols="12" lg="3" md="4">
          <v-card class="rounded-lg pa-4 mb-6 animate-slide-up" elevation="3">
            <v-card-title class="text-h6 text-serif">
              <v-icon icon="mdi-account-search" class="me-2" color="primary" />
              Encontrar amigos
            </v-card-title>
            
            <v-card-text>
              <v-form @submit.prevent="searchUsers">
                <v-text-field
                  v-model="searchQuery"
                  label="Buscar por email ou nome"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-magnify"
                  append-inner-icon="mdi-send"
                  class="mb-3"
                  @click:append-inner="searchUsers"
                />
                
                <p class="text-caption mb-4">
                  Encontre amigos para compartilhar sua experiência literária.
                </p>
              </v-form>
              
              <v-divider class="my-3" />
              
              <!-- Resultados da busca -->
              <div v-if="searchResults.length > 0" class="search-results mt-4">
                <h3 class="text-subtitle-1 mb-3">Resultados da busca</h3>
                
                <v-list lines="two">
                  <v-list-item
                    v-for="user in searchResults"
                    :key="user.id"
                    class="mb-2 rounded-lg search-result-item"
                  >
                    <template v-slot:prepend>
                      <v-avatar color="primary">
                        <v-icon color="white">mdi-account</v-icon>
                      </v-avatar>
                    </template>
                    
                    <v-list-item-title>{{ user.displayName || user.email }}</v-list-item-title>
                    <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
                    
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
              
              <div v-else-if="hasSearched" class="text-center py-4 text-medium-emphasis">
                <v-icon icon="mdi-account-search-outline" size="40" color="grey" />
                <p class="mt-2">Nenhum usuário encontrado.</p>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Solicitações pendentes -->
          <v-card class="rounded-lg pa-4 mb-6 animate-slide-up" elevation="3" :style="{ animationDelay: '200ms' }">
            <v-card-title class="d-flex align-center justify-space-between text-h6 text-serif">
              <div>
                <v-icon icon="mdi-account-clock" class="me-2" color="warning" />
                Solicitações pendentes
              </div>
              <v-chip color="warning" size="small" v-if="friendRequests.length > 0">
                {{ friendRequests.length }}
              </v-chip>
            </v-card-title>
            
            <v-card-text>
              <v-list v-if="friendRequests.length > 0" class="pa-0">
                <v-list-item
                  v-for="request in friendRequests"
                  :key="request.id"
                  class="mb-2 rounded-lg request-item"
                >
                  <v-list-item-title>{{ request.displayName || request.email }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">{{ request.email }}</v-list-item-subtitle>
                  
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
        </v-col>
        
        <!-- Segunda coluna: Lista de amigos e suas estantes -->
        <v-col cols="12" lg="9" md="8">
          <v-card class="rounded-lg pa-4 animate-slide-up" elevation="3" :style="{ animationDelay: '100ms' }">
            <v-card-title class="d-flex align-center justify-space-between text-h6 text-serif">
              <div>
                <v-icon icon="mdi-account-group" class="me-2" color="primary" />
                Meus amigos
              </div>
              <v-chip color="primary" size="small">
                {{ friends.length }}
              </v-chip>
            </v-card-title>
            
            <v-card-text>
              <v-tabs v-model="activeTab" bg-color="transparent">
                <v-tab value="friends" class="text-subtitle-1">Amigos</v-tab>
                <v-tab value="bookshelf" class="text-subtitle-1" :disabled="!selectedFriend">Estante</v-tab>
              </v-tabs>
              
              <v-divider class="mb-4"></v-divider>
              
              <v-window v-model="activeTab">
                <!-- Aba de amigos -->
                <v-window-item value="friends">
                  <v-row v-if="friends.length > 0">
                    <v-col 
                      v-for="friend in friends" 
                      :key="friend.id" 
                      cols="12" 
                      md="6" 
                      lg="4"
                      xl="3"
                      class="d-flex"
                    >
                      <v-card 
                        width="100%" 
                        class="friend-card" 
                        :class="{'selected-friend': selectedFriend && selectedFriend.id === friend.id}"
                        @click="selectFriend(friend)"
                        elevation="2"
                      >
                        <v-card-item>
                          <v-avatar class="mb-2" size="80" color="primary">
                            <v-icon color="white" size="40">mdi-account</v-icon>
                          </v-avatar>
                          <v-card-title>{{ friend.displayName || friend.email.split('@')[0] }}</v-card-title>
                          <v-card-subtitle>{{ friend.email }}</v-card-subtitle>
                        </v-card-item>
                        
                        <v-card-text class="d-flex justify-space-between align-center">
                          <div>
                            <v-chip size="small" color="primary" variant="outlined" class="me-1">
                              {{ friend.bookCount || 0 }} livros
                            </v-chip>
                          </div>
                          
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
                              <v-list-item @click="viewFriendBookshelf(friend)">
                                <v-list-item-title class="d-flex align-center">
                                  <v-icon class="me-2">mdi-bookshelf</v-icon>
                                  Ver estante
                                </v-list-item-title>
                              </v-list-item>
                              <v-divider></v-divider>
                              <v-list-item @click="removeFriend(friend.id)">
                                <v-list-item-title class="d-flex align-center text-error">
                                  <v-icon class="me-2" color="error">mdi-account-remove</v-icon>
                                  Remover amigo
                                </v-list-item-title>
                              </v-list-item>
                            </v-list>
                          </v-menu>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                  
                  <div v-else class="text-center py-8 text-medium-emphasis">
                    <v-icon icon="mdi-account-group-outline" size="64" color="grey" />
                    <p class="text-h6 mt-4">Você ainda não tem amigos.</p>
                    <p class="text-body-1">Use a busca para encontrar e adicionar amigos.</p>
                  </div>
                </v-window-item>
                
                <!-- Aba da estante do amigo -->
                <v-window-item value="bookshelf">
                  <div v-if="selectedFriend" class="friend-bookshelf">
                    <div class="d-flex align-center mb-4">
                      <v-avatar color="primary" size="40" class="me-2">
                        <v-icon color="white">mdi-account</v-icon>
                      </v-avatar>
                      <h3 class="text-h6">
                        Estante de {{ selectedFriend.displayName || selectedFriend.email.split('@')[0] }}
                      </h3>
                    </div>
                    
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
                              v-if="book.status"
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
                            <div v-if="book.rating" class="mb-1">
                              <v-rating
                                :model-value="book.rating"
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
                  </div>
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Diálogo de confirmação para remover amigo -->
    <v-dialog v-model="confirmRemoveFriend" max-width="400" transition="dialog-bottom-transition">
      <v-card class="remove-dialog">
        <v-card-title class="bg-error text-white pa-4 text-h6">Confirmar remoção</v-card-title>
        <v-card-text class="pt-4 pb-2">
          <p>Tem certeza que deseja remover esta pessoa da sua lista de amigos?</p>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="confirmRemoveFriend = false">Cancelar</v-btn>
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
import { db } from '@/firebase';
import { useAuthStore } from '@/stores/useAuthStore';
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { onMounted, ref } from 'vue';

const authStore = useAuthStore();
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const hasSearched = ref(false);
const friends = ref<any[]>([]);
const friendRequests = ref<any[]>([]);
const sentRequests = ref<string[]>([]);
const isProcessingRequest = ref<Record<string, boolean>>({});
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
const selectedFriend = ref<any>(null);
const friendBooks = ref<any[]>([]);
const activeTab = ref('friends');
const confirmRemoveFriend = ref(false);
const friendToRemoveId = ref('');

// Buscar usuários
const searchUsers = async () => {
  if (!searchQuery.value.trim()) return;
  
  try {
    hasSearched.value = true;
    searchResults.value = [];
    
    // Buscar na coleção de usuários
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('email', '>=', searchQuery.value.toLowerCase()),
      where('email', '<=', searchQuery.value.toLowerCase() + '\uf8ff')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filtrar resultados para não incluir o usuário atual nem amigos atuais
    const currentUser = authStore.user;
    const friendIds = friends.value.map(friend => friend.id);
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      // Não incluir o próprio usuário nos resultados
      if (doc.id !== currentUser?.uid && !friendIds.includes(doc.id)) {
        searchResults.value.push({
          id: doc.id,
          email: userData.email,
          displayName: userData.displayName || null
        });
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    showNotification('Erro ao buscar usuários', 'error');
  }
};

// Carregar amigos e solicitações pendentes
const loadFriendsAndRequests = async () => {
  if (!authStore.user) return;
  
  try {
    const userRef = doc(db, 'users', authStore.user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Carregar amigos
      friends.value = [];
      if (userData.friends && userData.friends.length > 0) {
        for (const friendId of userData.friends) {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            
            // Contar quantos livros o amigo tem
            const booksRef = collection(db, `users/${friendId}/books`);
            const booksSnapshot = await getDocs(booksRef);
            const bookCount = booksSnapshot.size;
            
            friends.value.push({
              id: friendId,
              email: friendData.email,
              displayName: friendData.displayName || null,
              bookCount
            });
          }
        }
      }
      
      // Carregar solicitações recebidas
      friendRequests.value = [];
      if (userData.friendRequests && userData.friendRequests.length > 0) {
        for (const requesterId of userData.friendRequests) {
          const requesterDoc = await getDoc(doc(db, 'users', requesterId));
          if (requesterDoc.exists()) {
            const requesterData = requesterDoc.data();
            friendRequests.value.push({
              id: requesterId,
              email: requesterData.email,
              displayName: requesterData.displayName || null
            });
          }
        }
      }
      
      // Carregar solicitações enviadas
      sentRequests.value = userData.sentRequests || [];
    }
  } catch (error) {
    console.error('Erro ao carregar amigos e solicitações:', error);
    showNotification('Erro ao carregar seus contatos', 'error');
  }
};

// Determinar o ícone a ser exibido no botão de ação de amizade
const getFriendshipIcon = (userId: string) => {
  if (sentRequests.value.includes(userId)) {
    return 'mdi-clock-outline'; // Solicitação enviada pendente
  }
  return 'mdi-account-plus'; // Adicionar amigo
};

// Determinar a cor do botão de ação de amizade
const getFriendshipColor = (userId: string) => {
  if (sentRequests.value.includes(userId)) {
    return 'warning'; // Solicitação enviada pendente
  }
  return 'success'; // Adicionar amigo
};

// Lidar com ação de amizade (enviar solicitação ou cancelar solicitação)
const handleFriendAction = async (user: any) => {
  if (!authStore.user) return;
  
  try {
    isProcessingRequest.value[user.id] = true;
    
    if (sentRequests.value.includes(user.id)) {
      // Cancelar solicitação pendente
      await cancelFriendRequest(user.id);
    } else {
      // Enviar nova solicitação
      await sendFriendRequest(user.id);
    }
  } finally {
    isProcessingRequest.value[user.id] = false;
  }
};

// Enviar solicitação de amizade
const sendFriendRequest = async (recipientId: string) => {
  if (!authStore.user) return;
  
  try {
    const senderRef = doc(db, 'users', authStore.user.uid);
    const recipientRef = doc(db, 'users', recipientId);
    
    // Adicionar ID do destinatário à lista de solicitações enviadas do remetente
    await updateDoc(senderRef, {
      sentRequests: arrayUnion(recipientId)
    });
    
    // Adicionar ID do remetente à lista de solicitações recebidas do destinatário
    await updateDoc(recipientRef, {
      friendRequests: arrayUnion(authStore.user.uid)
    });
    
    // Atualizar localmente
    sentRequests.value.push(recipientId);
    
    showNotification('Solicitação de amizade enviada!');
  } catch (error) {
    console.error('Erro ao enviar solicitação de amizade:', error);
    showNotification('Erro ao enviar solicitação', 'error');
  }
};

// Cancelar solicitação de amizade
const cancelFriendRequest = async (recipientId: string) => {
  if (!authStore.user) return;
  
  try {
    const senderRef = doc(db, 'users', authStore.user.uid);
    const recipientRef = doc(db, 'users', recipientId);
    
    // Remover ID do destinatário da lista de solicitações enviadas do remetente
    await updateDoc(senderRef, {
      sentRequests: arrayRemove(recipientId)
    });
    
    // Remover ID do remetente da lista de solicitações recebidas do destinatário
    await updateDoc(recipientRef, {
      friendRequests: arrayRemove(authStore.user.uid)
    });
    
    // Atualizar localmente
    sentRequests.value = sentRequests.value.filter(id => id !== recipientId);
    
    showNotification('Solicitação de amizade cancelada');
  } catch (error) {
    console.error('Erro ao cancelar solicitação de amizade:', error);
    showNotification('Erro ao cancelar solicitação', 'error');
  }
};

// Aceitar solicitação de amizade
const acceptFriendRequest = async (senderId: string) => {
  if (!authStore.user) return;
  
  try {
    const currentUserRef = doc(db, 'users', authStore.user.uid);
    const senderRef = doc(db, 'users', senderId);
    
    // Adicionar amigos nas listas um do outro
    await updateDoc(currentUserRef, {
      friends: arrayUnion(senderId),
      friendRequests: arrayRemove(senderId)
    });
    
    await updateDoc(senderRef, {
      friends: arrayUnion(authStore.user.uid),
      sentRequests: arrayRemove(authStore.user.uid)
    });
    
    // Atualizar localmente
    const senderDoc = await getDoc(senderRef);
    if (senderDoc.exists()) {
      const senderData = senderDoc.data();
      
      // Contar quantos livros o novo amigo tem
      const booksRef = collection(db, `users/${senderId}/books`);
      const booksSnapshot = await getDocs(booksRef);
      const bookCount = booksSnapshot.size;
      
      friends.value.push({
        id: senderId,
        email: senderData.email,
        displayName: senderData.displayName || null,
        bookCount
      });
      
      // Remover da lista de solicitações pendentes
      friendRequests.value = friendRequests.value.filter(req => req.id !== senderId);
    }
    
    showNotification('Amizade aceita com sucesso!');
  } catch (error) {
    console.error('Erro ao aceitar solicitação de amizade:', error);
    showNotification('Erro ao aceitar solicitação', 'error');
  }
};

// Rejeitar solicitação de amizade
const rejectFriendRequest = async (senderId: string) => {
  if (!authStore.user) return;
  
  try {
    const currentUserRef = doc(db, 'users', authStore.user.uid);
    const senderRef = doc(db, 'users', senderId);
    
    // Remover solicitação
    await updateDoc(currentUserRef, {
      friendRequests: arrayRemove(senderId)
    });
    
    await updateDoc(senderRef, {
      sentRequests: arrayRemove(authStore.user.uid)
    });
    
    // Atualizar localmente
    friendRequests.value = friendRequests.value.filter(req => req.id !== senderId);
    
    showNotification('Solicitação de amizade rejeitada');
  } catch (error) {
    console.error('Erro ao rejeitar solicitação de amizade:', error);
    showNotification('Erro ao rejeitar solicitação', 'error');
  }
};

// Remover amigo (preparar)
const removeFriend = (friendId: string) => {
  friendToRemoveId.value = friendId;
  confirmRemoveFriend.value = true;
};

// Remover amigo (confirmado)
const removeFriendConfirmed = async () => {
  if (!authStore.user || !friendToRemoveId.value) return;
  
  try {
    const currentUserRef = doc(db, 'users', authStore.user.uid);
    const friendRef = doc(db, 'users', friendToRemoveId.value);
    
    // Remover dos amigos um do outro
    await updateDoc(currentUserRef, {
      friends: arrayRemove(friendToRemoveId.value)
    });
    
    await updateDoc(friendRef, {
      friends: arrayRemove(authStore.user.uid)
    });
    
    // Atualizar localmente
    friends.value = friends.value.filter(friend => friend.id !== friendToRemoveId.value);
    
    // Se o amigo removido era o selecionado, limpar a seleção
    if (selectedFriend.value && selectedFriend.value.id === friendToRemoveId.value) {
      selectedFriend.value = null;
      friendBooks.value = [];
      activeTab.value = 'friends';
    }
    
    confirmRemoveFriend.value = false;
    showNotification('Amigo removido com sucesso');
  } catch (error) {
    console.error('Erro ao remover amigo:', error);
    showNotification('Erro ao remover amigo', 'error');
    confirmRemoveFriend.value = false;
  }
};

// Selecionar um amigo
const selectFriend = (friend: any) => {
  if (selectedFriend.value && selectedFriend.value.id === friend.id) {
    selectedFriend.value = null;
    friendBooks.value = [];
  } else {
    selectedFriend.value = friend;
    loadFriendBooks(friend.id);
  }
};

// Ver estante do amigo
const viewFriendBookshelf = (friend: any) => {
  selectedFriend.value = friend;
  loadFriendBooks(friend.id);
  activeTab.value = 'bookshelf';
};

// Carregar livros de um amigo
const loadFriendBooks = async (friendId: string) => {
  try {
    friendBooks.value = [];
    
    const booksRef = collection(db, `users/${friendId}/books`);
    const querySnapshot = await getDocs(booksRef);
    
    querySnapshot.forEach((doc) => {
      const bookData = doc.data();
      friendBooks.value.push({
        id: doc.id,
        ...bookData
      });
    });
  } catch (error) {
    console.error('Erro ao carregar estante do amigo:', error);
    showNotification('Erro ao carregar livros', 'error');
  }
};

// Obter texto do status de leitura
const getStatusText = (status: string) => {
  switch (status) {
    case 'reading': return 'Lendo';
    case 'completed': return 'Concluído';
    default: return 'Desejo Ler';
  }
};

// Obter cor do status de leitura
const getStatusColor = (status: string) => {
  switch (status) {
    case 'reading': return 'info';
    case 'completed': return 'success';
    default: return 'grey';
  }
};

// Função para mostrar notificações
const showNotification = (text: string, color = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  showSnackbar.value = true;
};

// Carregar dados ao montar o componente
onMounted(() => {
  loadFriendsAndRequests();
});
</script>

<style scoped>
.friends-container {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #5D4037 0%, #8D6E63 50%, #A1887F 100%);
  background-size: 200% 200%;
  animation: gradientMovement 15s ease infinite;
  padding: 1rem 0;
}

.search-result-item {
  transition: all var(--transition-medium);
  border-left: 3px solid transparent;
  margin-bottom: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
}

.search-result-item:hover {
  background-color: rgba(255, 255, 255, 0.95);
  border-left: 3px solid var(--v-primary-base);
  transform: translateX(3px);
}

.friend-card {
  transition: all var(--transition-medium);
  height: 100%;
  cursor: pointer;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  overflow: hidden;
}

.friend-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.selected-friend {
  border: 2px solid var(--v-primary-base);
  background-color: rgba(93, 64, 55, 0.05);
  box-shadow: 0 0 15px rgba(93, 64, 55, 0.3);
}

.friend-book-card {
  height: 100%;
  transition: all var(--transition-medium);
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  overflow: hidden;
}

.friend-book-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.request-item {
  transition: background-color var(--transition-fast);
  border-radius: 8px;
  margin-bottom: 8px;
}

.request-item:hover {
  background-color: rgba(255, 255, 255, 0.9);
}

.v-card {
  backdrop-filter: blur(10px);
}

@keyframes gradientMovement {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>