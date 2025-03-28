<template>
  <v-container style="max-width: 80% !important" class="py-10">
    <v-card class="bg-primary rounded-xl pa-5">
      <h1 class="text-h4 font-weight-bold mb-8 text-center">📚 Minha Estante</h1>
      <v-row justify="center" align="start" dense>
        <v-col
          v-for="book in bookshelfStore.books"
          :key="book.id"
          cols="12"
          sm="6"
          md="4"
          class="d-flex justify-center"
        >
          <v-card class="ma-4 book-card" width="280" elevation="4">
            <v-img :src="book.coverImage" :alt="book.title" height="300" cover />
            <v-card-title class="text-subtitle-1 font-weight-bold">
              {{ book.title }}
            </v-card-title>
            <v-card-subtitle class="text-caption text-grey-darken-1">
              {{ book.author }}
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useBookshelfStore } from "@/stores/useBookshelfStore";

const bookshelfStore = useBookshelfStore();

onMounted(() => {
  bookshelfStore.fetchUser();
  bookshelfStore.fetchBooks();
});
</script>

<style scoped>
.book-card {
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

.book-card:hover {
  transform: scale(1.05) rotate(1deg);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}
</style>
