<template>
  <div class="bookshelf-container fill-height d-flex justify-center">
    <v-card elevation="0" class="bg-transparent pa-4 rounded-xl" style="width: 90%">
      <h1 class="text-h3 font-weight-bold mb-8 text-center text-text bookshelf-title">
        <span class="title-highlight">📊 Meu Dashboard</span>
      </h1>
      <p class="mb-6 text-center text-text">
        Bem-vindo ao seu painel. Aqui você pode acessar estatísticas e informações sobre
        sua leitura.
      </p>

      <v-row>
        <!-- Estatísticas Gerais -->
        <v-col cols="12" md="6">
          <v-card class="mb-4 pa-4 book-card equal-height-card">
            <v-card-title class="text-h6 text-primary card-title">
              Estatísticas Gerais
            </v-card-title>
            <v-card-text>
              <v-list class="pa-0">
                <v-list-item class="pa-0">
                  <v-list-item-title class="text-primary card-item-title">
                    Total de livros lidos:
                  </v-list-item-title>
                  <v-list-item-subtitle class="font-weight-bold text-accent">
                    {{ dashboardStore.totalBooksRead }}
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item class="pa-0">
                  <v-list-item-title class="text-primary card-item-title">
                    Total de frases favoritas:
                  </v-list-item-title>
                  <v-list-item-subtitle class="font-weight-bold text-accent">
                    {{ dashboardStore.totalFavoriteQuotes }}
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item class="pa-0">
                  <v-list-item-title class="text-primary card-item-title">
                    Tempo médio de leitura por livro:
                  </v-list-item-title>
                  <v-list-item-subtitle class="font-weight-bold text-accent">
                    {{ dashboardStore.averageReadingTime }} dias
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item class="pa-0" v-if="lastBookRead">
                  <v-list-item-title class="text-primary card-item-title">
                    Último livro lido:
                  </v-list-item-title>
                  <v-list-item-subtitle class="font-weight-bold text-accent">
                    {{ lastBookRead.title }}
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item class="pa-0" v-if="lastQuoteAdded">
                  <v-list-item-title class="text-primary card-item-title">
                    Última frase adicionada:
                  </v-list-item-title>
                  <v-list-item-subtitle class="font-weight-bold text-accent">
                    {{ lastQuoteAdded }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Gêneros Mais Lidos -->
        <v-col cols="12" md="6">
          <v-card class="mb-4 pa-4 book-card equal-height-card">
            <v-card-title class="text-h6 text-primary card-title">
              Gêneros Mais Lidos
            </v-card-title>
            <v-card-text>
              <v-list
                v-if="Object.keys(dashboardStore.genresRead).length > 0"
                class="pa-0"
              >
                <v-list-item
                  v-for="(count, genre) in dashboardStore.genresRead"
                  :key="genre"
                  class="pa-0"
                >
                  <v-list-item-title class="text-primary card-item-title">
                    {{ genre }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="font-weight-bold text-accent">
                    {{ count }} livro(s)
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              <p v-else class="text-primary">Nenhum gênero registrado ainda.</p>
              <!-- Chart -->
              <div class="chart-container">
                <canvas id="genreChart"></canvas>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <!-- Ranking de Leitura -->
        <v-col cols="12" md="6">
          <v-card class="mb-4 pa-4 book-card equal-height-card">
            <v-card-title class="text-h6 text-primary card-title">
              Ranking de Leitura
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col v-for="(user, index) in readingRanking" :key="index" cols="12">
                  <v-card class="ranking-user-card bg-primary">
                    <v-avatar class="profile-avatar">
                      <v-icon size="40">mdi-account-circle</v-icon>
                    </v-avatar>
                    <div class="user-info">
                      <v-card-title class="text-background">
                        {{ index + 1 }}* {{ user.name }}
                      </v-card-title>
                      <v-card-subtitle class="text-accent">
                        {{ user.booksRead }} livros
                      </v-card-subtitle>
                    </div>
                    <v-card-actions class="pa-0">
                      <v-btn icon class="ml-auto" @click="goToProfile">
                        <v-icon>mdi-account-arrow-right</v-icon>
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Visitantes da Estante -->
        <v-col cols="12" md="6">
          <v-card class="mb-4 pa-4 book-card equal-height-card">
            <v-card-title class="text-h6 text-primary card-title">
              Visitantes da Estante
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col
                  v-for="(visitor, index) in bookshelfVisitors"
                  :key="index"
                  cols="12"
                >
                  <v-card class="ranking-user-card bg-primary">
                    <v-avatar class="profile-avatar">
                      <v-icon size="40">mdi-account-circle</v-icon>
                    </v-avatar>
                    <v-card-title class="text-background">{{ visitor }}</v-card-title>
                    <v-card-actions class="pa-0">
                      <v-btn icon class="ml-auto" @click="goToProfile">
                        <v-icon>mdi-account-arrow-right</v-icon>
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Recomendações de Livros -->
        <v-col cols="12" md="6">
          <v-card class="mb-4 pa-4 book-card equal-height-card">
            <v-card-title class="text-h6 text-primary card-title d-flex align-center">
              Recomendações Recebidas
              <v-badge
                v-if="recommendationStore.pendingRecommendationsCount > 0"
                :content="recommendationStore.pendingRecommendationsCount"
                color="error"
                class="ml-2"
              ></v-badge>
            </v-card-title>
            <v-card-text>
              <div v-if="recommendationStore.pendingRecommendations.length > 0">
                <v-row>
                  <v-col
                    v-for="recommendation in recommendationStore.pendingRecommendations.slice(0, 3)"
                    :key="recommendation.id"
                    cols="12"
                  >
                    <v-card class="recommendation-card bg-primary">
                      <div class="d-flex flex-column">
                        <v-card-title class="text-background pa-2">
                          {{ recommendation.book.title }}
                        </v-card-title>
                        <v-card-subtitle class="text-accent pa-2">
                          De: {{ recommendation.fromUserName }}
                        </v-card-subtitle>
                        <v-card-text class="text-background pa-2" v-if="recommendation.message">
                          "{{ recommendation.message }}"
                        </v-card-text>
                      </div>
                      <v-card-actions>
                        <v-btn variant="outlined" color="success" @click="recommendationStore.acceptRecommendation(recommendation.id)">
                          Aceitar
                        </v-btn>
                        <v-btn variant="outlined" color="error" @click="recommendationStore.rejectRecommendation(recommendation.id)">
                          Recusar
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>
                <div class="d-flex justify-center mt-2" v-if="recommendationStore.pendingRecommendations.length > 3">
                  <v-btn color="primary" variant="text" @click="showAllRecommendations">
                    Ver todas ({{ recommendationStore.pendingRecommendations.length }})
                  </v-btn>
                </div>
              </div>
              <div v-else class="d-flex flex-column align-center justify-center">
                <v-icon size="56" color="primary" class="mb-2">mdi-book-check</v-icon>
                <p class="text-center text-primary">Você não tem recomendações pendentes.</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { useRecommendationStore } from "@/stores/useRecommendationStore";
import Chart from "chart.js/auto";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const dashboardStore = useDashboardStore();
const bookshelfStore = useBookshelfStore();
const recommendationStore = useRecommendationStore();
const router = useRouter();
const lastBookRead = computed(() => {
  const completedBooks = bookshelfStore.books.filter((book) => book.endDate);
  if (completedBooks.length > 0) {
    return completedBooks.reduce((a, b) => (a.endDate > b.endDate ? a : b));
  }
  return null;
});
const lastQuoteAdded = computed(() => {
  const allQuotes = bookshelfStore.books.flatMap((book) => book.quotes);
  if (allQuotes.length > 0) {
    return allQuotes[allQuotes.length - 1];
  }
  return null;
});

// Dados fictícios para o ranking de leitura
const readingRanking = ref([
  { name: "Você", booksRead: 15 },
  { name: "Amigo 1", booksRead: 12 },
  { name: "Amigo 2", booksRead: 10 },
  { name: "Amigo 3", booksRead: 8 },
  { name: "Amigo 4", booksRead: 5 },
]);

// Dados fictícios para os visitantes da estante
const bookshelfVisitors = ref(["Visitante 1", "Visitante 2", "Visitante 3"]);

onMounted(() => {
  dashboardStore.fetchDashboardData();
  recommendationStore.fetchReceivedRecommendations();
  createGenreChart();
});

const createGenreChart = () => {
  const ctx = document.getElementById("genreChart") as HTMLCanvasElement;
  if (!ctx) return;

  // Fictional data for the chart
  const genreData = {
    labels: ["Ficção", "Romance", "Mistério", "Biografia", "Fantasia"],
    datasets: [
      {
        label: "Número de Livros",
        data: [5, 3, 7, 2, 4], // Fictional data
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  new Chart(ctx, {
    type: "bar",
    data: genreData,
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
};

const goToProfile = () => {
  router.push("/profile");
};

const showAllRecommendations = () => {
  router.push("/recommendations");
};
</script>

<style scoped>
.bookshelf-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(45deg, #a19f9f, #6d5e5e, #f2bd6f);
  background-size: 300% 300%;
  animation: colorAnimation 10s ease-in-out infinite;
  padding: 1rem;
}

.book-card {
  cursor: pointer;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  /* Adicionando uma borda sutil */
  padding: 0.5rem;
  /* Adicionando um padding */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  /* Adicionando uma sombra mais suave */
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.book-card:hover {
  transform: scale(1.03) rotate(0.5deg);
  /* Ajustando o efeito de hover */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  /* Ajustando a sombra no hover */
}

.bookshelf-title {
  display: flex;
  align-items: center;
  justify-content: center;
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

.chart-container {
  width: 100%;
  height: 300px;
}

.equal-height-card {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.card-title {
  font-weight: bold;
  margin-bottom: 1rem;
}

.card-item-title {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.ranking-user-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  justify-content: space-between;
}

.profile-avatar {
  background-color: #eee;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.recommendation-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}
</style>
