<template>
  <div class="bookshelf-container d-flex justify-center">
    <v-card elevation="0" class="card-container pa-4 rounded-xl" style="width: 90%">
      <!-- Título -->
      <h1 class="text-h3 font-weight-bold mb-8 text-center bookshelf-title">
        <span class="page-title">🔎 Adicionar Livros</span>
      </h1>

      <!-- Campo de busca + botão -->
      <v-row class="d-flex justify-center mb-6" style="width: 100%">
        <v-col cols="12" md="6" lg="5">
          <v-text-field
            v-model="searchQuery"
            label="Digite o nome do livro ou autor"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            @keyup.enter="fetchBooks"
            class="search-field rounded-lg mb-3"
            prepend-inner-icon="mdi-magnify"
          />
          <v-btn @click="fetchBooks" color="primary" block class="search-button" size="large" elevation="2">
            <v-icon class="mr-2">mdi-book-search</v-icon>
            Pesquisar
          </v-btn>
        </v-col>
      </v-row>

      <!-- Notificação de sucesso -->
      <v-snackbar v-model="showNotification" color="success" timeout="3000" location="top">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-check-circle</v-icon>
          <span>{{ notificationText }}</span>
        </div>
      </v-snackbar>

      <!-- Resultados da busca -->
      <v-row v-if="books.length" class="mt-6" justify="center" dense>
        <v-col
          v-for="(book, index) in books"
          :key="book.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
          class="d-flex justify-center"
          v-motion
          :initial="{ opacity: 0, y: 50 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: 100 * index } }"
        >
          <v-card class="ma-4 rounded-xl book-card" width="280" elevation="4">
            <div class="book-cover-container">
              <v-img
                :src="book.volumeInfo.imageLinks?.thumbnail || '/placeholder-book.png'"
                :alt="book.volumeInfo.title"
                height="200"
                :cover="false"
                style="object-fit: contain;"
                class="book-cover"
              />
            </div>
            <v-card-title
              class="text-subtitle-1 font-weight-bold text-truncate book-title"
            >
              {{ book.volumeInfo.title }}
            </v-card-title>
            <v-card-subtitle
              class="text-caption text-truncate book-author"
            >
              <strong>Autor(es):</strong> {{ book.volumeInfo.authors?.join(", ") || "Desconhecido" }}
            </v-card-subtitle>
            
            <!-- Seletor de status -->
            <v-card-text class="pb-0">
              <v-select
                v-model="book.readingStatus"
                :items="statusOptions"
                label="Status de leitura"
                variant="outlined"
                density="compact"
                item-title="label"
                item-value="value"
                prepend-inner-icon="mdi-bookmark"
              >
                <template v-slot:selection="{ item }">
                  <div class="d-flex align-center">
                    <v-icon :color="getStatusColor(book.readingStatus)" size="small" class="mr-1">
                      {{ getStatusIcon(book.readingStatus) }}
                    </v-icon>
                    {{ getStatusLabel(book.readingStatus) }}
                  </div>
                </template>
                <template v-slot:item="{ item, props }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon :color="item?.raw?.color || 'grey'">{{ item?.raw?.icon || 'mdi-bookmark-outline' }}</v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-card-text>
            
            <v-card-actions class="d-flex justify-center mb-2">
              <v-btn
                @click="addToBookshelf(book)"
                color="primary"
                variant="elevated"
                prepend-icon="mdi-plus"
                size="small"
              >
                Adicionar à estante
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Mensagens de status -->
      <v-card
        v-else-if="searchQuery && !loading && !books.length"
        class="mt-6 text-center empty-results-card pa-8"
      >
        <v-icon size="64" color="info" class="mb-4">mdi-book-search-outline</v-icon>
        <p class="text-h6 mb-4">
          Nenhum livro encontrado.
        </p>
        <p class="text-body-2">
          Tente usar palavras-chave diferentes ou verifique a ortografia do título ou autor.
        </p>
      </v-card>
      
      <v-card
        v-else-if="!searchQuery && !books.length"
        class="mt-6 text-center empty-results-card pa-8"
      >
        <v-icon size="64" color="primary" class="mb-4">mdi-bookshelf</v-icon>
        <p class="text-h6 mb-4">
          Digite o título do livro ou o nome do autor para começar a busca.
        </p>
        <p class="text-body-2">
          Você pode adicionar múltiplos livros à sua estante e definir o status de leitura para cada um.
        </p>
      </v-card>

      <v-progress-linear
        v-if="loading"
        indeterminate
        color="accent"
        class="mt-3"
        style="width: 100%"
      />
      <v-alert v-if="error" type="error" class="mt-3" color="error">
        {{ error }}
      </v-alert>
    </v-card>

    <!-- Diálogo de adição com sucesso -->
    <v-dialog v-model="showSuccessDialog" max-width="400px">
      <v-card class="pa-4">
        <v-card-title class="text-h5 text-center">Livro adicionado!</v-card-title>
        <v-card-text class="text-center">
          <v-icon color="success" size="64" class="mb-4">mdi-check-circle</v-icon>
          <p class="mb-4">"{{ lastAddedBook }}" foi adicionado à sua estante!</p>
          <p>Deseja ir para sua estante ou continuar adicionando livros?</p>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="primary" variant="tonal" @click="continueAdding">
            Continuar Adicionando
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="goToBookshelf">
            Ver Estante
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Novo diálogo para definir status e datas -->
    <v-dialog v-model="showStatusDialog" max-width="500px" persistent>
      <v-card class="pa-4">
        <v-card-title class="text-h5 text-center">
          <v-icon color="primary" class="mr-2">mdi-book-settings</v-icon>
          Definir Status do Livro
        </v-card-title>
        
        <v-card-text class="mt-4">
          <p class="text-body-1 mb-4">
            Defina o status de leitura para "{{ selectedBookTitle }}"
          </p>
          
          <!-- Status selector -->
          <v-select
            v-model="dialogBookStatus"
            :items="statusOptions"
            label="Status de Leitura"
            variant="outlined"
            density="comfortable"
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
                  <v-icon :color="item?.raw?.color || 'grey'">{{ item?.raw?.icon || 'mdi-bookmark-outline' }}</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>
          
          <!-- Data de início (para "Estou Lendo") -->
          <v-text-field
            v-if="dialogBookStatus === 2"
            v-model="dialogStartDate"
            label="Data de início da leitura"
            type="date"
            variant="outlined"
            hint="Deixe em branco para usar a data atual"
            persistent-hint
            class="mb-4"
          ></v-text-field>
          
          <!-- Datas de início e fim (para "Já Li") -->
          <template v-if="dialogBookStatus === 1">
            <v-text-field
              v-model="dialogStartDate"
              label="Data de início da leitura"
              type="date"
              variant="outlined"
              hint="Opcional"
              persistent-hint
              class="mb-4"
            ></v-text-field>
            
            <v-text-field
              v-model="dialogEndDate"
              label="Data de conclusão da leitura"
              type="date"
              variant="outlined"
              hint="Deixe em branco para usar a data atual"
              persistent-hint
              class="mb-4"
            ></v-text-field>
          </template>
        </v-card-text>
        
        <v-card-actions class="pt-2">
          <v-spacer></v-spacer>
          <v-btn
            variant="elevated"
            color="primary"
            @click="confirmAddBook"
          >
            Adicionar Livro
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { searchBooks } from "@/services/googleBooks";
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const searchQuery = ref("");
const books = ref([]);
const loading = ref(false);
const error = ref<string | null>(null);
const showNotification = ref(false);
const notificationText = ref("");
const showSuccessDialog = ref(false);
const lastAddedBook = ref("");
const showStatusDialog = ref(false);
const selectedBookTitle = ref("");
const selectedBook = ref<any | null>(null);
const dialogBookStatus = ref(0);
const dialogStartDate = ref("");
const dialogEndDate = ref("");
const router = useRouter();

const bookshelfStore = useBookshelfStore();

const statusOptions = [
  { label: "Quero Ler", value: 0, color: "grey", icon: "mdi-bookmark-outline" },
  { label: "Já Li", value: 1, color: "success", icon: "mdi-check-circle" },
  { label: "Estou Lendo", value: 2, color: "info", icon: "mdi-book-open-variant" },
];

const fetchBooks = async () => {
  if (!searchQuery.value.trim()) return;
  loading.value = true;
  books.value = [];
  error.value = null;
  try {
    const results = await searchBooks(searchQuery.value);
    books.value = results.map(book => ({
      ...book,
      readingStatus: 0  // Padrão: "Quero ler" (0)
    }));
  } catch (err: any) {
    console.error("Erro ao buscar livros:", err);
    error.value = "Erro ao buscar livros.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  bookshelfStore.initAuthListener();
});

const addToBookshelf = async (book: any) => {
  try {
    // Armazenar referência temporária ao livro selecionado
    selectedBookTitle.value = book.volumeInfo.title;
    selectedBook.value = book;
    dialogBookStatus.value = book.readingStatus || 0;
    
    // Abrir diálogo para definir status e datas
    showStatusDialog.value = true;
  } catch (err) {
    console.error("Erro ao preparar adição do livro:", err);
    error.value = "Erro ao adicionar livro à estante.";
  }
};

const confirmAddBook = async () => {
  try {
    if (!selectedBook.value) {
      throw new Error("Livro não selecionado");
    }

    const book = selectedBook.value;
    
    // Função auxiliar para formatar data
    const formatDate = (dateStr: string | null): string | null => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const today = new Date();
    const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    
    // Definir datas com base no status
    let dataInicioLeitura = formatDate(dialogStartDate.value);
    let dataFinalLeitura = formatDate(dialogEndDate.value);

    // Definir valores padrão para as datas se estiverem vazias
    if (dialogBookStatus.value === 2 && !dataInicioLeitura) { // Estou lendo
      dataInicioLeitura = formattedToday;
    } else if (dialogBookStatus.value === 1) { // Já li
      if (!dataFinalLeitura) {
        dataFinalLeitura = formattedToday;
      }
    }

    // Criar objeto do livro para salvar
    const bookData = {
      title: book.volumeInfo.title,
      author: book.volumeInfo.authors?.join(", ") || "Desconhecido",
      coverImage: book.volumeInfo.imageLinks?.thumbnail || "",
      description: book.volumeInfo.description || "",
      pageCount: book.volumeInfo.pageCount || null,
      publishedDate: book.volumeInfo.publishedDate || null,
      status: dialogBookStatus.value,
      dataInicioLeitura: dataInicioLeitura,
      dataFinalLeitura: dataFinalLeitura,
      addedAt: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
    };



    
    // Salvar no banco de dados
    await bookshelfStore.addBook(bookData);
    
    // Atualizar UI
    lastAddedBook.value = book.volumeInfo.title;
    showSuccessDialog.value = true;
    showStatusDialog.value = false;
    
    // Reset dos valores do diálogo
    dialogStartDate.value = "";
    dialogEndDate.value = "";
    dialogBookStatus.value = 0;
    
    notificationText.value = `"${book.volumeInfo.title}" foi adicionado à sua estante!`;
    showNotification.value = true;
  } catch (err) {
    console.error("Erro ao adicionar livro:", err);
    error.value = "Erro ao adicionar livro à estante.";
  }
};

const continueAdding = () => {
  showSuccessDialog.value = false;
};

const goToBookshelf = () => {
  router.push("/bookshelf");
};

const getStatusColor = (status: number): string => {
  const option = statusOptions.find(option => option.value === status);
  return option?.color || "grey";
};

const getStatusIcon = (status: number): string => {
  const option = statusOptions.find(option => option.value === status);
  return option?.icon || "mdi-bookmark-outline";
};

const getStatusLabel = (status: number): string => {
  const option = statusOptions.find(option => option.value === status);
  return option?.label || "Quero Ler";
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

.book-card {
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  border-radius: 16px;
  overflow: hidden;
  background-color: rgb(var(--v-theme-surface));
  display: flex;
  flex-direction: column;
  height: 100%;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.book-cover-container {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background-color: rgb(var(--v-theme-surface-variant), 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
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

.book-cover {
  width: 100%;
  object-fit: contain;
  transition: transform 0.3s ease-in-out;
}

.book-title {
  font-size: 1rem;
  line-height: 1.2rem;
  padding-top: 12px;
  padding-bottom: 0;
}

.book-author {
  font-size: 0.8rem;
  line-height: 1rem;
  opacity: 0.8;
}

.search-field {
  background-color: rgb(var(--v-theme-surface));
  border-radius: 8px;
}

.search-button {
  border-radius: 8px;
  height: 48px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.empty-results-card {
  border-radius: 16px;
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}
</style>
