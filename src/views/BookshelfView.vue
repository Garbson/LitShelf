<template>
  <div class="bookshelf-container fill-height d-flex justify-center">
    <v-card elevation="0" class="card-container pa-4 rounded-xl" style="width: 90%">
      <h1 class="text-h3 font-weight-bold mb-4 text-center bookshelf-title">
        <span class="page-title">📚 Minha Estante Digital</span>
      </h1>

      <!-- Filtros e pesquisa -->
      <v-row class="mb-6 d-flex justify-center">
        <v-col cols="12" sm="6" md="4">
          <v-text-field
            v-model="searchQuery"
            label="Pesquisar livros"
            variant="outlined"
            density="comfortable"
            hide-details
            rounded="lg"
            prepend-inner-icon="mdi-magnify"
            class="search-field rounded-lg"
            clearable
          ></v-text-field>
        </v-col>
        
        <v-col cols="12" sm="6" md="4">
          <v-select
            v-model="selectedFilter"
            :items="filterOptions"
            label="Filtrar por status"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            class="filter-field"
          ></v-select>
        </v-col>
        
        <v-col cols="12" sm="6" md="4">
          <v-select
            v-model="sortOption"
            :items="sortOptions"
            label="Ordenar por"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            class="sort-field rounded-lg"
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
      <v-alert
        v-if="bookshelfStore.error"
        type="error"
        class="mb-4"
        color="error"
      >
        {{ bookshelfStore.error }}
      </v-alert>

      <!-- Lista de livros filtrados -->
      <v-row v-if="filteredBooks.length" justify="center" align="start" dense>
        <v-col
          v-for="book in filteredBooks"
          :key="book.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
          class="d-flex justify-center"
          v-motion
          :initial="{ opacity: 0, y: 50 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: 100 * book.index } }"
        >
          <v-card
            class="ma-4 rounded-xl book-card"
            width="280"
            elevation="2"
            @click="goToBookDetails(book.id)"
            :class="{'reading-glow': book.status === '2'}"
          >
            <div class="book-cover-container">
              <v-img
                :src="book.coverImage || '/placeholder-book.png'"
                :alt="book.title"
                height="240"
                :cover="false"
                class="book-cover"
                style="object-fit: contain;"
              />
              
              <!-- Tag de status na capa do livro -->
              <div class="status-ribbon" :class="getStatusClass(book.status)">
                <span class="status-text">
                  <v-icon size="small" class="me-1">{{ getStatusIcon(book.status) }}</v-icon>
                  {{ getStatusLabel(book.status) }}
                </span>
              </div>
              
              <!-- Avaliação por estrelas se existir -->
              <div v-if="book.rating" class="rating-badge">
                <v-icon color="amber" size="small">mdi-star</v-icon>
                <span>{{ book.rating }}</span>
              </div>
            </div>

            <v-card-item>
              <v-card-title class="text-subtitle-1 font-weight-bold text-truncate book-title pa-0">
                {{ book.title }}
              </v-card-title>
              
              <v-card-subtitle class="text-caption text-truncate book-author pa-0 pt-1">
                {{ book.author }}
              </v-card-subtitle>
              
              <div class="d-flex align-center justify-space-between mt-2">
                <v-chip
                  size="x-small"
                  class="genre-chip"
                  variant="flat"
                  :color="book.genre ? 'default' : 'grey-lighten-1'"
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
        </v-col>
      </v-row>

      <!-- Mensagem de nenhum livro -->
      <v-card 
        v-else-if="!bookshelfStore.isLoading && !bookshelfStore.error" 
        class="pa-8 text-center empty-bookshelf-card"
      >
        <v-icon size="64" color="primary" class="mb-4">mdi-bookshelf</v-icon>
        <p class="text-h6 mb-4">
          {{ computedBooks.length === 0 ? 
            'Sua estante está vazia.' : 
            'Nenhum livro corresponde aos critérios de busca.' 
          }}
        </p>
        <v-btn 
          color="primary" 
          :to="'/addBook'"
          prepend-icon="mdi-plus"
          variant="elevated"
        >
          Adicionar Livros
        </v-btn>
      </v-card>

      <!-- Botão flutuante para adicionar livro -->
      <v-btn
        class="floating-add-button"
        color="accent"
        size="large"
        icon
        elevation="4"
        :to="'/addBook'"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
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

<script lang="ts" setup>
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const bookshelfStore = useBookshelfStore();
const router = useRouter();
const route = useRoute();
const searchQuery = ref("");
const selectedFilter = ref("all");
const sortOption = ref("title_asc");
const showSnackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

// Opções de filtro
const filterOptions = [
  { title: "Todos os livros", value: "all" },
  { title: "Quero Ler", value: "0" },
  { title: "Já Li", value: "1" },
  { title: "Estou Lendo", value: "2" },
];

// Opções de ordenação
const sortOptions = [
  { title: "Título (A-Z)", value: "title_asc" },
  { title: "Título (Z-A)", value: "title_desc" },
  { title: "Autor (A-Z)", value: "author_asc" },
  { title: "Autor (Z-A)", value: "author_desc" },
  { title: "Recentemente adicionados", value: "date_desc" },
  { title: "Adicionados primeiro", value: "date_asc" },
];

// Livros com propriedades reativas
const computedBooks = computed(() => {
  return bookshelfStore.books.map((book, index) =>
    reactive({ ...book, isHovered: false, index })
  );
});

// Livros filtrados e ordenados
const filteredBooks = computed(() => {
  let result = [...computedBooks.value];
  
  // Aplicar filtro por status
  if (selectedFilter.value !== "all") {
    result = result.filter(book => book.status === selectedFilter.value);
  }
  
  // Aplicar pesquisa
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(book => 
      book.title.toLowerCase().includes(query) || 
      book.author.toLowerCase().includes(query) ||
      (book.genre && book.genre.toLowerCase().includes(query))
    );
  }
  
  // Aplicar ordenação
  switch (sortOption.value) {
    case "title_asc":
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "title_desc":
      result.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "author_asc":
      result.sort((a, b) => a.author.localeCompare(b.author));
      break;
    case "author_desc":
      result.sort((a, b) => b.author.localeCompare(a.author));
      break;
    case "date_desc":
      result.sort((a, b) => {
        const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
        return dateB - dateA;
      });
      break;
    case "date_asc":
      result.sort((a, b) => {
        const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
        return dateA - dateB;
      });
      break;
  }
  
  return result;
});

// Verificar se há mensagem de sucesso via query param (ex: após deletar livro)
watch(() => route.query.message, (newMessage) => {
  if (newMessage) {
    snackbarText.value = newMessage as string;
    snackbarColor.value = "success";
    showSnackbar.value = true;
    
    // Limpar a query param após mostrar a mensagem
    router.replace({ query: {} });
  }
});

onMounted(() => {
  bookshelfStore.initAuthListener();
});

const goToBookDetails = (bookId: string) => {
  router.push(`/book/${bookId}`);
};

// Retorna a cor do chip de status
const getStatusColor = (status: string | number): string => {
  const statusNum = Number(status);
  switch (statusNum) {
    case 2:
      return "info";
    case 1:
      return "success";
    default:
      return "grey";
  }
};

// Retorna o texto do status
const getStatusLabel = (status: string | number): string => {
  const statusNum = Number(status);
  switch (statusNum) {
    case 2:
      return "Estou Lendo";
    case 1:
      return "Já Li";
    default:
      return "Quero Ler";
  }
};

// Retorna o ícone de acordo com o status
const getStatusIcon = (status: string | number): string => {
  const statusNum = Number(status);
  switch (statusNum) {
    case 2:
      return "mdi-book-open-variant";
    case 1:
      return "mdi-check-circle";
    default:
      return "mdi-bookmark-outline";
  }
};

// Retorna a classe CSS para a fita de status
const getStatusClass = (status: string | number): string => {
  const statusNum = Number(status);
  switch (statusNum) {
    case 2:
      return "reading-status";
    case 1:
      return "completed-status";
    default:
      return "wishlist-status";
  }
};

</script>

<style scoped>
.bookshelf-container {
  width: 100%;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  padding: 1rem;
  position: relative;
}

.card-container {
  background: transparent;
}

.book-card {
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  border-radius: 16px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.book-card v-card-item {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
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

/* Tag de status estilizada como fita */
.status-ribbon {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 6px 10px;
  text-align: center;
  font-weight: 500;
  letter-spacing: 0.5px;
  font-size: 0.85rem;
  color: white;
  backdrop-filter: blur(4px);
}

.wishlist-status {
  background-color: rgba(var(--v-theme-grey), 0.8);
}

.reading-status {
  background-color: rgba(var(--v-theme-info), 0.8);
}

.completed-status {
  background-color: rgba(var(--v-theme-success), 0.8);
}

.status-text {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rating-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 12px;
  padding: 3px 8px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  column-gap: 2px;
}

.book-title {
  font-size: 1rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface));
}

.book-author {
  font-size: 0.85rem;
  line-height: 1.2;
  opacity: 0.8;
  color: rgb(var(--v-theme-on-surface), 0.8);
}

.genre-chip {
  font-size: 0.7rem;
}

.pages-count {
  color: rgb(var(--v-theme-on-surface), 0.7);
  display: flex;
  align-items: center;
}

.floating-add-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 5;
}

.search-field, 
.filter-field, 
.sort-field {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
}

.empty-bookshelf-card {
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.8rem;
  }
  
  .book-card {
    width: 240px;
  }
  
  .book-cover-container {
    height: 200px;
  }
}
</style>
