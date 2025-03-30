<template>
  <v-container
    class="pa-4"
    :class="$vuetify.theme.global.name === 'light' ? 'bg-background' : 'bg-background'"
  >
    <h1
      class="text-h4 mb-4"
      :class="$vuetify.theme.global.name === 'light' ? 'text-primary' : 'text-text'"
    >
      Detalhes do Livro
    </h1>
    <p
      class="mb-6"
      :class="$vuetify.theme.global.name === 'light' ? 'text-secondary' : 'text-text'"
    >
      Aqui você pode ver os detalhes do livro selecionado.
    </p>

    <v-card
      v-if="selectedBook"
      class="pa-4"
      :class="$vuetify.theme.global.name === 'light' ? 'bg-surface' : 'bg-surface'"
    >
      <h2
        class="text-h5 mb-2"
        :class="$vuetify.theme.global.name === 'light' ? 'text-primary' : 'text-text'"
      >
        {{ selectedBook.title }}
      </h2>
      <p
        class="mb-2"
        :class="$vuetify.theme.global.name === 'light' ? 'text-secondary' : 'text-text'"
      >
        <strong>Autor:</strong> {{ selectedBook.author }}
      </p>
      <p
        class="mb-4"
        :class="$vuetify.theme.global.name === 'light' ? 'text-secondary' : 'text-text'"
      >
        <strong>Descrição:</strong> {{ selectedBook.description }}
      </p>

      <h3
        class="text-h6 mb-2"
        :class="$vuetify.theme.global.name === 'light' ? 'text-primary' : 'text-text'"
      >
        Frases Favoritas:
      </h3>
      <v-list class="pa-0">
        <v-list-item v-for="quote in selectedBook.quotes" :key="quote" class="pa-0">
          <v-list-item-title
            :class="$vuetify.theme.global.name === 'light' ? 'text-text' : 'text-text'"
          >
            {{ quote }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
    <div v-else class="text-text">
      <p>Carregando...</p>
    </div>
  </v-container>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useBookshelfStore } from "@/stores/useBookshelfStore";

const route = useRoute();
const bookshelfStore = useBookshelfStore();

onMounted(() => {
  const bookId = route.params.id as string;
  bookshelfStore.fetchBookDetails(bookId);
});
</script>

<style scoped>
/* Removendo todos os estilos customizados */
</style>
