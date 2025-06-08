<template>
  <div class="bookshelf-container d-flex justify-center">
    <v-card elevation="0" class="card-container pa-4 rounded-xl" style="width: 90%">
      <!-- Título padronizado como nos outros componentes -->
      <h1 class="text-h3 font-weight-bold mb-8 text-center bookshelf-title">
        <span class="page-title">📊 Meu Dashboard</span>
      </h1>
      <p class="mb-6 text-center">
        Bem-vindo ao seu painel. Aqui você pode acessar estatísticas e informações sobre sua
        leitura.
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
                    <div class="text-h4 font-weight-bold text-white">
                      {{ computedTotalBooksRead }}
                    </div>
                    <div class="text-caption text-white">Livros Lidos</div>
                  </v-card>
                </v-col>
                <v-col cols="6" sm="4">
                  <v-card class="stat-card text-center" color="info">
                    <div class="text-h4 font-weight-bold text-white">
                      {{ computedBooksInProgress }}
                    </div>
                    <div class="text-caption text-white">Lendo Agora</div>
                  </v-card>
                </v-col>
                <v-col cols="6" sm="4">
                  <v-card class="stat-card text-center" color="accent">
                    <div class="text-h4 font-weight-bold text-white">
                      {{ dashboardStore.totalFavoriteQuotes }}
                    </div>
                    <div class="text-caption text-white">Frases Favoritas</div>
                  </v-card>
                </v-col>
                <v-col cols="6" sm="4">
                  <v-card class="stat-card text-center" color="success">
                    <div class="text-h4 font-weight-bold text-white">
                      {{ dashboardStore.averageReadingTime || 0 }}
                    </div>
                    <div class="text-caption text-white">Dias p/ Livro</div>
                  </v-card>
                </v-col>
                <v-col cols="6" sm="4">
                  <v-card class="stat-card text-center" color="warning">
                    <div class="text-h4 font-weight-bold text-white">
                      {{ computedWishlistCount }}
                    </div>
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
              <span class="text-h6">Lendo no Momento</span>
            </v-card-title>
            <v-card-text v-if="currentlyReadingBook">
              <div class="d-flex flex-column flex-md-row">
                <div class="book-cover-container me-md-4 mb-4 mb-md-0">
                  <v-img
                    :src="currentlyReadingBook?.cover_image_url || '/placeholder-book.png'"
                    height="180"
                    width="120"
                    cover
                    class="rounded-lg book-cover"
                  />
                </div>
                <div class="flex-grow-1">
                  <h3 class="text-h6 mb-2">{{ currentlyReadingBook?.title }}</h3>
                  <p class="text-subtitle-2">{{ currentlyReadingBook?.author }}</p>

                  <div class="mt-4">
                    <div class="d-flex justify-space-between mt-1">
                      <span class="text-caption">Iniciado em</span>
                      <span class="text-caption">{{ formattedStartDate }}</span>
                    </div>
                    <div class="mt-4">
                      <v-btn
                        variant="outlined"
                        color="primary"
                        size="small"
                        :to="`/book/${currentlyReadingBook.id}`"
                      >
                        Ver detalhes
                      </v-btn>
                    </div>
                  </div>
                </div>
              </div>
            </v-card-text>
            <v-card-text v-else-if="lastReadBook" class="text-center py-6">
              <div class="d-flex flex-column flex-md-row">
                <div class="book-cover-container me-md-4 mb-4 mb-md-0">
                  <v-img
                    :src="lastReadBook?.cover_image_url || '/placeholder-book.png'"
                    height="180"
                    width="120"
                    cover
                    class="rounded-lg book-cover"
                  />
                </div>
                <div class="flex-grow-1">
                  <h3 class="text-h6 mb-2">{{ lastReadBook?.title }}</h3>
                  <p class="text-subtitle-2">{{ lastReadBook?.author }}</p>

                  <v-rating
                    :model-value="Number(lastReadBook.rating || 0)"
                    color="amber"
                    readonly
                    half-increments
                    size="small"
                  ></v-rating>
                  <div class="d-flex justify-space-between mt-2">
                    <span class="text-caption">Avaliação</span>
                    <span class="text-caption">{{ lastReadBook.rating || 'Sem avaliação' }}</span>
                  </div>
                  <div class="d-flex justify-space-between mt-1">
                    <span class="text-caption">Concluído em</span>
                    <span class="text-caption">{{
                      lastReadBook.finished_reading_at || 'Não definido'
                    }}</span>
                  </div>
                  <div class="mt-4">
                    <v-btn
                      variant="outlined"
                      color="primary"
                      size="small"
                      :to="`/book/${lastReadBook.id}`"
                    >
                      Ver detalhes
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-card-text>
            <v-card-text v-else class="text-center py-6">
              <v-icon
                icon="mdi-book-open-variant-outline"
                size="64"
                color="grey-lighten-1"
                class="mb-4"
              ></v-icon>
              <p>Você ainda não está lendo nenhum livro no momento.</p>
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
                <v-icon
                  icon="mdi-book-variant"
                  size="64"
                  color="grey-lighten-1"
                  class="mb-4"
                ></v-icon>
                <p>Você ainda não tem gêneros categorizados na sua estante.</p>
                <p class="text-caption mt-2">
                  Adicione gêneros aos seus livros para ver a distribuição aqui.
                </p>
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
              <!-- Lista de recomendações com capas e estilo melhorado -->
              <v-row>
                <v-col
                  v-for="(
                    recommendation, index
                  ) in recommendationStore.receivedRecommendations.slice(0, 3)"
                  :key="index"
                  cols="12"
                  md="12"
                  class="mb-2"
                >
                  <v-card
                    class="recommendation-preview pa-2"
                    @click="openRecommendationDetails(recommendation)"
                    flat
                    hover
                    rounded
                  >
                    <div class="d-flex align-center">
                      <!-- Capa do livro -->
                      <v-img
                        :src="
                          recommendation.book?.coverUrl ||
                          recommendation.book?.cover_image_url ||
                          '/placeholder-book.png'
                        "
                        height="80"
                        contain
                        class="rounded me-3 book-thumbnail"
                      ></v-img>

                      <!-- Detalhes do livro -->
                      <div class="flex-grow-1">
                        <div class="text-subtitle-1 font-weight-medium">
                          {{ recommendation.book?.title || 'Livro Recomendado' }}
                        </div>
                        <div class="text-body-2">
                          {{ recommendation.book?.authors || recommendation.book?.author }}
                        </div>
                        <div class="d-flex align-center mt-1">
                          <v-icon
                            size="small"
                            icon="mdi-account"
                            color="primary"
                            class="me-1"
                          ></v-icon>
                          <span class="text-caption"
                            >Recomendado por {{ recommendation.senderName || 'Amigo' }}</span
                          >
                        </div>
                      </div>

                      <!-- Indicador de status -->
                      <v-chip
                        size="small"
                        :color="getRecommendationChipColor(recommendation.status)"
                        text-color="white"
                        class="ms-2"
                      >
                        {{ getRecommendationStatusLabel(recommendation.status) }}
                      </v-chip>
                    </div>
                  </v-card>
                </v-col>
              </v-row>

              <div class="d-flex justify-center mt-4">
                <v-btn variant="text" color="primary" size="small" @click="showAllRecommendations">
                  Ver todas
                </v-btn>
              </div>
            </v-card-text>
            <v-card-text v-else class="text-center py-6">
              <v-icon
                icon="mdi-lightbulb-outline"
                size="64"
                color="grey-lighten-1"
                class="mb-4"
              ></v-icon>
              <p>Você ainda não recebeu recomendações de livros.</p>
              <v-btn color="primary" class="mt-4" to="/friends"> Conectar com amigos </v-btn>
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
                        style="max-width: 100px"
                      ></v-text-field>
                    </div>
                    <v-btn color="primary" class="mt-2" block @click="saveReadingGoal"
                      >Salvar Meta</v-btn
                    >
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

    <!-- Diálogo de detalhes da recomendação -->
    <v-dialog v-model="showRecommendationDialog" max-width="600">
      <v-card v-if="selectedRecommendation" elevation="8" class="recommendation-dialog">
        <v-card-item class="pa-0">
          <!-- Cabeçalho com gradiente -->
          <div class="recommendation-header pa-4">
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              @click="showRecommendationDialog = false"
              color="white"
              class="close-btn"
            ></v-btn>

            <span class="text-overline text-white">Recomendação</span>
            <h2 class="text-h5 text-white text-truncate mb-1">
              {{ selectedRecommendation.book.title }}
            </h2>
            <div class="d-flex align-center">
              <v-avatar size="24" class="mr-2">
                <v-img
                  :src="selectedRecommendation.senderPhotoURL || 'https://i.pravatar.cc/50'"
                ></v-img>
              </v-avatar>
              <span class="text-white text-caption">
                De {{ selectedRecommendation.senderName }}
              </span>
            </div>
          </div>
        </v-card-item>

        <v-card-text class="pa-4 pt-6">
          <div class="d-flex flex-column flex-md-row">
            <!-- Capa do livro com efeito de elevação e sombra -->
            <div class="book-cover-container me-md-4 mb-4 mb-md-0">
              <div class="book-cover-wrapper">
                <v-img
                  :src="
                    selectedRecommendation.book.coverUrl ||
                    selectedRecommendation.book.cover_image_url ||
                    '/placeholder-book.png'
                  "
                  height="240"
                  width="160"
                  class="book-cover-image"
                  contain
                  style="background-color: #f5f5f5; border-radius: 8px"
                ></v-img>
              </div>

              <!-- Status badge -->
              <v-chip
                :color="getRecommendationChipColor(selectedRecommendation.status)"
                text-color="white"
                size="small"
                class="status-chip"
              >
                {{ getRecommendationStatusLabel(selectedRecommendation.status) }}
              </v-chip>
            </div>

            <!-- Detalhes do livro -->
            <div class="flex-grow-1 book-details">
              <p class="text-subtitle-1 mb-1">
                {{ selectedRecommendation.book.authors || selectedRecommendation.book.author }}
              </p>

              <!-- Mensagem de recomendação destacada -->
              <div
                v-if="selectedRecommendation.message"
                class="recommendation-message pa-3 my-4 rounded-lg"
              >
                <p>
                  Mensagem de
                  <span class="font-weight-bold">{{ selectedRecommendation.senderName }}:</span>
                </p>
                <p class="text-body-1 recommendation-text">
                  {{ selectedRecommendation.message }}
                </p>
              </div>

              <!-- Descrição do livro -->
              <h3 class="text-subtitle-1 font-weight-medium mt-4">Sobre o livro</h3>
              <p
                v-if="selectedRecommendation.book.description"
                class="text-body-2 mb-4 book-description"
              >
                {{
                  expandDescription
                    ? selectedRecommendation.book.description
                    : truncateDescription(selectedRecommendation.book.description, 300)
                }}
                <span
                  v-if="selectedRecommendation.book.description.length > 300"
                  class="text-primary cursor-pointer"
                  @click="expandDescription = !expandDescription"
                >
                  {{ expandDescription ? 'Mostrar menos' : 'Mostrar mais' }}
                </span>
              </p>

              <!-- Data da recomendação -->
              <div class="d-flex align-center mt-4">
                <v-icon icon="mdi-calendar-outline" size="small" color="grey" class="me-2"></v-icon>
                <span class="text-caption text-grey">
                  Recomendado em {{ formatDate(selectedRecommendation.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-divider class="my-2"></v-divider>

        <v-card-actions class="pa-4">
          <!-- Ações para recomendações pendentes -->
          <template v-if="selectedRecommendation.status === 'pending'">
            <v-btn
              color="success"
              variant="elevated"
              prepend-icon="mdi-check"
              class="me-2"
              @click="handleAcceptRecommendation(selectedRecommendation)"
              :loading="isProcessingRecommendation"
            >
              Aceitar e Adicionar
            </v-btn>
            <v-btn
              color="error"
              variant="outlined"
              prepend-icon="mdi-close"
              @click="handleRejectRecommendation(selectedRecommendation)"
              :loading="isProcessingRecommendation"
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
              @click="
                viewBookDetails(selectedRecommendation.bookId || selectedRecommendation.book.id)
              "
            >
              Ver na Biblioteca
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useBookshelfStore } from '@/stores/useBookshelfStore'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { useRecommendationStore } from '@/stores/useRecommendationStore'
import { Chart, registerables } from 'chart.js'
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

// Registrar componentes do Chart.js
Chart.register(...registerables)

const dashboardStore = useDashboardStore()
const bookshelfStore = useBookshelfStore()
const recommendationStore = useRecommendationStore()
const router = useRouter()

// Referências para canvas do gráfico
const genreChartRef = ref<HTMLCanvasElement | null>(null)
let genreChart: Chart | null = null

// Snackbar
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Diálogo de detalhes da recomendação
const showRecommendationDialog = ref(false)
const selectedRecommendation = ref(null)
const isLoadingBookDetails = ref(false)
const isProcessingRecommendation = ref(false)
const expandDescription = ref(false)

// Meta de leitura
const currentYear = new Date().getFullYear()
const goalTarget = ref(20) // Valor inicial, será atualizado do Supabase

// Livro atual e último livro lido
const currentlyReadingBook = ref(null)
const lastReadBook = ref(null)

// Funções auxiliares para verificação segura de status
const isWishlist = (book) => {
  if (book === null || book === undefined) return false
  const status = Number(book.status)
  return status === 0
}

const isCompleted = (book) => {
  if (book === null || book === undefined) return false
  const status = Number(book.status)
  return status === 1
}

const isReading = (book) => {
  if (book === null || book === undefined) return false
  const status = Number(book.status)
  return status === 2
}

// Funções melhoradas para computar os totais
const computedTotalBooks = computed(() => bookshelfStore.books.length)

const computedTotalBooksRead = computed(
  () => bookshelfStore.books.filter((book) => isCompleted(book)).length,
)

const computedBooksInProgress = computed(
  () => bookshelfStore.books.filter((book) => isReading(book)).length,
)

const computedWishlistCount = computed(
  () => bookshelfStore.books.filter((book) => isWishlist(book)).length,
)

// Formata a data de início da leitura para exibição
const formattedStartDate = computed(() => {
  if (!currentlyReadingBook.value) return 'Não definido'

  const rawDate =
    currentlyReadingBook.value.started_reading_at || currentlyReadingBook.value.dataInicioLeitura

  if (!rawDate) return 'Não definido'

  try {
    const date = new Date(rawDate)
    if (isNaN(date.getTime())) return 'Não definido'

    return date.toLocaleDateString('pt-BR')
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Não definido'
  }
})

// Verifica se temos dados de gênero para mostrar
const hasGenreData = computed(() => {
  const genres = dashboardStore.genresDistribution
  return Object.keys(genres).length > 0
})

// Calcular progresso da meta de leitura
const readingGoalProgress = computed(() => {
  if (!dashboardStore.readingGoal.target) return 0
  return Math.min((computedTotalBooksRead.value / dashboardStore.readingGoal.target) * 100, 100)
})

// Mensagem de progresso da meta
const readingGoalMessage = computed(() => {
  if (readingGoalProgress.value === 100) {
    return 'Parabéns! Você atingiu sua meta de leitura anual.'
  } else if (readingGoalProgress.value > 50) {
    return 'Você está indo muito bem! Continue assim.'
  } else {
    return 'Continue lendo para atingir sua meta anual.'
  }
})

// Calcula projeção de livros até o final do ano
const projectedBooks = computed(() => {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const daysElapsed = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))

  const isLeapYear = (year) => {
    return year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)
  }
  const daysInYear = isLeapYear(now.getFullYear()) ? 366 : 365

  const pace = computedTotalBooksRead.value / daysElapsed || 0

  return Math.round(pace * daysInYear)
})

// Método melhorado para atualizar os dados do dashboard
const refreshDashboardData = async () => {

  try {
    const loadId = Date.now()
    window.DASHBOARD_LOAD_ID = loadId

    await bookshelfStore.fetchBooks()

    if (window.DASHBOARD_LOAD_ID !== loadId) {
      return
    }



    const readingBooks = bookshelfStore.books.filter((book) => isReading(book))
    if (readingBooks.length > 0) {
      currentlyReadingBook.value = readingBooks[0]
    } else {
      currentlyReadingBook.value = null
    }

    const completedBooks = bookshelfStore.books
      .filter((book) => isCompleted(book) && book.finished_reading_at)
      .sort((a, b) => new Date(b.finished_reading_at) - new Date(a.finished_reading_at))

    if (completedBooks.length > 0) {
      lastReadBook.value = completedBooks[0]
    } else {
      lastReadBook.value = null
    }

    await recommendationStore.fetchRecommendations()

  } catch (error) {
    console.error('[Dashboard] Erro ao atualizar dados:', error)
  }
}

// Fornece uma mensagem com base no ritmo de leitura
const getRitmoLeituraMessage = () => {
  const target = dashboardStore.readingGoal.target
  if (projectedBooks.value >= target) {
    return 'Você está no ritmo certo para atingir sua meta!'
  } else if (projectedBooks.value >= target * 0.7) {
    return 'Você está quase lá! Um pequeno aumento no ritmo vai ajudar.'
  } else {
    return 'Considere aumentar seu ritmo de leitura para atingir a meta.'
  }
}

// Carrega os dados quando o componente é montado
onMounted(() => {
  refreshDashboardData()
})

// Recarrega os dados quando o componente é reativado (ex: ao voltar para esta página)
onActivated(() => {
  refreshDashboardData()
})

// Recria o gráfico quando os dados mudam
watch(
  [() => bookshelfStore.books, computedTotalBooks],
  () => {
    setTimeout(() => {
      createGenreChart()
    }, 200)
  },
  { deep: true },
)

// Cria o gráfico de distribuição de gêneros
const createGenreChart = () => {
  if (!genreChartRef.value || !hasGenreData.value) return

  try {
    if (genreChart) {
      genreChart.destroy()
    }

    const genresData = dashboardStore.genresDistribution
    const labels = Object.keys(genresData)
    const data = Object.values(genresData)

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
      'rgba(255, 99, 132, 0.7)',
    ]

    const borderColors = backgroundColors.map((color) => color.replace('0.7', '1'))

    genreChart = new Chart(genreChartRef.value, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColors.slice(0, labels.length),
            borderColor: borderColors.slice(0, labels.length),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 12,
              },
              padding: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || ''
                const value = context.raw || 0
                const total = context.chart.data.datasets[0].data.reduce(
                  (a, b) => Number(a) + Number(b),
                  0,
                )
                const percentage = Math.round((Number(value) / Number(total)) * 100)
                return `${label}: ${value} livro(s) (${percentage}%)`
              },
            },
          },
        },
      },
    })
  } catch (error) {
    console.error('Erro ao criar gráfico de gêneros:', error)
    showNotification('Erro ao criar gráfico de gêneros', 'error')
  }
}

// Navega para a página de recomendações
const showAllRecommendations = () => {
  router.push('/recommendations')
}

// Salvar nova meta de leitura
const saveReadingGoal = async () => {
  if (!goalTarget.value || goalTarget.value < 1) {
    showNotification('Por favor, defina uma meta válida (mínimo 1 livro)', 'warning')
    return
  }

  try {
    const success = await dashboardStore.saveReadingGoal({
      year: currentYear,
      target: goalTarget.value,
    })

    if (success) {
      showNotification(
        `Meta de ${goalTarget.value} livros definida para ${currentYear}!`,
        'success',
      )
    } else {
      showNotification('Erro ao salvar meta de leitura', 'error')
    }
  } catch (error) {
    console.error('Erro ao salvar meta:', error)
    showNotification('Erro ao salvar meta de leitura', 'error')
  }
}

// Exibe notificação
const showNotification = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  showSnackbar.value = true
}

// Abre detalhes da recomendação
const openRecommendationDetails = async (recommendation) => {
  selectedRecommendation.value = recommendation
  showRecommendationDialog.value = true

  const bookId = recommendation.bookId || recommendation.book_id

  if (recommendation.book?.description) {
    return
  }

  if (bookId) {
    isLoadingBookDetails.value = true
    try {
      const bookDetails = await bookshelfStore.fetchBookDetails(bookId)

      if (bookDetails && bookDetails.description) {
        selectedRecommendation.value = {
          ...selectedRecommendation.value,
          book: {
            ...selectedRecommendation.value.book,
            id: bookId,
            description: bookDetails.description,
          },
        }
      } 
    } catch (error) {
      console.error('Erro ao buscar detalhes do livro:', error)
    } finally {
      isLoadingBookDetails.value = false
    }
  }
}

// Aceitar recomendação
const handleAcceptRecommendation = async (recommendation) => {
  isProcessingRecommendation.value = true
  try {
    const result = await recommendationStore.acceptRecommendation(recommendation.id)
    if (result.success) {
      recommendation.status = 'accepted'
      recommendation.acceptedAt = new Date()

      showRecommendationDialog.value = false
      showNotification('Livro adicionado à sua biblioteca com sucesso!', 'success')

      setTimeout(() => {
        refreshDashboardData()
      }, 500)
    } else {
      showNotification('Erro ao aceitar recomendação', 'error')
    }
  } catch (error) {
    console.error('Erro ao aceitar recomendação:', error)
    showNotification('Não foi possível adicionar o livro à sua estante', 'error')
  } finally {
    isProcessingRecommendation.value = false
  }
}

// Recusar recomendação
const handleRejectRecommendation = async (recommendation) => {
  isProcessingRecommendation.value = true
  try {
    const result = await recommendationStore.rejectRecommendation(recommendation.id)
    if (result.success) {
      recommendation.status = 'rejected'
      recommendation.rejectedAt = new Date()

      showRecommendationDialog.value = false
      showNotification('Recomendação recusada', 'info')

      setTimeout(() => {
        refreshDashboardData()
      }, 500)
    } else {
      showNotification('Erro ao recusar recomendação', 'error')
    }
  } catch (error) {
    console.error('Erro ao recusar recomendação:', error)
    showNotification('Erro ao processar sua solicitação', 'error')
  } finally {
    isProcessingRecommendation.value = false
  }
}

// Ver detalhes do livro na biblioteca
const viewBookDetails = async (bookId) => {
  router.push('/bookshelf')
  showNotification('Livro adicionado na sua estante', 'info')
}

// Retorna cor do chip de recomendação
const getRecommendationChipColor = (status) => {
  switch (status) {
    case 'accepted':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
      return 'error'
    default:
      return 'grey'
  }
}

// Retorna label do status de recomendação
const getRecommendationStatusLabel = (status) => {
  switch (status) {
    case 'accepted':
      return 'Aceito'
    case 'pending':
      return 'Pendente'
    case 'rejected':
      return 'Rejeitado'
    default:
      return 'Desconhecido'
  }
}

// Retorna classe de gradiente com base no status
const getStatusGradientClass = (status) => {
  switch (status) {
    case 'accepted':
      return 'gradient-success'
    case 'pending':
      return 'gradient-warning'
    case 'rejected':
      return 'gradient-error'
    default:
      return 'gradient-default'
  }
}

// Formata data para exibição
const formatDate = (date) => {
  if (!date) return 'Não definido'
  const formattedDate = new Date(date)
  return formattedDate.toLocaleDateString('pt-BR')
}

// Trunca descrição do livro
const truncateDescription = (description, maxLength) => {
  if (!description || description.length <= maxLength) return description
  return description.substring(0, maxLength) + '...'
}
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
  transition:
    transform 0.3s ease-in-out,
    box-shadow 0.3s ease-in-out;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.current-book-card,
.chart-card,
.recommendation-card {
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
  height: 100%;
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
  min-height: 200px;
}

.goal-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.recommendation-preview {
  transition:
    transform 0.3s ease-in-out,
    box-shadow 0.3s ease-in-out;
  cursor: pointer;
}

.recommendation-preview:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.recommendation-dialog {
  border-radius: 12px;
}

.gradient-success {
  background: linear-gradient(45deg, #4caf50, #81c784);
}

.gradient-warning {
  background: linear-gradient(45deg, #ff9800, #ffb74d);
}

.gradient-error {
  background: linear-gradient(45deg, #f44336, #e57373);
}

.gradient-default {
  background: linear-gradient(45deg, #9e9e9e, #bdbdbd);
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.book-cover-wrapper {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.status-chip {
  margin-top: 8px;
}

.recommendation-message {
  border: 1px solid white;
}

.quote-icon {
  vertical-align: middle;
}

.book-details {
  padding-left: 16px;
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.8rem;
  }

  .current-book-card,
  .chart-card,
  .recommendation-card {
    min-height: 300px;
  }
}
</style>
