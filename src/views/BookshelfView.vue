<template>
  <div class="bookshelf-container fill-height d-flex justify-center">
    <!-- Container principal com largura controlada -->
    <div class="main-container">
      <h1 class="text-h3 font-weight-bold mb-6 text-center bookshelf-title">
        <span class="page-title">
          <template v-if="friendInfo"> 📚 Estante de {{ friendInfo.name }} </template>
          <template v-else> 📚 Minha Estante Digital </template>
        </span>
      </h1>

      <!-- Filtros e pesquisa -->
      <v-row class="mb-6 filters-section">
        <v-col cols="12" sm="6" md="4" class="filter-col">
          <BaseTextField
            v-model="searchQuery"
            label="Pesquisar livros"
            prepend-inner-icon="mdi-magnify"
            class="search-field rounded-lg text-text"
            clearable
            density="comfortable"
            rounded="lg"
            color="background"
          />
        </v-col>

        <v-col cols="12" sm="6" md="4" class="filter-col">
          <v-select
            v-model="selectedFilter"
            :items="filterOptions"
            label="Filtrar por status"
            variant="outlined"
            rounded="lg"
            hide-details
            class="filter-field text-text"
          ></v-select>
        </v-col>

        <v-col cols="12" sm="6" md="4" class="filter-col">
          <v-select
            v-model="sortOption"
            :items="sortOptions"
            label="Ordenar por"
            variant="outlined"
            rounded="lg"
            hide-details
            class="sort-field text-text"
          ></v-select>
        </v-col>
      </v-row>

      <!-- Mensagem de carregamento -->
      <v-progress-linear
        v-if="bookshelfStore.isLoading"
        indeterminate
        color="accent"
        class="mb-4"
      />

      <!-- Mensagem de erro -->
      <v-alert v-if="bookshelfStore.error" type="error" class="mb-4" color="error">
        {{ bookshelfStore.error }}
      </v-alert>

      <!-- Container dos cards com largura alinhada aos filtros -->
      <div v-if="paginatedBooks.length" class="books-container">
        <div class="books-grid">
          <div
            v-for="book in paginatedBooks"
            :key="book.id"
            class="book-item"
            v-motion
            :initial="{ opacity: 0, y: 50 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: 100 * book.index } }"
          >
            <v-card
              class="book-card rounded-xl"
              elevation="2"
              @click="goToBookDetails(book.id)"
              :class="{ 'reading-glow': book.status === 2 || book.status === '2' }"
            >
              <div class="book-cover-container">
                <v-img
                  :src="book.cover_image_url || '/placeholder-book.png'"
                  :alt="book.title"
                  height="240"
                  contain
                  class="book-cover"
                />
              </div>

              <v-card-item class="pa-4">
                <v-card-title class="card-title text-h6 mb-2 line-clamp-2">
                  {{ book.title }}
                </v-card-title>

                <v-card-subtitle class="text-body-2 mb-3 line-clamp-1">
                  {{ book.author || 'Autor desconhecido' }}
                </v-card-subtitle>

                <!-- Status chip positioned below title -->
                <div class="mb-3">
                  <v-chip
                    :color="getStatusColor(book.status)"
                    size="small"
                    class="status-chip"
                    :prepend-icon="getStatusIcon(book.status)"
                  >
                    {{ getStatusLabel(book.status) }}
                  </v-chip>
                </div>

                <!-- Informações extras -->
                <div class="d-flex justify-space-between align-center">
                  <v-chip
                    size="x-small"
                    variant="tonal"
                    :color="
                      book.genre === 'Ficção'
                        ? 'purple'
                        : book.genre === 'Romance'
                          ? 'pink'
                          : 'default'
                    "
                  >
                    {{ book.genre || 'Gênero desconhecido' }}
                  </v-chip>

                  <span v-if="book.pageCount" class="text-caption pages-count">
                    <v-icon size="x-small" class="me-1">mdi-file-document-outline</v-icon>
                    {{ book.pageCount }} págs
                  </span>
                </div>
              </v-card-item>
            </v-card>
          </div>
        </div>
      </div>

      <!-- Controles de paginação -->
      <div v-if="filteredBooks.length > booksPerPage" class="d-flex justify-center my-6">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="5"
          rounded="circle"
        ></v-pagination>
      </div>

      <!-- Mensagem quando não há livros -->
      <v-card
        v-else-if="!bookshelfStore.isLoading && !bookshelfStore.error && computedBooks.length === 0"
        class="pa-8 text-center empty-bookshelf-card"
      >
        <v-icon size="64" color="grey-lighten-1" class="mb-4">
          {{ friendId ? 'mdi-bookshelf' : 'mdi-book-plus' }}
        </v-icon>
        <p class="text-h6 mb-4">
          {{
            friendId
              ? 'A estante deste amigo está vazia.'
              : 'Sua estante está vazia! Que tal adicionar seu primeiro livro?'
          }}
        </p>
        <div class="d-flex gap-3 justify-center flex-wrap">
          <v-btn
            v-if="friendId"
            color="primary"
            :to="'/friends'"
            prepend-icon="mdi-arrow-left"
            variant="elevated"
            rounded="xl"
          >
            Voltar para Amigos
          </v-btn>
          <v-btn
            v-else
            color="primary"
            :to="'/addBook'"
            prepend-icon="mdi-book-plus"
            variant="elevated"
            rounded="xl"
          >
            Adicionar Primeiro Livro
          </v-btn>
        </div>
      </v-card>

      <!-- Mensagem de filtro sem resultados -->
      <v-card
        v-else-if="!bookshelfStore.isLoading && !bookshelfStore.error && filteredBooks.length === 0"
        class="pa-8 text-center empty-bookshelf-card"
      >
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-filter-remove</v-icon>
        <p class="text-h6 mb-4">Nenhum livro corresponde aos critérios de busca.</p>
        <div class="d-flex gap-3 justify-center">
          <v-btn
            color="secondary"
            @click="resetFilters"
            prepend-icon="mdi-filter-remove-outline"
            variant="tonal"
            rounded="xl"
          >
            Limpar Filtros
          </v-btn>
          <v-btn
            v-if="friendId"
            color="primary"
            :to="'/friends'"
            prepend-icon="mdi-arrow-left"
            variant="elevated"
            rounded="xl"
          >
            Voltar para Amigos
          </v-btn>
        </div>
      </v-card>
    </div>

    <!-- Botões flutuantes para navegação quando estiver vendo estante de amigo -->
    <v-btn
      v-if="friendId"
      color="accent"
      @click="goToMyBookshelf"
      prepend-icon="mdi-bookshelf"
      size="large"
      class="floating-btn my-bookshelf-btn"
      variant="elevated"
      rounded="xl"
    >
      Minha Estante
    </v-btn>

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
import BaseTextField from '@/components/BaseTextField.vue'
import { useBookshelfStore } from '@/stores/useBookshelfStore'
import { useFriendsStore } from '@/stores/useFriendsStore'
import { supabase } from '@/supabase'
import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const bookshelfStore = useBookshelfStore()
const friendsStore = useFriendsStore()
const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const selectedFilter = ref('all')
const sortOption = ref('title_asc')
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const currentPage = ref(1)
const booksPerPage = 12
const friendInfo = ref(null)
const friendId = computed(() => (route.query.friendId as string) || null)
const friendBooks = ref<any[]>([])

// Opções de filtro
const filterOptions = [
  { title: 'Todos os livros', value: 'all' },
  { title: 'Quero Ler', value: '0' },
  { title: 'Já Li', value: '1' },
  { title: 'Estou Lendo', value: '2' },
]

// Opções de ordenação
const sortOptions = [
  { title: 'Título (A-Z)', value: 'title_asc' },
  { title: 'Título (Z-A)', value: 'title_desc' },
  { title: 'Autor (A-Z)', value: 'author_asc' },
  { title: 'Autor (Z-A)', value: 'author_desc' },
  { title: 'Recentemente adicionados', value: 'date_desc' },
  { title: 'Adicionados primeiro', value: 'date_asc' },
]

const computedBooks = computed(() => {
  return bookshelfStore.books.map((book, index) => {
    return reactive({ ...book, isHovered: false, index })
  })
})

// Livros filtrados e ordenados
const filteredBooks = computed(() => {
  let result = [...computedBooks.value]

  // Aplicar filtro por status
  if (selectedFilter.value !== 'all') {
    result = result.filter((book) => {
      const bookStatus = typeof book.status === 'string' ? parseInt(book.status) : book.status
      const filterStatus = parseInt(selectedFilter.value)
      return bookStatus === filterStatus
    })
  }

  // Aplicar filtro de pesquisa
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (book) =>
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.genre?.toLowerCase().includes(query),
    )
  }

  // Aplicar ordenação
  result.sort((a, b) => {
    switch (sortOption.value) {
      case 'title_asc':
        return (a.title || '').localeCompare(b.title || '')
      case 'title_desc':
        return (b.title || '').localeCompare(a.title || '')
      case 'author_asc':
        return (a.author || '').localeCompare(b.author || '')
      case 'author_desc':
        return (b.author || '').localeCompare(a.author || '')
      case 'date_desc':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      case 'date_asc':
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      default:
        return 0
    }
  })

  return result
})

// Livros paginados
const paginatedBooks = computed(() => {
  const start = (currentPage.value - 1) * booksPerPage
  const end = start + booksPerPage
  return filteredBooks.value.slice(start, end)
})

// Total de páginas
const totalPages = computed(() => {
  return Math.ceil(filteredBooks.value.length / booksPerPage)
})

// Watchers
watch(
  () => route.query.friendId,
  async (newFriendId) => {
    if (newFriendId) {
      await fetchFriendInfo(newFriendId)
      await loadFriendBooks(newFriendId)
    } else {
      friendInfo.value = null
      await refreshBookshelf()
    }
  },
  { immediate: false },
)

watch([searchQuery, selectedFilter, sortOption], () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(async () => {
  bookshelfStore.setViewingFriend(null)

  if (friendId.value) {
    await fetchFriendInfo(friendId.value)
    await loadFriendBooks(friendId.value)
  } else {
    await refreshBookshelf()
  }
})

onActivated(() => {
  if (!friendId.value) {
    refreshBookshelf()
  } else {
    loadFriendBooks(friendId.value)
  }
})

// Methods
const goToBookDetails = (bookId: string) => {
  if (friendId.value) {
    router.push(`/book/${bookId}?friendId=${friendId.value}`)
  } else {
    router.push(`/book/${bookId}`)
  }
}

const refreshBookshelf = async () => {
  await bookshelfStore.fetchBooks()
}

async function loadFriendBooks(id: string) {
  try {
    bookshelfStore.isLoading = true
    bookshelfStore.error = ''

    const userSession = await supabase.auth.getSession()
    const currentUserId = userSession.data.session?.user.id

    if (!currentUserId) {
      throw new Error('Usuário não autenticado')
    }

    await bookshelfStore.fetchFriendBooks(id)
  } catch (err) {
    console.error('Erro ao carregar livros do amigo:', err)
    bookshelfStore.error = 'Erro ao carregar livros do amigo.'
  } finally {
    bookshelfStore.isLoading = false
  }
}

async function fetchFriendInfo(id: string) {
  try {
    const { data, error } = await supabase
      .from('available_users')
      .select('id, name, email, avatar_url')
      .eq('id', id)
      .single()

    if (error) throw error

    if (data) {
      friendInfo.value = data
    }
  } catch (err) {
    console.error('Erro ao buscar informações do amigo:', err)
    bookshelfStore.error = 'Não foi possível carregar informações do amigo.'
  }
}

const getStatusColor = (status: string | number): string => {
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

const getStatusLabel = (status: string | number): string => {
  const statusNum = Number(status)
  switch (statusNum) {
    case 2:
      return 'Estou Lendo'
    case 1:
      return 'Já Li'
    default:
      return 'Quero Ler'
  }
}

const getStatusIcon = (status: string | number): string => {
  const statusNum = Number(status)
  switch (statusNum) {
    case 2:
      return 'mdi-book-open-variant'
    case 1:
      return 'mdi-check-circle'
    default:
      return 'mdi-bookmark-outline'
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedFilter.value = 'all'
  sortOption.value = 'title_asc'
  currentPage.value = 1
}

const goToMyBookshelf = async () => {
  friendInfo.value = null
  bookshelfStore.setViewingFriend(null)
  friendBooks.value = []

  await bookshelfStore.fetchBooks()
  router.push('/bookshelf')

  snackbarText.value = 'Voltando para sua estante'
  snackbarColor.value = 'info'
  showSnackbar.value = true
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

/* Container dos filtros com espaçamento adequado */
.filters-section {
  margin-bottom: 2rem;
}

.filter-col {
  padding: 0 12px;
}

.search-field,
.filter-field,
.sort-field {
  width: 100%;
}

/* Estilos dos filtros seguindo padrão do AddBookView */
.search-field,
.filter-field,
.sort-field {
  width: 100%;
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

.reading-glow {
  box-shadow: 0 4px 15px rgba(var(--v-theme-info), 0.4);
}

.reading-glow:hover {
  box-shadow: 0 12px 24px rgba(var(--v-theme-info), 0.6);
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
}

.book-cover {
  transition: transform 0.3s ease-in-out;
}

.book-card:hover .book-cover {
  transform: scale(1.05);
}

.status-chip {
  position: relative;
  z-index: 1;
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

.pages-count {
  color: rgb(var(--v-theme-on-surface-variant));
  display: flex;
  align-items: center;
}

.empty-bookshelf-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.floating-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10;
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

  .filter-col {
    padding: 0 8px;
    margin-bottom: 12px;
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

  .filter-col {
    padding: 0 4px;
    margin-bottom: 16px;
  }

  .books-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .book-item {
    max-width: 100%;
  }

  .floating-btn {
    bottom: 16px;
    right: 16px;
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
