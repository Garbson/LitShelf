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
                      <v-card class="recommendation-card">
                        <v-img
                          v-if="recommendation.book.coverUrl"
                          :src="recommendation.book.coverUrl"
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
                            De: {{ recommendation.fromUserName }}
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
                      <v-card class="recommendation-card">
                        <v-img
                          v-if="recommendation.book.coverUrl"
                          :src="recommendation.book.coverUrl"
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
                            De: {{ recommendation.fromUserName }}
                          </p>
                          <p v-if="recommendation.message" class="recommendation-message">
                            "{{ recommendation.message }}"
                          </p>
                          <p class="text-caption text-grey">
                            <v-icon small class="mr-1">mdi-calendar</v-icon>
                            Aceita em: {{ formatDate(recommendation.actionDate) }}
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
                      <v-card class="recommendation-card">
                        <v-img
                          v-if="recommendation.book.coverUrl"
                          :src="recommendation.book.coverUrl"
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
                            De: {{ recommendation.fromUserName }}
                          </p>
                          <p v-if="recommendation.message" class="recommendation-message">
                            "{{ recommendation.message }}"
                          </p>
                          <p class="text-caption text-grey">
                            <v-icon small class="mr-1">mdi-calendar</v-icon>
                            Recusada em: {{ formatDate(recommendation.actionDate) }}
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
                      <v-card class="recommendation-card">
                        <v-img
                          v-if="recommendation.book.coverUrl"
                          :src="recommendation.book.coverUrl"
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
                      <v-card class="recommendation-card">
                        <v-img
                          v-if="recommendation.book.coverUrl"
                          :src="recommendation.book.coverUrl"
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
                            Aceita em: {{ formatDate(recommendation.actionDate) }}
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
                      <v-card class="recommendation-card">
                        <v-img
                          v-if="recommendation.book.coverUrl"
                          :src="recommendation.book.coverUrl"
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
                            Recusada em: {{ formatDate(recommendation.actionDate) }}
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
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import BookRecommendationDialog from '@/components/BookRecommendationDialog.vue';
import { useRecommendationStore } from '@/stores/useRecommendationStore';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const recommendationStore = useRecommendationStore();
const router = useRouter();

const activeTab = ref('received');
const receivedTab = ref('pending');
const sentTab = ref('pending');
const showRecommendationDialog = ref(false);

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
const viewBookDetails = (bookId: string) => {
  router.push(`/book/${bookId}`);
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
}

.recommendation-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
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
</style>