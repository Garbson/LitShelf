<template>
  <div class="bookshelf-container fill-height d-flex justify-center">
    <!-- O aviso destacado foi removido, mantendo apenas o título -->
    <v-card elevation="0" class="card-container pa-4 rounded-xl" style="width: 90%">
      <h1 class="text-h3 font-weight-bold mb-4 text-center bookshelf-title">
        <span class="page-title">
          <template v-if="friendInfo">
            📚 Estante de {{ friendInfo.name }}
          </template>
          <template v-else>
            📚 Minha Estante Digital
          </template>
        </span>
      </h1>

      <!-- Filtros e pesquisa -->
      <v-row class="mb-6 d-flex justify-center">
        <v-col cols="12" sm="6" md="4">
          <BaseTextField
            v-model="searchQuery"
            label="Pesquisar livros"
            prepend-inner-icon="mdi-magnify"
            class="search-field rounded-lg"
            clearable
            dense
            rounded="lg"
          />
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
      <v-row v-if="paginatedBooks.length" justify="center" align="start" dense>
        <v-col
          v-for="book in paginatedBooks"
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
            :class="{'reading-glow': book.status === 2 || book.status === '2'}"
          >
            <div class="book-cover-container">
              <v-img
                :src="book.cover_image_url || '/placeholder-book.png'"
                :alt="book.title"
                height="240"
                :cover="false"
                class="book-cover"
                style="object-fit: contain;"
              />
              
              <!-- Avaliação por estrelas se existir -->
              <div v-if="book.rating" class="rating-badge">
                <v-icon color="amber" size="small">mdi-star</v-icon>
                <span>{{ book.rating }}</span>
              </div>
            </div>

            <!-- Tag de status como v-chip abaixo da imagem -->
            <div class="status-container">
              <v-chip
                class="status-chip"
                :color="getStatusColor(book.status)"
                text-color="white"
                size="small"
              >
                <v-icon start size="small">{{ getStatusIcon(book.status) }}</v-icon>
                {{ getStatusLabel(book.status) }}
              </v-chip>
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

      <!-- Controles de paginação -->
      <div v-if="filteredBooks.length > booksPerPage" class="d-flex justify-center my-4">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="5"
          rounded="circle"
        ></v-pagination>
      </div>

      <!-- Mensagem de nenhum livro -->
      <v-card 
        v-else-if="!bookshelfStore.isLoading && !bookshelfStore.error && !friendId" 
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

      <!-- Mensagem de nenhum livro do amigo -->
      <v-card 
        v-else-if="!bookshelfStore.isLoading && !bookshelfStore.error && friendId && computedBooks.length === 0" 
        class="pa-8 text-center empty-bookshelf-card"
      >
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-bookshelf</v-icon>
        <p class="text-h6 mb-4">
          A estante deste amigo está vazia.
        </p>
        <v-btn 
          color="primary" 
          :to="'/friends'"
          prepend-icon="mdi-arrow-left"
          variant="elevated"
        >
          Voltar para Amigos
        </v-btn>
      </v-card>
      
      <!-- Card para nenhum resultado de filtro em estante de amigo -->
      <v-card 
        v-else-if="!bookshelfStore.isLoading && !bookshelfStore.error && friendId && filteredBooks.length === 0" 
        class="pa-8 text-center empty-bookshelf-card"
      >
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-filter-remove</v-icon>
        <p class="text-h6 mb-4">
          Nenhum livro do amigo corresponde aos critérios de busca.
        </p>
        <div class="d-flex gap-3 justify-center">
          <v-btn 
            color="secondary" 
            @click="resetFilters"
            prepend-icon="mdi-filter-remove-outline"
            variant="tonal"
          >
            Limpar Filtros
          </v-btn>
          <v-btn 
            color="primary" 
            :to="'/friends'"
            prepend-icon="mdi-arrow-left"
            variant="elevated"
          >
            Voltar para Amigos
          </v-btn>
        </div>
      </v-card>
    </v-card>

    <!-- Botão flutuante para voltar para a página de amigos quando estiver vendo estante de amigo -->
    <v-btn
      v-if="friendId"
      color="primary"
      :to="'/friends'"
      append-icon="mdi-arrow-right"
      size="large"
      class="back-to-friends-btn"
      variant="elevated"
    >
      Voltar para Amigos
    </v-btn>
    
    <!-- Botão destacado para voltar à própria estante quando estiver vendo estante de amigo -->
    <v-btn
      v-if="friendId"
      color="accent"
      @click="goToMyBookshelf"
      prepend-icon="mdi-bookshelf"
      size="large"
      class="my-bookshelf-btn"
      variant="elevated"
    >
      Ir para Minha Estante
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
import BaseTextField from '@/components/BaseTextField.vue';
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { useFriendsStore } from "@/stores/useFriendsStore";
import { supabase } from '@/supabase';
import { computed, onActivated, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const bookshelfStore = useBookshelfStore();
const friendsStore = useFriendsStore();
const router = useRouter();
const route = useRoute();
const searchQuery = ref("");
const selectedFilter = ref("all");
const sortOption = ref("title_asc");
const showSnackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");
const currentPage = ref(1);
const booksPerPage = 8;
const friendInfo = ref(null); // Informação do amigo
const friendId = computed(() => route.query.friendId as string || null);
const friendBooks = ref<any[]>([]);

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
  // Verificar se há status em cache no localStorage
  const bookStatusCache = JSON.parse(localStorage.getItem('bookStatuses') || '{}');
  
  return bookshelfStore.books.map((book, index) => {
    // Se houver um status em cache para este livro, usá-lo em vez do status do banco de dados
    if (bookStatusCache[book.id] !== undefined) {
      const cachedStatus = Number(bookStatusCache[book.id]);
      console.log(`Usando status em cache para o livro ${book.id}: ${cachedStatus}`);
      return reactive({ 
        ...book, 
        status: cachedStatus,
        isHovered: false, 
        index 
      });
    }
    return reactive({ ...book, isHovered: false, index });
  });
});

// Livros filtrados e ordenados
const filteredBooks = computed(() => {
  let result = [...computedBooks.value];
  
  // Aplicar filtro por status - corrigido para garantir comparação consistente
  if (selectedFilter.value !== "all") {
    result = result.filter(book => {
      // Converter ambos para número para garantir a comparação correta
      const bookStatus = typeof book.status === 'string' ? Number(book.status) : book.status;
      const filterStatus = Number(selectedFilter.value);
      return bookStatus === filterStatus;
    });
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

// Livros paginados
const paginatedBooks = computed(() => {
  const startIndex = (currentPage.value - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  return filteredBooks.value.slice(startIndex, endIndex);
});

// Total de páginas
const totalPages = computed(() => {
  return Math.ceil(filteredBooks.value.length / booksPerPage);
});

// Verificar se há mensagem de sucesso via query param (ex: após deletar livro)
watch(() => route.query.message, (newMessage) => {
  if (newMessage) {
    snackbarText.value = newMessage as string;
    snackbarColor.value = "success";
    showSnackbar.value = true;
    
    // Limpar a query param após mostrar a mensagem
    router.replace({ query: { friendId: friendId.value } });
  }
});

// Watcher para monitorar mudanças no friendId (quando a URL muda)
watch(friendId, async (newFriendId, oldFriendId) => {
  console.log(`friendId mudou de ${oldFriendId} para ${newFriendId}`);
  
  if (newFriendId) {
    // Estamos vendo a estante de um amigo
    await fetchFriendInfo(newFriendId);
    await loadFriendBooks(newFriendId);
  } else {
    // Voltamos para nossa própria estante
    friendInfo.value = null;
    await refreshBookshelf();
  }
}, { immediate: false }); // não disparar imediatamente, pois já tratamos no onMounted

// Resetar a página atual quando os filtros ou ordenação mudarem
watch([searchQuery, selectedFilter, sortOption], () => {
  currentPage.value = 1;
});

// Recarregar livros ao montar o componente
onMounted(async () => {
  // Em vez de tentar modificar books diretamente, usamos o método do store projetado para isso
  bookshelfStore.setViewingFriend(null); // Isso reseta o store para o modo de estante pessoal
  
  console.log("BookshelfView montado - verificando se é uma estante de amigo...");
  
  // Se houver um friendId no parâmetro da URL, buscar APENAS informações do amigo e seus livros
  if (friendId.value) {
    console.log("É uma estante de amigo, carregando apenas dados do amigo:", friendId.value);
    await fetchFriendInfo(friendId.value);
    await loadFriendBooks(friendId.value);
  } else {
    // Caso contrário, buscar APENAS os próprios livros
    console.log("É a estante pessoal, carregando apenas livros pessoais");
    await refreshBookshelf();
  }
});

// Adicionar onActivated para garantir que os dados sejam atualizados 
// quando o usuário retorna à página da estante
onActivated(() => {
  console.log("BookshelfView ativado - verificando se deve recarregar livros...");
  // Só recarrega os livros pessoais se não estiver visualizando a estante de um amigo
  if (!friendId.value) {
    console.log("Recarregando estante pessoal...");
    refreshBookshelf();
  } else {
    console.log("Mantendo a visualização da estante do amigo:", friendId.value);
    // Se for uma estante de amigo, garantir que não seja sobreposta
    loadFriendBooks(friendId.value);
  }
});

const goToBookDetails = (bookId: string) => {
  // Se estivermos vendo a estante de um amigo, incluir o friendId na navegação
  if (friendId.value) {
    router.push(`/book/${bookId}?friendId=${friendId.value}`);
  } else {
    router.push(`/book/${bookId}`);
  }
};

// Método para atualizar a estante com os status mais recentes
const refreshBookshelf = async () => {
  console.log("Atualizando estante com status mais recentes...");
  
  // Buscar os livros do servidor
  await bookshelfStore.fetchBooks();
  
  // Forçar a reavaliação do computed 'computedBooks'
  // mesmo que os dados do servidor não tenham mudado
  // isso garantirá que os status em cache sejam aplicados
  const tempVar = ref(0);
  tempVar.value++;
  
  // Atualizar o status na store diretamente baseado no cache
  const bookStatusCache = JSON.parse(localStorage.getItem('bookStatuses') || '{}');
  
  // Para cada livro na store, verificar se há um status em cache
  bookshelfStore.books.forEach(book => {
    if (bookStatusCache[book.id] !== undefined) {
      const cachedStatus = Number(bookStatusCache[book.id]);
      // Se o status em cache for diferente do status na store, atualizá-lo
      if (Number(book.status) !== cachedStatus) {
        console.log(`Atualizando status do livro ${book.id} na store: ${book.status} -> ${cachedStatus}`);
        book.status = cachedStatus;
      }
    }
  });
};

// Carrega os livros do amigo
async function loadFriendBooks(id: string) {
  try {
    console.log('Buscando livros do amigo com ID:', id);
    bookshelfStore.isLoading = true;
    bookshelfStore.error = '';
    
    // Obter o usuário logado atual
    const userSession = await supabase.auth.getSession();
    const currentUserId = userSession.data.session?.user.id;
    
    if (!currentUserId) {
      throw new Error('Usuário não autenticado');
    }
    
    console.log('ID do usuário atual:', currentUserId);
    
    // Usar o novo método específico para carregar livros de amigos
    await bookshelfStore.fetchFriendBooks(id);
    console.log('Livros do amigo carregados via store específico');

  } catch (err) {
    console.error('Erro ao carregar livros do amigo:', err);
    bookshelfStore.error = 'Erro ao carregar livros do amigo.';
  } finally {
    bookshelfStore.isLoading = false;
  }
}

// Busca informações do amigo
async function fetchFriendInfo(id: string) {
  try {
    const { data, error } = await supabase
      .from('available_users')
      .select('id, name, email, avatar_url')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    if (data) {
      friendInfo.value = data;
    }
  } catch (err) {
    console.error('Erro ao buscar informações do amigo:', err);
    bookshelfStore.error = 'Não foi possível carregar informações do amigo.';
  }
}

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

// Função para resetar todos os filtros
const resetFilters = () => {
  searchQuery.value = "";
  selectedFilter.value = "all";
  sortOption.value = "title_asc";
  currentPage.value = 1;
};

// Função para voltar à própria estante
const goToMyBookshelf = async () => {
  console.log("Navegando para minha estante...");
  friendInfo.value = null;
  
  // Limpar o estado do store para garantir que não há mais referência aos livros do amigo
  bookshelfStore.setViewingFriend(null);
  friendBooks.value = []; // Limpar o array local também
  
  // Forçar uma nova consulta para carregar apenas os livros do usuário atual
  console.log("Recarregando meus livros...");
  await bookshelfStore.fetchBooks();
  
  // Navegar para a página da estante sem parâmetros de consulta
  router.push('/bookshelf');
  
  // Mostrar confirmação para o usuário
  snackbarText.value = "Voltando para sua estante";
  snackbarColor.value = "info";
  showSnackbar.value = true;
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
  width: 280px !important;
  max-width: 280px;
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

/* Tag de status estilizada como v-chip */
.status-chip {
  font-weight: 500;
  letter-spacing: 0.5px;
  font-size: 0.85rem;
}

.status-container {
  display: flex;
  justify-content: center;
  margin-top: 8px;
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

.floating-btn-container {
  display: none;
}

.search-field, 
.filter-field, 
.sort-field {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  width: 280px;
  max-width: 100%;
  margin: 0 auto;
}

.empty-bookshelf-card {
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

.friend-alert {
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
}

.back-to-friends-btn {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
}

.my-bookshelf-btn {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 1000;
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
