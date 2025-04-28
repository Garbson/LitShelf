<template>
  <div class="recommendations-container fill-height d-flex justify-center">
    <v-card elevation="0" class="bg-transparent pa-4 rounded-xl" style="width: 90%">
      <h1 class="text-h3 font-weight-bold mb-8 text-center text-text recommendations-title">
        <span class="title-highlight">📚 Minhas Recomendações</span>
      </h1>
      <p class="mb-6 text-center text-text">
        Aqui você pode gerenciar todas as suas recomendações de livros recebidas e enviadas.
      </p>

      <v-tabs v-model="activeTab" class="mb-6">
        <v-tab value="received">Recomendações Recebidas</v-tab>
        <v-tab value="sent">Recomendações Enviadas</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <!-- Recomendações Recebidas -->
        <v-window-item value="received">
          <v-card flat>
            <v-card-text>
              <v-tabs v-model="receivedTab">
                <v-tab value="pending">
                  Pendentes 
                  <v-badge
                    v-if="recommendationStore.pendingRecommendationsCount > 0"
                    :content="recommendationStore.pendingRecommendationsCount"
                    color="error"
                    class="ml-2"
                  ></v-badge>
                </v-tab>
                <v-tab value="accepted">Aceitas</v-tab>
                <v-tab value="rejected">Recusadas</v-tab>
              </v-tabs>

              <v-window v-model="receivedTab">
                <!-- Pendentes -->
                <v-window-item value="pending">
                  <v-row v-if="recommendationStore.pendingRecommendations.length > 0">
                    <v-col
                      v-for="recommendation in recommendationStore.pendingRecommendations"
                      :key="recommendation.id"
                      cols="12" sm="6" md="4"
                    >
                      <v-card 
                        class="recommendation-card"
                        @click="openBookDetailsDialog(recommendation)"
                      >
                        <v-img
                          v-if="recommendation.book.coverUrl || recommendation.book.cover_image_url"
                          :src="recommendation.book.coverUrl || recommendation.book.cover_image_url"
                          height="200"
                          cover
                          class="recommendation-cover"
                        ></v-img>
                        <v-card-title>{{ recommendation.book.title }}</v-card-title>
                        <v-card-subtitle>
                          Por {{ recommendation.book.author }}
                        </v-card-subtitle>
                        <v-card-text>
                          <p class="text-body-2 mb-2">
                            <v-icon small class="mr-1">mdi-account</v-icon>
                            De: {{ recommendation.senderName }}
                          </p>
                          <p v-if="recommendation.message" class="recommendation-message">
                            "{{ recommendation.message }}"
                          </p>
                          <p class="text-caption text-grey">
                            <v-icon small class="mr-1">mdi-calendar</v-icon>
                            {{ formatDate(recommendation.createdAt) }}
                          </p>
                        </v-card-text>
                        <v-card-actions>
                          <v-btn color="success" variant="text" @click="recommendationStore.acceptRecommendation(recommendation.id)">
                            Aceitar
                          </v-btn>
                          <v-btn color="error" variant="text" @click="recommendationStore.rejectRecommendation(recommendation.id)">
                            Recusar
                          </v-btn>
                          <v-spacer></v-spacer>
                          <v-btn icon @click="viewBookDetails(recommendation.book.id)">
                            <v-icon>mdi-information-outline</v-icon>
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>
                  <div v-else class="empty-state">
                    <v-icon size="64" color="primary" class="mb-4">mdi-book-check</v-icon>
                    <p class="text-h6">Você não tem recomendações pendentes</p>
                  </div>
                </v-window-item>

                <!-- Aceitas -->
                <v-window-item value="accepted">
                  <v-row v-if="recommendationStore.acceptedRecommendations.length > 0">
                    <v-col
                      v-for="recommendation in recommendationStore.acceptedRecommendations"
                      :key="recommendation.id"
                      cols="12" sm="6" md="4"
                    >
                      <v-card 
                        class="recommendation-card"
                        @click="openBookDetailsDialog(recommendation)"
                      >
                        <v-img
                          v-if="recommendation.book.coverUrl || recommendation.book.cover_image_url"
                          :src="recommendation.book.coverUrl || recommendation.book.cover_image_url"
                          height="200"
                          cover
                          class="recommendation-cover"
                        ></v-img>
                        <v-card-title>{{ recommendation.book.title }}</v-card-title>
                        <v-card-subtitle>
                          Por {{ recommendation.book.author }}
                        </v-card-subtitle>
                        <v-card-text>
                          <p class="text-body-2 mb-2">
                            <v-icon small class="mr-1">mdi-account</v-icon>
                            De: {{ recommendation.senderName }}
                          </p>
                          <p v-if="recommendation.message" class="recommendation-message">
                            "{{ recommendation.message }}"
                          </p>
                          <p class="text-caption text-grey">
                            <v-icon small class="mr-1">mdi-calendar</v-icon>
                            Aceita em: {{ formatDate(recommendation.acceptedAt) }}
                          </p>
                        </v-card-text>
                        <v-card-actions>
                          <v-btn color="primary" variant="text" @click="viewBookDetails(recommendation.book.id)">
                            Ver livro
                          </v-btn>
                          <v-spacer></v-spacer>
                          <v-btn icon color="error" @click="recommendationStore.deleteRecommendation(recommendation.id)">
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>
                  <div v-else class="empty-state">
                    <v-icon size="64" color="primary" class="mb-4">mdi-bookshelf</v-icon>
                    <p class="text-h6">Você não aceitou nenhuma recomendação ainda</p>
                  </div>
                </v-window-item>

                <!-- Recusadas -->
                <v-window-item value="rejected">
                  <v-row v-if="recommendationStore.rejectedRecommendations.length > 0">
                    <v-col
                      v-for="recommendation in recommendationStore.rejectedRecommendations"
                      :key="recommendation.id"
                      cols="12" sm="6" md="4"
                    >
                      <v-card 
                        class="recommendation-card"
                        @click="openBookDetailsDialog(recommendation)"
                      >
                        <v-img
                          v-if="recommendation.book.coverUrl || recommendation.book.cover_image_url"
                          :src="recommendation.book.coverUrl || recommendation.book.cover_image_url"
                          height="200"
                          cover
                          class="recommendation-cover"
                        ></v-img>
                        <v-card-title>{{ recommendation.book.title }}</v-card-title>
                        <v-card-subtitle>
                          Por {{ recommendation.book.author }}
                        </v-card-subtitle>
                        <v-card-text>
                          <p class="text-body-2 mb-2">
                            <v-icon small class="mr-1">mdi-account</v-icon>
                            De: {{ recommendation.senderName }}
                          </p>
                          <p v-if="recommendation.message" class="recommendation-message">
                            "{{ recommendation.message }}"
                          </p>
                          <p class="text-caption text-grey">
                            <v-icon small class="mr-1">mdi-calendar</v-icon>
                            Recusada em: {{ formatDate(recommendation.rejectedAt) }}
                          </p>
                        </v-card-text>
                        <v-card-actions>
                          <v-btn color="primary" variant="text" @click="viewBookDetails(recommendation.book.id)">
                            Ver livro
                          </v-btn>
                          <v-spacer></v-spacer>
                          <v-btn icon color="error" @click="recommendationStore.deleteRecommendation(recommendation.id)">
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>
                  <div v-else class="empty-state">
                    <v-icon size="64" color="primary" class="mb-4">mdi-book-cancel</v-icon>
                    <p class="text-h6">Você não recusou nenhuma recomendação ainda</p>
                  </div>
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Recomendações Enviadas -->
        <v-window-item value="sent">
          <v-card flat>
            <v-card-text>
              <v-tabs v-model="sentTab">
                <v-tab value="pending">Pendentes</v-tab>
                <v-tab value="accepted">Aceitas</v-tab>
                <v-tab value="rejected">Recusadas</v-tab>
              </v-tabs>

              <v-window v-model="sentTab">
                <!-- Enviadas Pendentes -->
                <v-window-item value="pending">
                  <v-row v-if="recommendationStore.sentPendingRecommendations.length > 0">
                    <v-col
                      v-for="recommendation in recommendationStore.sentPendingRecommendations"
                      :key="recommendation.id"
                      cols="12" sm="6" md="4"
                    >
                      <v-card 
                        class="recommendation-card"
                        @click="openBookDetailsDialog(recommendation)"
                      >
                        <v-img
                          v-if="recommendation.book.coverUrl || recommendation.book.cover_image_url"
                          :src="recommendation.book.coverUrl || recommendation.book.cover_image_url"
                          height="200"
                          cover
                          class="recommendation-cover"
                        ></v-img>
                        <v-card-title>{{ recommendation.book.title }}</v-card-title>
                        <v-card-subtitle>
                          Por {{ recommendation.book.author }}
                        </v-card-subtitle>
                        <v-card-text>
                          <p class="text-body-2 mb-2">
                            <v-icon small class="mr-1">mdi-account</v-icon>
                            Para: {{ recommendation.toUserName }}
                          </p>
                          <p v-if="recommendation.message" class="recommendation-message">
                            "{{ recommendation.message }}"
                          </p>
                          <p class="text-caption text-grey">
                            <v-icon small class="mr-1">mdi-calendar</v-icon>
                            {{ formatDate(recommendation.createdAt) }}
                          </p>
                        </v-card-text>
                        <v-card-actions>
                          <v-btn color="primary" variant="text" @click="viewBookDetails(recommendation.book.id)">
                            Ver livro
                          </v-btn>
                          <v-spacer></v-spacer>
                          <v-btn icon color="error" @click="recommendationStore.deleteRecommendation(recommendation.id)">
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>
                  <div v-else class="empty-state">
                    <v-icon size="64" color="primary" class="mb-4">mdi-book-arrow-right</v-icon>
                    <p class="text-h6">Você não tem recomendações enviadas pendentes</p>
                  </div>
                </v-window-item>

                <!-- Enviadas Aceitas -->
                <v-window-item value="accepted">
                  <v-row v-if="recommendationStore.sentAcceptedRecommendations.length > 0">
                    <v-col
                      v-for="recommendation in recommendationStore.sentAcceptedRecommendations"
                      :key="recommendation.id"
                      cols="12" sm="6" md="4"
                    >
                      <v-card 
                        class="recommendation-card"
                        @click="openBookDetailsDialog(recommendation)"
                      >
                        <v-img
                          v-if="recommendation.book.coverUrl || recommendation.book.cover_image_url"
                          :src="recommendation.book.coverUrl || recommendation.book.cover_image_url"
                          height="200"
                          cover
                          class="recommendation-cover"
                        ></v-img>
                        <v-card-title>{{ recommendation.book.title }}</v-card-title>
                        <v-card-subtitle>
                          Por {{ recommendation.book.author }}
                        </v-card-subtitle>
                        <v-card-text>
                          <p class="text-body-2 mb-2">
                            <v-icon small class="mr-1">mdi-account</v-icon>
                            Para: {{ recommendation.toUserName }}
                          </p>
                          <p v-if="recommendation.message" class="recommendation-message">
                            "{{ recommendation.message }}"
                          </p>
                          <p class="text-caption text-success">
                            <v-icon small color="success" class="mr-1">mdi-check</v-icon>
                            Aceita em: {{ formatDate(recommendation.acceptedAt) }}
                          </p>
                        </v-card-text>
                        <v-card-actions>
                          <v-btn color="primary" variant="text" @click="viewBookDetails(recommendation.book.id)">
                            Ver livro
                          </v-btn>
                          <v-spacer></v-spacer>
                          <v-btn icon color="error" @click="recommendationStore.deleteRecommendation(recommendation.id)">
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>
                  <div v-else class="empty-state">
                    <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
                    <p class="text-h6">Nenhuma recomendação sua foi aceita ainda</p>
                  </div>
                </v-window-item>

                <!-- Enviadas Recusadas -->
                <v-window-item value="rejected">
                  <v-row v-if="recommendationStore.sentRejectedRecommendations.length > 0">
                    <v-col
                      v-for="recommendation in recommendationStore.sentRejectedRecommendations"
                      :key="recommendation.id"
                      cols="12" sm="6" md="4"
                    >
                      <v-card 
                        class="recommendation-card"
                        @click="openBookDetailsDialog(recommendation)"
                      >
                        <v-img
                          v-if="recommendation.book.coverUrl || recommendation.book.cover_image_url"
                          :src="recommendation.book.coverUrl || recommendation.book.cover_image_url"
                          height="200"
                          cover
                          class="recommendation-cover"
                        ></v-img>
                        <v-card-title>{{ recommendation.book.title }}</v-card-title>
                        <v-card-subtitle>
                          Por {{ recommendation.book.author }}
                        </v-card-subtitle>
                        <v-card-text>
                          <p class="text-body-2 mb-2">
                            <v-icon small class="mr-1">mdi-account</v-icon>
                            Para: {{ recommendation.toUserName }}
                          </p>
                          <p v-if="recommendation.message" class="recommendation-message">
                            "{{ recommendation.message }}"
                          </p>
                          <p class="text-caption text-error">
                            <v-icon small color="error" class="mr-1">mdi-close</v-icon>
                            Recusada em: {{ formatDate(recommendation.rejectedAt) }}
                          </p>
                        </v-card-text>
                        <v-card-actions>
                          <v-btn color="primary" variant="text" @click="viewBookDetails(recommendation.book.id)">
                            Ver livro
                          </v-btn>
                          <v-spacer></v-spacer>
                          <v-btn icon color="error" @click="recommendationStore.deleteRecommendation(recommendation.id)">
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>
                  <div v-else class="empty-state">
                    <v-icon size="64" color="error" class="mb-4">mdi-close-circle</v-icon>
                    <p class="text-h6">Nenhuma recomendação sua foi recusada</p>
                  </div>
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>

      <!-- Botão para recomendar um livro -->
      <v-btn
        color="primary"
        size="large"
        icon
        class="floating-btn"
        @click="openRecommendationDialog"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>

      <!-- Dialog para recomendar um livro -->
      <BookRecommendationDialog
        v-model="showRecommendationDialog"
        @recommendation-sent="onRecommendationSent"
      />

      <!-- Dialog de detalhes do livro recomendado -->
      <v-dialog v-model="showBookDetailsDialog" max-width="600">
        <v-card v-if="selectedRecommendation">
          <v-card-title class="text-h4 bg-primary text-white pa-4">
            {{ selectedRecommendation.book.title }}
          </v-card-title>
          
          <v-card-text class="pa-4">
            <div class="d-flex flex-column flex-md-row">
              <!-- Capa do livro -->
              <div class="book-cover-container mr-md-4 mb-4 mb-md-0">
                <v-img
                  :src="selectedRecommendation.book.coverUrl || selectedRecommendation.book.cover_image_url || '/placeholder-book.png'"
                  height="250"
                  width="170"
                  class="mx-auto"
                  cover
                ></v-img>
              </div>
              
              <!-- Detalhes do livro -->
              <div class="book-details flex-grow-1">
                <h3 class="text-h6 mb-2">{{ selectedRecommendation.book.title }}</h3>
                <p class="text-subtitle-1 mb-4">Por {{ selectedRecommendation.book.authors || selectedRecommendation.book.author }}</p>
                
                <div class="recommendation-info mb-4">
                  <p class="text-body-2">
                    <v-icon small class="mr-1" color="primary">mdi-account</v-icon>
                    Recomendado por: <strong>{{ selectedRecommendation.senderName }}</strong>
                  </p>
                  
                  <div v-if="selectedRecommendation.message" class="recommendation-message pa-3 mt-2 rounded-lg">
                    <p class="text-body-2 font-italic">
                      "{{ selectedRecommendation.message }}"
                    </p>
                  </div>
                </div>
                
                <p v-if="selectedRecommendation.book.description" class="text-body-2 mb-4 book-description">
                  {{ selectedRecommendation.book.description }}
                </p>
                <p v-else class="text-body-2 mb-4 text-grey">
                  Nenhuma descrição disponível para este livro.
                </p>
              </div>
            </div>
            
            <!-- Status da recomendação -->
            <v-chip 
              class="mt-4" 
              :color="getRecommendationStatusColor(selectedRecommendation.status)"
              text-color="white"
            >
              {{ getRecommendationStatusLabel(selectedRecommendation.status) }}
            </v-chip>
          </v-card-text>
          
          <v-divider></v-divider>
          
          <v-card-actions class="pa-4">
            <!-- Ações para recomendações pendentes -->
            <template v-if="selectedRecommendation.status === 'pending'">
              <v-btn
                color="success"
                variant="elevated"
                prepend-icon="mdi-check"
                class="mr-2"
                @click="handleAcceptRecommendation(selectedRecommendation.id)"
              >
                Aceitar e Adicionar
              </v-btn>
              <v-btn
                color="error"
                variant="outlined"
                prepend-icon="mdi-close"
                @click="handleRejectRecommendation(selectedRecommendation.id)"
              >
                Recusar
              </v-btn>
            </template>
            
            <!-- Ações para recomendações aceitas -->
            <template v-else-if="selectedRecommendation.status === 'accepted'">
              <v-btn
                color="primary"
                variant="elevated"
                prepend-icon="mdi-book-open-page-variant"
                @click="viewBookDetails(selectedRecommendation.book.id)"
              >
                Ver na Biblioteca
              </v-btn>
            </template>
            
            <v-spacer></v-spacer>
            
            <v-btn
              variant="text"
              @click="showBookDetailsDialog = false"
            >
              Fechar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Snackbar para notificações -->
      <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000">
        {{ snackbarText }}
      </v-snackbar>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import BookRecommendationDialog from '@/components/BookRecommendationDialog.vue';
import { useBookshelfStore } from '@/stores/useBookshelfStore';
import { useRecommendationStore } from '@/stores/useRecommendationStore';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const recommendationStore = useRecommendationStore();
const bookshelfStore = useBookshelfStore();
const router = useRouter();

// Variáveis de estado
const activeTab = ref('received');
const receivedTab = ref('pending');
const sentTab = ref('pending');
const showRecommendationDialog = ref(false);
const showBookDetailsDialog = ref(false);
const selectedRecommendation = ref<any>(null);
const isLoadingDetails = ref(false);

// Snackbar para notificações
const showSnackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

// Função para exibir notificações
const showNotification = (text: string, color: string = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  showSnackbar.value = true;
};

// Carregar recomendações ao montar o componente
onMounted(() => {
  recommendationStore.fetchReceivedRecommendations();
  recommendationStore.fetchSentRecommendations();
});

// Formatar data
const formatDate = (timestamp: string | number | Date) => {
  if (!timestamp) return 'Data desconhecida';
  
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

// Abrir diálogo para recomendar livro
const openRecommendationDialog = () => {
  showRecommendationDialog.value = true;
};

// Callback quando uma recomendação for enviada
const onRecommendationSent = () => {
  // Atualizar lista de recomendações enviadas
  recommendationStore.fetchSentRecommendations();
  // Mudar para a aba de recomendações enviadas
  activeTab.value = 'sent';
  sentTab.value = 'pending';
};

// Ver detalhes do livro
const viewBookDetails = async (bookId) => {
  // Redirecionar diretamente para a estante de livros
  router.push('/bookshelf');
  
  // Mostrar notificação informando que o usuário foi direcionado para a estante
  showNotification('Livro adicionado na sua estante', 'info');
};

// Abrir diálogo de detalhes do livro recomendado
const openBookDetailsDialog = async (recommendation) => {
  selectedRecommendation.value = recommendation;
  showBookDetailsDialog.value = true;
  
  // Se o livro não tem descrição, buscar detalhes completos
  if (!recommendation.book.description) {
    isLoadingDetails.value = true;
    try {
      // Tenta buscar os detalhes do livro no Supabase primeiro
      const bookDetails = await bookshelfStore.fetchBookDetails(recommendation.book.id);
      
      if (bookDetails && bookDetails.description) {
        // Atualiza a descrição do livro na recomendação selecionada
        selectedRecommendation.value = {
          ...selectedRecommendation.value,
          book: {
            ...selectedRecommendation.value.book,
            description: bookDetails.description
          }
        };
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do livro:', error);
    } finally {
      isLoadingDetails.value = false;
    }
  }
};

// Obter cor do status da recomendação
const getRecommendationStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'accepted':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'grey';
  }
};

// Obter label do status da recomendação
const getRecommendationStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'accepted':
      return 'Aceita';
    case 'rejected':
      return 'Recusada';
    default:
      return 'Desconhecido';
  }
};

// Aceitar recomendação e adicionar à estante
const handleAcceptRecommendation = (recommendationId: string) => {
  recommendationStore.acceptRecommendation(recommendationId);
  showBookDetailsDialog.value = false;
};

// Recusar recomendação
const handleRejectRecommendation = (recommendationId: string) => {
  recommendationStore.rejectRecommendation(recommendationId);
  showBookDetailsDialog.value = false;
};
</script>

<style scoped>
.recommendations-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(45deg, #a19f9f, #6d5e5e, #f2bd6f);
  background-size: 300% 300%;
  animation: colorAnimation 10s ease-in-out infinite;
  padding: 1rem;
}

.recommendations-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.title-highlight {
  background: linear-gradient(to right, #d7ba80, #443f3f, #f5f4f2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

@keyframes colorAnimation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.recommendation-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
}

.recommendation-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.recommendation-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
}

.recommendation-card:hover::after {
  opacity: 1;
}

.recommendation-cover {
  object-fit: cover;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.recommendation-message {
  font-style: italic;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 8px;
  border-radius: 6px;
  margin: 8px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: var(--color-text-secondary);
  text-align: center;
}

.floating-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 10;
}

.book-cover-container {
  width: 170px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  overflow: hidden;
}

.book-description {
  max-height: 150px;
  overflow-y: auto;
  text-align: justify;
  padding-right: 10px;
  line-height: 1.6;
}
</style>