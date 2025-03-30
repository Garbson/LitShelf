<template>
  <div class="bookshelf-container d-flex justify-center">
    <v-card elevation="0" class="bg-transparent pa-4 rounded-xl" style="width: 90%">
      <!-- Título -->
      <h2 class="text-h3 font-weight-bold mb-8 text-center text-text bookshelf-title">
        <span class="title-highlight">🔎 Adicionar Livros</span>
      </h2>

      <!-- Campo de busca + botão -->
      <v-row class="d-flex justify-center mb-6" style="width: 100%">
        <v-col cols="12" md="4">
          <v-text-field
            v-model="searchQuery"
            label="Digite o nome do livro ou autor"
            dense
            hide-details
            clearable
            rounded
            @keyup.enter="fetchBooks"
            class="bg-background rounded-xl"
            variant="solo"
            persistent-hint
          />
          <v-btn @click="fetchBooks" color="primary" block class="mt-2 rounded-xl">
            Pesquisar
          </v-btn>
        </v-col>
      </v-row>

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
          <v-card class="ma-4 bg-primary rounded-xl book-card" width="280">
            <v-img
              :src="book.volumeInfo.imageLinks?.thumbnail"
              :alt="book.volumeInfo.title"
              contain
              class="book-cover rounded-xl"
              height="200"
            />
            <v-card-title
              class="text-subtitle-1 font-weight-bold text-background text-truncate book-title"
            >
              {{ book.volumeInfo.title }}
            </v-card-title>
            <v-card-subtitle
              class="text-caption text-background text-truncate book-author"
            >
              <strong>Autor(es):</strong> {{ book.volumeInfo.authors?.join(", ") }}
            </v-card-subtitle>
            <div class="d-flex justify-center mt-2">
              <v-btn
                icon
                @click="addToBookshelf(book)"
                color="success"
                class="add-to-bookshelf-button"
                size="small"
              >
                <v-icon size="20">mdi-plus</v-icon>
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Mensagens de status -->
      <p
        v-else-if="searchQuery && !loading && !books.length"
        class="mt-6 text-text text-center"
      >
        Nenhum livro encontrado.
      </p>
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
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { searchBooks } from "@/services/googleBooks";
import { useBookshelfStore } from "@/stores/useBookshelfStore";

const searchQuery = ref("");
const books = ref([]);
const loading = ref(false);
const error = ref<string | null>(null);

const bookshelfStore = useBookshelfStore();

const fetchBooks = async () => {
  if (!searchQuery.value.trim()) return;
  loading.value = true;
  books.value = [];
  error.value = null;
  try {
    books.value = await searchBooks(searchQuery.value);
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

const addToBookshelf = (book: any) => {
  const bookData = {
    title: book.volumeInfo.title,
    author: book.volumeInfo.authors?.join(", "),
    coverImage: book.volumeInfo.imageLinks?.thumbnail,
  };
  bookshelfStore.teste(bookData);
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

.book-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease-in-out;
}

.book-title {
  font-size: 1rem;
  line-height: 1.2rem;
}

.book-author {
  font-size: 0.8rem;
  line-height: 1rem;
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

.add-to-bookshelf-button {
  transition: transform 0.3s ease-in-out;
}

.add-to-bookshelf-button:hover {
  transform: scale(1.1);
}
</style>
