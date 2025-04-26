<template>
  <div class="bookshelf-container d-flex justify-center">
    <v-card elevation="0" class="card-container pa-4 rounded-xl" style="width: 90%">
      <!-- Título padronizado como nos outros componentes -->
      <h1 class="text-h3 font-weight-bold mb-8 text-center bookshelf-title">
        <span class="page-title">📊 Meu Dashboard</span>
      </h1>
      <p class="mb-6 text-center">
        Bem-vindo ao seu painel. Aqui você pode acessar estatísticas e informações sobre
        sua leitura.
      </p>

      <v-row>
        <!-- Estatísticas Gerais - Redesenhado para ser mais conciso -->
        <v-col cols="12" md="6">
          <v-card class="mb-4 pa-4 dashboard-card" elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-chart-bar" color="primary" class="me-2"></v-icon>
              <span class="text-h6">Estatísticas de Leitura</span>
            </v-card-title>
            <v-card-text>
              <!-- Cards de estatísticas -->
              <v-row>
                <v-col cols="6" sm="4">
                  <v-card class="stat-card text-center" color="primary">
                    <div class="text-h4 font-weight-bold text-white">{{ computedTotalBooksRead }}</div>
                    <div class="text-caption text-white">Livros Lidos</div>
                  </v-card>
                </v-col>
                <v-col cols="6" sm="4">
                  <v-card class="stat-card text-center" color="info">
                    <div class="text-h4 font-weight-bold text-white">{{ computedBooksInProgress }}</div>
                    <div class="text-caption text-white">Lendo Agora</div>
                  </v-card>
                </v-col>
                <v-col cols="6" sm="4">
                  <v-card class="stat-card text-center" color="accent">
                    <div class="text-h4 font-weight-bold text-white">{{ dashboardStore.totalFavoriteQuotes }}</div>
                    <div class="text-caption text-white">Frases Favoritas</div>
                  </v-card>
                </v-col>
                <v-col cols="6" sm="4">
                  <v-card class="stat-card text-center" color="success">
                    <div class="text-h4 font-weight-bold text-white">{{ dashboardStore.averageReadingTime || 0 }}</div>
                    <div class="text-caption text-white">Dias p/ Livro</div>
                  </v-card>
                </v-col>
                <v-col cols="6" sm="4">
                  <v-card class="stat-card text-center" color="warning">
                    <div class="text-h4 font-weight-bold text-white">{{ computedWishlistCount }}</div>
                    <div class="text-caption text-white">Quero Ler</div>
                  </v-card>
                </v-col>
                <v-col cols="6" sm="4">
                  <v-card class="stat-card text-center" color="error">
                    <div class="text-h4 font-weight-bold text-white">{{ computedTotalBooks }}</div>
                    <div class="text-caption text-white">Total na Estante</div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
        
        <!-- Livro atual / último livro lido -->
        <v-col cols="12" md="6">
          <v-card class="mb-4 pa-4 dashboard-card current-book-card" elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-book-open-page-variant" color="primary" class="me-2"></v-icon>
              <span class="text-h6">{{ computedCurrentlyReading ? 'Lendo Atualmente' : 'Último Livro Lido' }}</span>
            </v-card-title>
            <v-card-text v-if="computedCurrentlyReading || computedLastBookRead">
              <div class="d-flex flex-column flex-md-row">
                <div class="book-cover-container me-md-4 mb-4 mb-md-0">
                  <v-img
                    :src="(computedCurrentlyReading?.cover_image_url || computedLastBookRead?.cover_image_url || '/placeholder-book.png')"
                    height="180"
                    width="120"
                    cover
                    class="rounded-lg book-cover"
                  />
                </div>
                <div class="flex-grow-1">
                  <h3 class="text-h6 mb-2">{{ computedCurrentlyReading?.title || computedLastBookRead?.title }}</h3>
                  <p class="text-subtitle-2">{{ computedCurrentlyReading?.author || computedLastBookRead?.author }}</p>
                  
                  <div v-if="computedCurrentlyReading" class="mt-4">
                    <div class="d-flex justify-space-between mt-1">
                      <span class="text-caption">Iniciado em</span>
                      <span class="text-caption">{{ formattedStartDate }}</span>
                    </div>
                    <div class="mt-4">
                      <v-btn variant="outlined" color="primary" size="small" :to="`/book/${computedCurrentlyReading.id}`">
                        Ver detalhes
                      </v-btn>
                    </div>
                  </div>
                  
                  <div v-else-if="computedLastBookRead" class="mt-4">
                    <v-rating
                      :model-value="Number(computedLastBookRead.rating || 0)"
                      color="amber"
                      readonly
                      half-increments
                      size="small"
                    ></v-rating>
                    <div class="d-flex justify-space-between mt-2">
                      <span class="text-caption">Avaliação</span>
                      <span class="text-caption">{{ computedLastBookRead.rating || 'Sem avaliação' }}</span>
                    </div>
                    <div class="d-flex justify-space-between mt-1">
                      <span class="text-caption">Concluído em</span>
                      <span class="text-caption">{{ computedLastBookRead.finished_reading_at || computedLastBookRead.dataFinalLeitura || 'Não definido' }}</span>
                    </div>
                    <div class="mt-4">
                      <v-btn variant="outlined" color="primary" size="small" :to="`/book/${computedLastBookRead.id}`">
                        Ver detalhes
                      </v-btn>
                    </div>
                  </div>
                </div>
              </div>
            </v-card-text>
            <v-card-text v-else class="text-center py-6">
              <v-icon icon="mdi-book-open-variant-outline" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
              <p>Você ainda não registrou nenhum livro como lido ou em leitura.</p>
              <v-btn color="primary" class="mt-4" to="/addBook">Adicionar livro</v-btn>
            </v-card-text>
          </v-card>
        </v-col>
        
        <!-- Gráfico de Gêneros -->
        <v-col cols="12" md="6">
          <v-card class="mb-4 pa-4 dashboard-card chart-card" elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-chart-pie" color="primary" class="me-2"></v-icon>
              <span class="text-h6">Distribuição por Gênero</span>
            </v-card-title>
            <v-card-text>
              <div v-if="hasGenreData" class="chart-container">
                <canvas ref="genreChartRef"></canvas>
              </div>
              <div v-else class="text-center py-6">
                <v-icon icon="mdi-book-variant" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
                <p>Você ainda não tem gêneros categorizados na sua estante.</p>
                <p class="text-caption mt-2">Adicione gêneros aos seus livros para ver a distribuição aqui.</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <!-- Recomendações Recebidas -->
        <v-col cols="12" md="6">
          <v-card class="mb-4 pa-4 dashboard-card recommendation-card" elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-lightbulb" color="primary" class="me-2"></v-icon>
              <span class="text-h6">Recomendações Recentes</span>
            </v-card-title>
            <v-card-text v-if="recommendationStore.receivedRecommendations?.length > 0">
              <v-list class="pa-0 recommendation-list">
                <v-list-item
                  v-for="(recommendation, index) in recommendationStore.receivedRecommendations.slice(0, 3)"
                  :key="index"
                  rounded
                  class="mb-2 recommendation-item"
                >
                  <template v-slot:prepend>
                    <v-avatar color="accent" size="36">
                      <v-icon icon="mdi-book" color="white" size="small"></v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-subtitle-2">{{ recommendation.book?.title || 'Livro Recomendado' }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    Recomendado por {{ recommendation.senderName || 'Amigo' }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              <div class="d-flex justify-center mt-4">
                <v-btn variant="text" color="primary" size="small" @click="showAllRecommendations">
                  Ver todas
                </v-btn>
              </div>
            </v-card-text>
            <v-card-text v-else class="text-center py-6">
              <v-icon icon="mdi-lightbulb-outline" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
              <p>Você ainda não recebeu recomendações de livros.</p>
              <v-btn color="primary" class="mt-4" to="/friends">
                Conectar com amigos
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
        
        <!-- Metas de Leitura -->
        <v-col cols="12">
          <v-card class="mb-4 pa-4 dashboard-card" elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-flag" color="primary" class="me-2"></v-icon>
              <span class="text-h6">Meta Anual de Leitura</span>
            </v-card-title>
            <v-card-text>
              <div class="d-flex flex-column flex-md-row align-center">
                <div class="goal-progress text-center me-md-8 mb-6 mb-md-0">
                  <v-progress-circular
                    :model-value="readingGoalProgress"
                    :size="150"
                    :width="15"
                    color="primary"
                    class="mb-4"
                  >
                    <div class="text-h4">{{ computedTotalBooksRead }}</div>
                    <div class="text-caption">de {{ dashboardStore.readingGoal.target }}</div>
                  </v-progress-circular>
                  <p class="text-caption mt-2">
                    {{ readingGoalMessage }}
                  </p>
                </div>
                
                <div class="flex-grow-1">
                  <div class="goal-settings">
                    <h3 class="text-h6 mb-4">Definir Meta para {{ currentYear }}</h3>
                    <div class="d-flex align-center mb-4">
                      <v-slider
                        v-model="goalTarget"
                        min="1"
                        max="100"
                        thumb-label
                        step="1"
                        class="flex-grow-1 me-4"
                        hide-details
                      ></v-slider>
                      <v-text-field
                        v-model.number="goalTarget"
                        type="number"
                        min="1"
                        max="100"
                        hide-details
                        density="compact"
                        style="max-width: 100px;"
                      ></v-text-field>
                    </div>
                    <v-btn color="primary" class="mt-2" block @click="saveReadingGoal">Salvar Meta</v-btn>
                  </div>
                  
                  <v-divider class="my-6"></v-divider>
                  
                  <div class="reading-pace">
                    <h3 class="text-h6 mb-2">Sua Velocidade de Leitura</h3>
                    <p>
                      No seu ritmo atual, você lerá aproximadamente 
                      <strong>{{ projectedBooks }}</strong> livros até o final do ano.
                    </p>
                    <p class="mt-2 text-caption">
                      {{ getRitmoLeituraMessage() }}
                    </p>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
    
    <!-- Snackbar para notificações -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" @click="showSnackbar = false"></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { useRecommendationStore } from "@/stores/useRecommendationStore";
import { Chart, registerables } from 'chart.js';
import { computed, onMounted, ref, watch, onActivated } from "vue";
import { useRouter } from "vue-router";

// Registrar componentes do Chart.js
Chart.register(...registerables);

const dashboardStore = useDashboardStore();
const bookshelfStore = useBookshelfStore();
const recommendationStore = useRecommendationStore();
const router = useRouter();

// Referências para canvas do gráfico
const genreChartRef = ref<HTMLCanvasElement | null>(null);
let genreChart: Chart | null = null;

// Snackbar
const showSnackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

// Meta de leitura
const currentYear = new Date().getFullYear();
const goalTarget = ref(20); // Valor inicial, será atualizado do Supabase

// Garante que os dados são calculados diretamente dos livros carregados na store
// em vez de confiar apenas nos valores computados do dashboard store
const computedTotalBooks = computed(() => bookshelfStore.books.length);
const computedTotalBooksRead = computed(() => bookshelfStore.books.filter(book => Number(book.status) === 1).length);
const computedBooksInProgress = computed(() => bookshelfStore.books.filter(book => Number(book.status) === 2).length);
const computedWishlistCount = computed(() => bookshelfStore.books.filter(book => Number(book.status) === 0).length);
const computedCurrentlyReading = computed(() => bookshelfStore.books.find(book => Number(book.status) === 2));

// Função para verificar qual campo de data está disponível no livro
const findStartDate = (book) => {
  if (!book) return null;
  
  // Verifica todos os possíveis campos de data de início em ordem de prioridade
  const possibleFields = [
    'started_reading_at',
    'started_at', 
    'start_date',
    'start_reading_date',
    'dataInicioLeitura'
  ];
  
  for (const field of possibleFields) {
    if (book[field]) {
      console.log(`Campo de data encontrado: ${field} = ${book[field]}`);
      return book[field];
    }
  }
  
  // Também verifica se existe uma data em formato de timestamp
  if (book.reading_dates && book.reading_dates.start) {
    return book.reading_dates.start;
  }
  
  return null;
};

// Formata a data de início da leitura para exibição
const formattedStartDate = computed(() => {
  if (!computedCurrentlyReading.value) return 'Não definido';
  
  console.log("Dados do livro atual:", computedCurrentlyReading.value);
  
  // Busca a data usando a função auxiliar
  const rawDate = findStartDate(computedCurrentlyReading.value);
  
  console.log("Data encontrada:", rawDate);
  
  if (!rawDate) return 'Não definido';
  
  // Se a data já estiver no formato brasileiro DD/MM/YYYY, retorna como está
  if (typeof rawDate === 'string' && rawDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    return rawDate;
  }
  
  try {
    // Tenta converter para o formato brasileiro
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return 'Não definido';
    
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Não definido';
  }
});

const computedLastBookRead = computed(() => {
  const readBooks = bookshelfStore.books.filter(book => Number(book.status) === 1);
  if (!readBooks.length) return null;
  
  return readBooks.sort((a, b) => {
    // Tenta comparar pela data de finalização
    const getCompletionDate = (book) => {
      if (book.finished_reading_at) {
        return new Date(book.finished_reading_at).getTime();
      }
      if (book.dataFinalLeitura) {
        // Converte de DD/MM/YYYY para um objeto Date
        const [day, month, year] = book.dataFinalLeitura.split('/').map(Number);
        return new Date(year, month - 1, day).getTime();
      }
      return 0;
    };
    
    return getCompletionDate(b) - getCompletionDate(a);
  })[0];
});

// Verifica se temos dados de gênero para mostrar
const hasGenreData = computed(() => {
  const genres = dashboardStore.genresDistribution;
  return Object.keys(genres).length > 0;
});

// Calcular progresso da meta de leitura
const readingGoalProgress = computed(() => {
  if (!dashboardStore.readingGoal.target) return 0;
  return Math.min((computedTotalBooksRead.value / dashboardStore.readingGoal.target) * 100, 100);
});

// Mensagem de progresso da meta
const readingGoalMessage = computed(() => {
  if (readingGoalProgress.value === 100) {
    return "Parabéns! Você atingiu sua meta de leitura anual.";
  } else if (readingGoalProgress.value > 50) {
    return "Você está indo muito bem! Continue assim.";
  } else {
    return "Continue lendo para atingir sua meta anual.";
  }
});

// Calcula projeção de livros até o final do ano
const projectedBooks = computed(() => {
  // Calcula os dias decorridos do ano atual
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysElapsed = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  
  // Calcula o total de dias no ano atual (considerando anos bissextos)
  const isLeapYear = (year) => {
    return year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0);
  };
  const daysInYear = isLeapYear(now.getFullYear()) ? 366 : 365;
  
  // Calcula o ritmo de leitura (livros por dia)
  const pace = computedTotalBooksRead.value / daysElapsed || 0;
  
  // Projeta o total de livros até o final do ano
  return Math.round(pace * daysInYear);
});

// Função para atualizar todos os dados do dashboard
const refreshDashboardData = async () => {
  console.log('Atualizando dados do dashboard...');
  
  try {
    // Busca os livros primeiro para garantir que temos os dados mais recentes
    if (bookshelfStore.books.length === 0) {
      await bookshelfStore.fetchBooks();
    }
    
    // Atualiza os dados do dashboard
    await dashboardStore.fetchDashboardData();
    
    // Busca as recomendações
    await recommendationStore.fetchReceivedRecommendations();

    // Atualiza o valor da meta com o valor carregado
    goalTarget.value = dashboardStore.readingGoal.target || 20;

    // Retorna para verificar se tudo foi carregado corretamente
    console.log('Dados carregados:', {
      totalBooks: computedTotalBooks.value,
      booksRead: computedTotalBooksRead.value,
      inProgress: computedBooksInProgress.value,
      currentlyReading: computedCurrentlyReading.value?.title,
      lastBookRead: computedLastBookRead.value?.title
    });
      
    // Cria o gráfico de gêneros quando os dados estão disponíveis
    setTimeout(() => {
      createGenreChart();
    }, 200);
    
  } catch (error) {
    console.error("Erro ao atualizar dados do dashboard:", error);
    showNotification("Erro ao carregar os dados do dashboard", "error");
  }
};

// Fornece uma mensagem com base no ritmo de leitura
const getRitmoLeituraMessage = () => {
  const target = dashboardStore.readingGoal.target;
  if (projectedBooks.value >= target) {
    return "Você está no ritmo certo para atingir sua meta!";
  } else if (projectedBooks.value >= target * 0.7) {
    return "Você está quase lá! Um pequeno aumento no ritmo vai ajudar.";
  } else {
    return "Considere aumentar seu ritmo de leitura para atingir a meta.";
  }
};

// Carrega os dados quando o componente é montado
onMounted(() => {
  refreshDashboardData();
});

// Recarrega os dados quando o componente é reativado (ex: ao voltar para esta página)
onActivated(() => {
  console.log('Dashboard reativado, atualizando dados...');
  refreshDashboardData();
});

// Recria o gráfico quando os dados mudam
watch([() => bookshelfStore.books, computedTotalBooks], () => {
  setTimeout(() => {
    createGenreChart();
  }, 200);
}, { deep: true });

// Cria o gráfico de distribuição de gêneros
const createGenreChart = () => {
  if (!genreChartRef.value || !hasGenreData.value) return;
  
  try {
    // Destrói o gráfico anterior se existir
    if (genreChart) {
      genreChart.destroy();
    }
    
    // Obtém os dados de gêneros
    const genresData = dashboardStore.genresDistribution;
    const labels = Object.keys(genresData);
    const data = Object.values(genresData);
    
    // Cores para o gráfico
    const backgroundColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)',
      'rgba(78, 205, 196, 0.7)',
      'rgba(255, 99, 132, 0.7)'
    ];
    
    const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));
    
    // Cria o gráfico
    genreChart = new Chart(genreChartRef.value, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderColor: borderColors.slice(0, labels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 12
              },
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.chart.data.datasets[0].data.reduce((a, b) => Number(a) + Number(b), 0);
                const percentage = Math.round((Number(value) / Number(total)) * 100);
                return `${label}: ${value} livro(s) (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao criar gráfico de gêneros:', error);
    showNotification('Erro ao criar gráfico de gêneros', 'error');
  }
};

// Navega para a página de recomendações
const showAllRecommendations = () => {
  router.push('/recommendations');
};

// Salvar nova meta de leitura
const saveReadingGoal = async () => {
  if (!goalTarget.value || goalTarget.value < 1) {
    showNotification('Por favor, defina uma meta válida (mínimo 1 livro)', 'warning');
    return;
  }
  
  try {
    const success = await dashboardStore.saveReadingGoal({
      year: currentYear,
      target: goalTarget.value
    });
    
    if (success) {
      showNotification(`Meta de ${goalTarget.value} livros definida para ${currentYear}!`, 'success');
    } else {
      showNotification('Erro ao salvar meta de leitura', 'error');
    }
  } catch (error) {
    console.error('Erro ao salvar meta:', error);
    showNotification('Erro ao salvar meta de leitura', 'error');
  }
};

// Exibe notificação
const showNotification = (text: string, color: string = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  showSnackbar.value = true;
};
</script>

<style scoped>
.bookshelf-container {
  width: 100%;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  padding: 1rem;
}

.card-container {
  background: transparent;
}

.dashboard-card {
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%; /* Garante altura uniforme */
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

/* Garantia de altura mínima uniforme para os cards de destaque */
.current-book-card, .chart-card, .recommendation-card {
  min-height: 400px;
}

.bookshelf-title {
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.5px;
}

.chart-container {
  width: 100%;
  height: 300px;
  position: relative;
}

.stat-card {
  border-radius: 8px;
  padding: 1rem;
  height: 100%; /* Garante que todos os cards tenham a mesma altura */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.book-cover-container {
  flex-shrink: 0;
}

.book-cover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.recommendation-item:hover {
  background: rgba(var(--v-theme-primary), 0.05);
}

.recommendation-list {
  min-height: 200px; /* Altura mínima para a lista de recomendações */
}

.goal-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.8rem;
  }
  
  /* Ajusta a altura mínima em telas menores */
  .current-book-card, .chart-card, .recommendation-card {
    min-height: 300px;
  }
}
</style>
