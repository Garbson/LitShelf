<template>
  <div class="bookshelf-container fill-height d-flex justify-center">
    <v-card elevation="0" class="bg-transparent pa-4 rounded-xl" style="width: 90%">
      <h1 class="text-h3 font-weight-bold mb-8 text-center text-text bookshelf-title">
        <span class="title-highlight">📖 Detalhes do Livro</span>
      </h1>

      <v-card v-if="selectedBook" class="pa-4 book-card">
        <v-card-title class="text-h5 text-primary card-title">
          {{ selectedBook.title }}
        </v-card-title>
        <v-card-subtitle class="text-primary">
          <strong>Autor:</strong> {{ selectedBook.author }}
        </v-card-subtitle>
        <v-card-text>
          <p class="mb-2 text-primary">
            <strong>Gênero:</strong>
            <v-text-field
              v-model="selectedBook.genre"
              label="Gênero"
              variant="outlined"
              dense
              hide-details
              @blur="updateBookGenre"
            />
          </p>
          <p class="mb-2 text-primary">
            <strong>Número de Páginas:</strong> {{ selectedBook.pageCount }}
          </p>
          <p class="mb-4 text-primary">
            <strong>Descrição:</strong> {{ selectedBook.description }}
          </p>
        </v-card-text>

        <v-divider class="mb-4"></v-divider>

        <v-card-text>
          <h3 class="text-h6 mb-2 text-primary">Adicionar Frase Favorita:</h3>
          <v-text-field
            v-model="newQuote.text"
            label="Frase"
            variant="outlined"
            dense
            hide-details
            class="mb-2"
          />
          <v-text-field
            v-model="newQuote.page"
            label="Página (opcional)"
            variant="outlined"
            dense
            hide-details
            type="number"
            class="mb-4"
          />
          <v-btn @click="addQuote" color="primary">Adicionar Frase</v-btn>
        </v-card-text>

        <v-divider class="mb-4"></v-divider>

        <v-card-text>
          <h3 class="text-h6 mb-2 text-primary">Frases Favoritas:</h3>
          <v-list class="pa-0">
            <v-list-item
              v-for="(quote, index) in selectedBook.quotes"
              :key="index"
              class="pa-0"
            >
              <v-list-item-title class="text-text">{{ quote }}</v-list-item-title>
              <v-btn icon @click="removeQuote(index)" color="error">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="pa-0">
          <v-btn @click="deleteBook" color="error">Remover Livro</v-btn>
        </v-card-actions>
      </v-card>
      <div v-else class="text-text">
        <p>Carregando...</p>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { db } from "@/firebase";
import { doc, getDocs, query, setDoc, where, collection } from "firebase/firestore";

const route = useRoute();
const router = useRouter();
const bookshelfStore = useBookshelfStore();
const selectedBook = ref<any>(null);
const newQuote = ref({ text: "", page: null });

onMounted(async () => {
  const bookId = route.params.id as string;
  await bookshelfStore.fetchBookDetails(bookId);
  selectedBook.value = bookshelfStore.selectedBook;
});

const updateBookGenre = async () => {
  if (!bookshelfStore.user) return;
  try {
    const q = query(
      collection(db, `users/${bookshelfStore.user.uid}/books`),
      where("id", "==", selectedBook.value.id)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docRef = doc(
        db,
        `users/${bookshelfStore.user.uid}/books`,
        querySnapshot.docs[0].id
      );
      await setDoc(docRef, { genre: selectedBook.value.genre }, { merge: true });
      await bookshelfStore.fetchBooks();
    }
  } catch (err: any) {
    console.error("Erro ao atualizar gênero do livro:", err);
  }
};

const addQuote = async () => {
  if (!bookshelfStore.user || !selectedBook.value) return;
  try {
    const q = query(
      collection(db, `users/${bookshelfStore.user.uid}/books`),
      where("id", "==", selectedBook.value.id)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docRef = doc(
        db,
        `users/${bookshelfStore.user.uid}/books`,
        querySnapshot.docs[0].id
      );
      const updatedQuotes = [...selectedBook.value.quotes, newQuote.value.text];
      await setDoc(docRef, { quotes: updatedQuotes }, { merge: true });
      await bookshelfStore.fetchBooks();
      selectedBook.value.quotes = updatedQuotes;
      newQuote.value = { text: "", page: null };
    }
  } catch (err: any) {
    console.error("Erro ao adicionar frase:", err);
  }
};

const removeQuote = async (index: number) => {
  if (!bookshelfStore.user || !selectedBook.value) return;
  try {
    const q = query(
      collection(db, `users/${bookshelfStore.user.uid}/books`),
      where("id", "==", selectedBook.value.id)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docRef = doc(
        db,
        `users/${bookshelfStore.user.uid}/books`,
        querySnapshot.docs[0].id
      );
      const updatedQuotes = [...selectedBook.value.quotes];
      updatedQuotes.splice(index, 1);
      await setDoc(docRef, { quotes: updatedQuotes }, { merge: true });
      await bookshelfStore.fetchBooks();
      selectedBook.value.quotes = updatedQuotes;
    }
  } catch (err: any) {
    console.error("Erro ao remover frase:", err);
  }
};

const deleteBook = async () => {
  if (!bookshelfStore.user) return;
  try {
    await bookshelfStore.deleteBook(selectedBook.value.id);
    router.push("/bookshelf");
  } catch (err: any) {
    console.error("Erro ao deletar livro:", err);
  }
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

.card-title {
  font-weight: bold;
  margin-bottom: 1rem;
}
</style>
