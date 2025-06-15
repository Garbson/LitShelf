<template>
  <div class="bookshelf-container fill-height d-flex justify-center">
    <!-- Container principal com largura controlada -->
    <div class="main-container">
      <!-- Título -->
      <div class="text-h3 font-weight-bold mb-6 text-center bookshelf-title">
        <span class="page-title mt-5">🔎 Adicionar Livros</span>
      </div>

      <!-- Campo de busca centralizado -->
      <div class="search-container mb-6">
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <BaseTextField
              v-model="searchQuery"
              label="Digite o nome do livro ou autor"
              density="comfortable"
              @keyup.enter="fetchBooks"
              class="search-field rounded-lg mb-4 text-text"
              prepend-inner-icon="mdi-magnify"
              clearable
              elevated
              variant="outlined"
            />
            <v-btn
              @click="fetchBooks"
              color="primary"
              block
              class="search-button"
              size="large"
              variant="elevated"
              rounded="lg"
            >
              <v-icon class="mr-2">mdi-book-search</v-icon>
              Pesquisar
            </v-btn>
          </v-col>
        </v-row>
      </div>

      <!-- Progress bar -->
      <v-progress-linear v-if="loading" indeterminate color="accent" class="mb-4" />

      <!-- Alert de erro -->
      <v-alert v-if="error" type="error" class="mb-4" color="error">
        {{ error }}
      </v-alert>

      <!-- Container dos cards de resultados alinhado com BookshelfView -->
      <div v-if="books.length" class="books-container">
        <div class="books-grid">
          <div
            v-for="(book, index) in books"
            :key="book.id"
            class="book-item"
            v-motion
            :initial="{ opacity: 0, y: 50 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 100 * index } }"
          >
            <v-card class="book-card mx-auto" elevation="2">
              <div class="book-cover-container">
                <v-img
                  :src="book.volumeInfo.imageLinks?.thumbnail || '/placeholder-book.png'"
                  :alt="book.volumeInfo.title"
                  height="240"
                  contain
                  class="book-cover"
                />
              </div>

              <v-card-item class="pa-4">
                <v-card-title class="card-title text-h6 mb-2 line-clamp-2">
                  {{ book.volumeInfo.title }}
                </v-card-title>

                <v-card-subtitle class="text-body-2 mb-3 line-clamp-1">
                  {{ book.volumeInfo.authors?.join(', ') || 'Autor desconhecido' }}
                </v-card-subtitle>

                <!-- Seletor de status -->
                <div class="mb-3">
                  <v-select
                    v-model="book.readingStatus"
                    :items="statusOptions"
                    label="Status de leitura"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    color="primary"
                    item-title="label"
                    item-value="value"
                    prepend-inner-icon="mdi-bookmark"
                    hide-details
                  >
                    <template v-slot:selection="{ item }">
                      <div class="d-flex align-center">
                        <v-icon
                          :color="getStatusColor(book.readingStatus)"
                          size="small"
                          class="mr-1"
                        >
                          {{ getStatusIcon(book.readingStatus) }}
                        </v-icon>
                        {{ getStatusLabel(book.readingStatus) }}
                      </div>
                    </template>
                    <template v-slot:item="{ item, props }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <v-icon :color="item?.raw?.color || 'grey'">{{
                            item?.raw?.icon || 'mdi-bookmark-outline'
                          }}</v-icon>
                        </template>
                      </v-list-item>
                    </template>
                  </v-select>
                </div>

                <!-- Botão de adicionar -->
                <div class="d-flex justify-center">
                  <v-btn
                    @click="addToBookshelf(book)"
                    color="primary"
                    variant="elevated"
                    prepend-icon="mdi-plus"
                    size="small"
                    rounded="xl"
                    block
                  >
                    Adicionar à estante
                  </v-btn>
                </div>
              </v-card-item>
            </v-card>
          </div>
        </div>
      </div>

      <!-- Mensagem quando não há resultados após uma pesquisa -->
      <div v-else-if="hasSearched && !loading && !books.length" class="empty-results-container">
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <v-card class="pa-8 text-center empty-results-card">
              <v-icon size="64" color="info" class="mb-4">mdi-book-search-outline</v-icon>
              <p class="text-h6 mb-4">Nenhum livro encontrado.</p>
              <p class="text-body-2">
                Tente usar palavras-chave diferentes ou verifique a ortografia do título ou autor.
              </p>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Mensagem inicial antes de pesquisar -->
      <div v-else-if="!hasSearched && !loading" class="empty-results-container">
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <v-card class="pa-8 text-center empty-results-card">
              <v-icon size="64" color="primary" class="mb-4">mdi-bookshelf</v-icon>
              <p class="text-h6 mb-4">
                Digite o título do livro ou o nome do autor para começar a busca.
              </p>
              <p class="text-body-2">
                Você pode adicionar múltiplos livros à sua estante e definir o status de leitura
                para cada um.
              </p>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- Notificação de sucesso -->
    <v-snackbar v-model="showNotification" color="success" timeout="3000" location="top">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-check-circle</v-icon>
        <span>{{ notificationText }}</span>
      </div>
    </v-snackbar>

    <!-- Diálogo de adição com sucesso -->
    <v-dialog v-model="showSuccessDialog" max-width="400px">
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h5 text-center">Livro adicionado!</v-card-title>
        <v-card-text class="text-center">
          <v-icon color="success" size="64" class="mb-4">mdi-check-circle</v-icon>
          <p class="mb-4">"{{ lastAddedBook }}" foi adicionado à sua estante!</p>
          <p>Deseja ir para sua estante ou continuar adicionando livros?</p>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="primary" variant="tonal" @click="continueAdding" rounded="xl">
            Continuar Adicionando
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="goToBookshelf" rounded="xl">
            Ver Estante
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo para definir status e datas -->
    <v-dialog v-model="showStatusDialog" max-width="500px" persistent>
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h5 text-center">
          <v-icon color="primary" class="mr-2">mdi-book-settings</v-icon>
          Definir Status do Livro
        </v-card-title>

        <v-card-text class="mt-4">
          <p class="text-body-1 mb-4">Defina o status de leitura para "{{ selectedBookTitle }}"</p>

          <!-- Status selector -->
          <v-select
            v-model="dialogBookStatus"
            :items="statusOptions"
            label="Status de Leitura"
            variant="outlined"
            density="comfortable"
            color="primary"
            rounded="xl"
            class="mb-4"
            item-title="label"
            item-value="value"
          >
            <template v-slot:selection="{ item }">
              <div class="d-flex align-center">
                <v-icon :color="getStatusColor(dialogBookStatus)" class="mr-2">
                  {{ getStatusIcon(dialogBookStatus) }}
                </v-icon>
                {{ getStatusLabel(dialogBookStatus) }}
              </div>
            </template>
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-icon :color="item?.raw?.color || 'grey'">{{
                    item?.raw?.icon || 'mdi-bookmark-outline'
                  }}</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <!-- Data de início (para "Estou Lendo") -->
          <BaseTextField
            v-if="dialogBookStatus === 2"
            v-model="dialogStartDate"
            label="Data de início da leitura"
            type="date"
            hint="Deixe em branco para usar a data atual"
            persistent-hint
            elevated
          />

          <!-- Datas de início e fim (para "Já Li") -->
          <template v-if="dialogBookStatus === 1">
            <BaseTextField
              v-model="dialogStartDate"
              label="Data de início da leitura"
              type="date"
              hint="Opcional"
              persistent-hint
              elevated
            />

            <BaseTextField
              v-model="dialogEndDate"
              label="Data de conclusão da leitura"
              type="date"
              hint="Deixe em branco para usar a data atual"
              persistent-hint
              elevated
            />
          </template>
        </v-card-text>

        <v-card-actions class="pt-2">
          <v-spacer></v-spacer>
          <v-btn variant="elevated" color="primary" @click="confirmAddBook" rounded="xl">
            Adicionar Livro
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import BaseTextField from '@/components/BaseTextField.vue'
import { searchBooks } from '@/services/googleBooks'
import { useBookshelfStore } from '@/stores/useBookshelfStore'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const searchQuery = ref('')
const books = ref([])
const loading = ref(false)
const error = ref<string | null>(null)
const showNotification = ref(false)
const notificationText = ref('')
const showSuccessDialog = ref(false)
const lastAddedBook = ref('')
const showStatusDialog = ref(false)
const selectedBookTitle = ref('')
const selectedBook = ref<any | null>(null)
const dialogBookStatus = ref(0)
const dialogStartDate = ref('')
const dialogEndDate = ref('')
const hasSearched = ref(false)
const router = useRouter()

const bookshelfStore = useBookshelfStore()

const statusOptions = [
  { label: 'Quero Ler', value: 0, color: 'grey', icon: 'mdi-bookmark-outline' },
  { label: 'Já Li', value: 1, color: 'success', icon: 'mdi-check-circle' },
  { label: 'Estou Lendo', value: 2, color: 'info', icon: 'mdi-book-open-variant' },
]

const fetchBooks = async () => {
  if (!searchQuery.value.trim()) return
  loading.value = true
  books.value = []
  error.value = null
  hasSearched.value = true
  try {
    const results = await searchBooks(searchQuery.value)
    books.value = results.map((book) => ({
      ...book,
      readingStatus: 0, // Padrão: "Quero ler" (0)
    }))
  } catch (err: any) {
    console.error('Erro ao buscar livros:', err)
    error.value = 'Erro ao buscar livros.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  bookshelfStore.fetchBooks()
})

const addToBookshelf = async (book: any) => {
  try {
    // Armazenar referência temporária ao livro selecionado
    selectedBookTitle.value = book.volumeInfo.title
    selectedBook.value = book
    dialogBookStatus.value = book.readingStatus || 0

    // Abrir diálogo para definir status e datas
    showStatusDialog.value = true
  } catch (err) {
    console.error('Erro ao preparar adição do livro:', err)
    error.value = 'Erro ao adicionar livro à estante.'
  }
}

const confirmAddBook = async () => {
  try {
    if (!selectedBook.value) {
      throw new Error('Livro não selecionado')
    }

    const book = selectedBook.value

    // Função auxiliar para formatar data
    const formatDate = (dateStr: string | null): string | null => {
      if (!dateStr) return null
      const date = new Date(dateStr)
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
    }

    const today = new Date()
    const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

    // Definir datas com base no status
    let dataInicioLeitura = formatDate(dialogStartDate.value)
    let dataFinalLeitura = formatDate(dialogEndDate.value)

    // Definir valores padrão para as datas se estiverem vazias
    if (dialogBookStatus.value === 2 && !dataInicioLeitura) {
      // Estou lendo
      dataInicioLeitura = formattedToday
    } else if (dialogBookStatus.value === 1) {
      // Já li
      if (!dataFinalLeitura) {
        dataFinalLeitura = formattedToday
      }
    }

    // Criar objeto do livro para salvar
    const bookData = {
      title: book.volumeInfo.title,
      author: book.volumeInfo.authors?.join(', ') || 'Desconhecido',
      coverImage: book.volumeInfo.imageLinks?.thumbnail || '',
      description: book.volumeInfo.description || '',
      pageCount: book.volumeInfo.pageCount || null,
      publishedDate: book.volumeInfo.publishedDate || null,
      status: dialogBookStatus.value,
      dataInicioLeitura: dataInicioLeitura,
      dataFinalLeitura: dataFinalLeitura,
      addedAt: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
    }

    // Salvar no banco de dados
    await bookshelfStore.addBook(bookData)

    // Atualizar UI
    lastAddedBook.value = book.volumeInfo.title
    showSuccessDialog.value = true
    showStatusDialog.value = false

    // Reset dos valores do diálogo
    dialogStartDate.value = ''
    dialogEndDate.value = ''
    dialogBookStatus.value = 0

    notificationText.value = `"${book.volumeInfo.title}" foi adicionado à sua estante!`
    showNotification.value = true
  } catch (err) {
    console.error('Erro ao adicionar livro:', err)
    error.value = 'Erro ao adicionar livro à estante.'
  }
}

const continueAdding = () => {
  showSuccessDialog.value = false
}

const goToBookshelf = () => {
  router.push('/bookshelf')
}

const getStatusColor = (status: number): string => {
  const option = statusOptions.find((option) => option.value === status)
  return option?.color || 'grey'
}

const getStatusIcon = (status: number): string => {
  const option = statusOptions.find((option) => option.value === status)
  return option?.icon || 'mdi-bookmark-outline'
}

const getStatusLabel = (status: number): string => {
  const option = statusOptions.find((option) => option.value === status)
  return option?.label || 'Quero Ler'
}
</script>

<style scoped>
.bookshelf-container {
  width: 100%;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  padding: 1rem;
  position: relative;
}

/* Container principal com largura controlada */
.main-container {
  width: 90%;
  max-width: 1400px;
  margin: 0 auto;
}

/* Container de busca centralizado */
.search-container {
  width: 100%;
  margin: 0 auto;
}

/* Container para mensagens vazias - centraliza e alinha com o botão */
.empty-results-container {
  width: 100%;
  margin: 0 auto;
}

/* Container dos cards alinhado com os filtros */
.books-container {
  width: 100%;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  justify-items: center;
}

.book-item {
  width: 100%;
  max-width: 280px;
}

.book-card {
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  border-radius: 16px !important;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
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

.book-cover-container {
  width: 100%;
  height: 240px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.book-cover {
  transition: transform 0.3s ease-in-out;
}

.book-card:hover .book-cover {
  transform: scale(1.05);
}

.card-title {
  font-weight: 600;
  line-height: 1.3;
  color: rgb(var(--v-theme-primary));
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.search-button {
  height: 48px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.empty-results-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 100%;
}

/* Responsividade */
@media (max-width: 1200px) {
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 960px) {
  .main-container {
    width: 95%;
  }

  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .bookshelf-container {
    padding: 0.5rem;
  }

  .main-container {
    width: 90%;
  }

  .page-title {
    font-size: 1.8rem;
  }

  .books-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .book-item {
    max-width: 100%;
  }
}

@media (max-width: 400px) {
  .bookshelf-container {
    padding: 0.25rem;
  }

  .page-title {
    font-size: 1.6rem;
  }

  .book-cover-container {
    height: 200px;
  }
}
</style>
