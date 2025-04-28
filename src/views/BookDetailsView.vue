<template>
  <div class="bookshelf-container fill-height d-flex justify-center">
    <v-card elevation="0" class="card-container pa-4 rounded-xl" style="width: 90%">
      <h1 class="text-h3 font-weight-bold mb-6 text-center bookshelf-title">
        <span class="page-title">📖 Detalhes do Livro</span>
        <span v-if="friendId" class="text-subtitle-1 ml-2">(Estante de {{friendName}})</span>
      </h1>

      <!-- Spinner de carregamento -->
      <div v-if="!selectedBook" class="d-flex justify-center align-center flex-column">
        <v-progress-circular indeterminate color="accent" size="64" class="mb-4"></v-progress-circular>
        <p>Carregando detalhes do livro...</p>
      </div>

      <v-card v-else class="book-card animate-fade-in" elevation="3">
        <!-- Header do Livro com capa, título, autor e avaliação -->
        <div class="book-header d-flex flex-column flex-md-row pa-6">
          <div class="book-image-container me-md-8 mb-6 mb-md-0 d-flex flex-column align-center">
            <v-img
              :src="selectedBook.cover_image_url || '/placeholder-book.png'"
              :alt="selectedBook.title"
              width="200"
              height="300"
              cover
              class="rounded-lg book-cover"
              :class="{'book-shadow-effect': selectedBook.status === 2}"
            />
            
          </div>

          <div class="book-header-info flex-grow-1">
            <v-card-title class="text-h3 card-title text-md-h4 pa-0 text-serif mb-2">
              {{ selectedBook.title }}
            </v-card-title>
            
            <v-card-subtitle class="text-subtitle-1 pa-0 mb-4">
              <strong>Autor:</strong> {{ selectedBook.author }}
            </v-card-subtitle>
            
            <!-- Sistema de avaliação - sem o card -->
            <div class="mb-6" v-if="!friendId">
              <h3 class="mb-1 text-body-1">Sua avaliação</h3>
              <div class="d-flex align-center">
                <v-rating
                  v-model="bookRating"
                  color="amber"
                  hover
                  half-increments
                  :size="57"
                  @update:model-value="updateBookRating"
                ></v-rating>
                <span class="ms-3 text-subtitle-1" v-if="bookRating > 0">{{ bookRating }} de 5 estrelas</span>
              </div>
            </div>

            <div class="mb-6" v-else>
              <h3 class="mb-1 text-body-1">Avaliação de {{friendName}}</h3>
              <div class="d-flex align-center">
                <v-rating
                  v-model="bookRating"
                  color="amber"
                  :readonly="true"
                  half-increments
                  :size="20"
                ></v-rating>
                <span class="ms-3 text-subtitle-1" v-if="bookRating > 0">{{ bookRating }} de 5 estrelas</span>
              </div>
            </div>
            
            <!-- Espaçamento adicionado entre os botões -->
            <div class="d-flex flex-wrap gap-4">
              <template v-if="!friendId">
                <v-btn 
                  color="primary" 
                  variant="tonal" 
                  class="mr-2"
                  prepend-icon="mdi-heart" 
                >
                  Favoritar
                </v-btn>
                <v-btn 
                  color="secondary" 
                  variant="tonal" 
                  class="mr-2"
                  prepend-icon="mdi-share" 
                  @click="showRecommendDialog = true"
                >
                  Recomendar
                </v-btn>
              </template>
              <v-btn 
                :to="friendId ? { path: '/bookshelf', query: { friendId } } : '/bookshelf'"
                prepend-icon="mdi-bookshelf"
                variant="outlined"
              >
                Voltar para Estante
              </v-btn>
            </div>
          </div>
        </div>

        <v-divider></v-divider>

        <!-- Conteúdo principal -->
        <v-row class="pa-6">
          <!-- Coluna esquerda - Informações do livro -->
          <v-col cols="12" md="4">
            <h3 class="text-h5 mb-4 text-serif">
              <v-icon icon="mdi-book-information-variant" color="primary" class="mr-2"></v-icon>
              Informações
            </h3>
            
            <v-card class="mb-4 info-card pa-4" variant="outlined">
              <!-- Status de leitura select -->
              <div class="mb-4">
                <p class="font-weight-medium mb-1">Status de Leitura</p>
                <v-select
                  v-if="!friendId"
                  v-model="selectedBook.status"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  @update:model-value="updateReadingStatus"
                  class="status-select"
                >
                  <template v-slot:selection="{ item }">
                    <v-icon :color="getStatusColor(item.raw.value)" class="mr-2">{{ item.raw.icon }}</v-icon>
                    {{ item.raw.label }}
                  </template>
                  <template v-slot:item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon :color="getStatusColor(item.raw.value)">{{ item.raw.icon }}</v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
                <div v-else class="d-flex align-center">
                  <v-icon :color="getStatusColor(selectedBook.status)" class="mr-2">{{ getStatusIcon(selectedBook.status) }}</v-icon>
                  {{ getStatusLabel(selectedBook.status) }}
                </div>
              </div>

              <!-- Datas de leitura -->
              <div v-if="selectedBook.status !== 0" class="reading-date mb-4">
                <!-- Status "Estou Lendo" -->
                <template v-if="selectedBook.status === 2">
                  <p class="font-weight-medium mb-1">{{ friendId ? `${friendName} começou a ler em` : 'Começou a ler em' }}</p>
                  <BaseTextField
                    v-if="!friendId"
                    v-model="startDateFormatted"
                    type="date"
                    density="compact"
                    @update:model-value="updateStartDate"
                  />
                  <p v-else>{{ startDateFormatted || 'Não informado' }}</p>
                </template>
                
                <!-- Status "Já Li" - Mostrar tanto data de início quanto data de conclusão -->
                <template v-else-if="selectedBook.status === 1">
                  <p class="font-weight-medium mb-1">{{ friendId ? `${friendName} começou a ler em` : 'Começou a ler em' }}</p>
                  <BaseTextField
                    v-if="!friendId"
                    v-model="startDateFormatted"
                    type="date"
                    density="compact"
                    class="mb-3"
                    @update:model-value="updateStartDate"
                  />
                  <p v-else class="mb-3">{{ startDateFormatted || 'Não informado' }}</p>
                  
                  <p class="font-weight-medium mb-1">{{ friendId ? `${friendName} concluiu a leitura em` : 'Leitura concluída em' }}</p>
                  <BaseTextField
                    v-if="!friendId"
                    v-model="endDateFormatted"
                    type="date"
                    density="compact"
                    @update:model-value="updateEndDate"
                  />
                  <p v-else>{{ endDateFormatted || 'Não informado' }}</p>
                </template>
              </div>
              
              <p class="font-weight-medium mb-1">Gênero</p>
              <BaseTextField
                v-if="!friendId"
                v-model="selectedBook.genre"
                density="compact"
                @blur="updateBookGenre"
                class="mb-4"
              />
              <p v-else class="mb-4">{{ selectedBook.genre || 'Não informado' }}</p>
              
              <p class="font-weight-medium mb-1">Número de Páginas</p>
              <p class="mb-4">{{ selectedBook.pageCount || 'Não informado' }}</p>
              
              <v-btn 
                v-if="!friendId"
                color="error" 
                block
                prepend-icon="mdi-delete"
                @click="confirmDeleteBook = true"
                variant="flat"
                class="mt-4"
              >
                Remover Livro
              </v-btn>
            </v-card>
          </v-col>
          
          <!-- Coluna direita - Descrição e frases -->
          <v-col cols="12" md="8">
            <!-- Descrição do livro -->
            <h3 class="text-h5 mb-4 text-serif">
              <v-icon icon="mdi-text-box" color="primary" class="mr-2"></v-icon>
              Descrição
            </h3>
            <v-card class="mb-6 pa-4 description-card" variant="outlined">
              <div v-if="selectedBook.description" class="text-body-1 description-text">
                {{ selectedBook.description }}
              </div>
              <div v-else class="text-body-1 no-description-text">
                <v-icon class="mr-2" color="grey-lighten-1">mdi-information-outline</v-icon>
                Este livro não possui descrição disponível.
              </div>
            </v-card>
            
            <!-- Seção de frases favoritas - modificado para aparecer com o status correto -->
            <div v-if="showQuotesSection || friendId">
              <h3 class="text-h5 mb-4 mt-6 text-serif">
                <v-icon icon="mdi-format-quote-close" color="accent" class="mr-2"></v-icon>
                Frases Favoritas {{ friendId ? 'de ' + friendName : '' }}
              </h3>
              
              <!-- Barra de pesquisa de frases e botão para adicionar nova frase -->
              <div v-if="!friendId" class="d-flex align-center mb-4">
                <BaseTextField
                  v-model="quoteSearchQuery"
                  label="Pesquisar frases"
                  density="comfortable"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  class="flex-grow-1"
                />
                
                <v-btn
                  class="ml-2 mb-4"
                  color="primary"
                  icon
                  variant="elevated"
                  @click="showQuoteDialog = true"
                >
                  <v-icon>mdi-plus</v-icon>
                  <v-tooltip activator="parent" location="top">Adicionar frase</v-tooltip>
                </v-btn>
              </div>

              <div v-else class="d-flex align-center mb-4">
                <BaseTextField
                  v-model="quoteSearchQuery"
                  label="Pesquisar frases"
                  density="comfortable"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  class="flex-grow-1"
                />
              </div>
              
              <!-- Lista de frases filtradas e paginadas -->
              <div class="quotes-list">
                <v-card 
                  v-for="(quote, index) in paginatedAndFilteredQuotes" 
                  :key="index"
                  class="mb-4 quote-card"
                  variant="outlined"
                  elevation="1"
                >
                  <v-card-text>
                    <!-- Modo de edição -->
                    <template v-if="editingIndex === getPaginationIndex(index) && !friendId">
                      <BaseTextField
                        v-model="editingQuote.text"
                        label="Editar Frase"
                        density="compact"
                        class="mb-2"
                      />
                      
                      <BaseTextField
                        v-model="editingQuote.page"
                        label="Editar Página (opcional)"
                        density="compact"
                        type="number"
                        class="mb-3"
                      />
                      
                      <div class="d-flex gap-2 justify-end">
                        <v-btn @click="saveQuoteEdit(getPaginationIndex(index))" color="success" size="small" class="mr-2" variant="tonal">Salvar</v-btn>
                        <v-btn @click="cancelEdit" color="error" size="small" variant="tonal">Cancelar</v-btn>
                      </div>
                    </template>
                    
                    <!-- Modo de visualização -->
                    <template v-else>
                      <div class="quote-text">
                        <span class="quote-mark">"</span>
                        {{ quote.text }}
                        <span class="quote-mark">"</span>
                        
                        <span v-if="quote.page" 
                              class="text-caption page-reference">
                          (Página {{ quote.page }})
                        </span>
                      </div>
                      
                      <div v-if="!friendId" class="d-flex mt-3 justify-end gap-2">
                        <v-btn 
                          @click="startEdit(getPaginationIndex(index), quote.text)" 
                          color="primary" 
                          size="small"
                          variant="tonal"
                          icon
                          class="mr-2"
                        >
                          <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                        
                        <v-btn 
                          @click="confirmRemoveQuote(getPaginationIndex(index))" 
                          color="error" 
                          size="small"
                          variant="tonal"
                          icon
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </div>
                    </template>
                  </v-card-text>
                </v-card>
                
                <!-- Mensagem quando não há frases -->
                <p v-if="!filteredQuotes.length" class="text-center pa-4">
                  {{ quoteSearchQuery ? 'Nenhuma frase corresponde à sua pesquisa.' : friendId ? `${friendName} ainda não adicionou frases favoritas.` : 'Nenhuma frase favorita adicionada ainda.' }}
                </p>
                
                <!-- Paginação -->
                <div v-if="filteredQuotes.length > quotesPerPage" class="d-flex justify-center mt-4">
                  <v-pagination
                    v-model="quotesPage"
                    :length="Math.ceil(filteredQuotes.length / quotesPerPage)"
                    rounded="circle"
                    :total-visible="5"
                  ></v-pagination>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </v-card>
    
    <!-- Diálogos de confirmação e outros componentes -->
    <v-dialog v-model="confirmDeleteBook" max-width="500px" transition="dialog-bottom-transition">
      <v-card class="delete-dialog">
        <v-card-title class="bg-error text-white pa-4 text-h5">Confirmar exclusão</v-card-title>
        <v-card-text class="pa-4">
          <p class="mb-2">Tem certeza que deseja remover <strong>{{ selectedBook?.title }}</strong> da sua estante?</p>
          <p class="text-body-2">Esta ação não pode ser desfeita.</p>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="confirmDeleteBook = false">Cancelar</v-btn>
          <v-btn color="error" @click="deleteBookConfirmed">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <v-dialog v-model="confirmDeleteQuote" max-width="500px">
      <v-card>
        <v-card-title class="bg-error text-white pa-4">Confirmar exclusão</v-card-title>
        <v-card-text class="pa-4">
          <p>Tem certeza que deseja remover esta frase favorita?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="confirmDeleteQuote = false">Cancelar</v-btn>
          <v-btn color="error" @click="removeQuoteConfirmed">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de recomendação -->
    <BookRecommendationDialog 
      v-model="showRecommendDialog" 
      :book="selectedBook" 
      @recommended="onRecommendationSent"
    />

    <!-- Diálogo para adicionar frase favorita -->
    <v-dialog v-model="showQuoteDialog" max-width="500px">
      <v-card class="pa-4">
        <v-card-title class="text-h5 mb-3">
          <v-icon color="accent" class="mr-2">mdi-format-quote-close</v-icon>
          Adicionar Frase Favorita
        </v-card-title>
        
        <v-card-text>
          <BaseTextField
            v-model="newQuote.text"
            label="Digite uma frase favorita"
            density="comfortable"
            class="mb-4"
            autofocus
          />
          
          <BaseTextField
            v-model="newQuote.page"
            label="Página (opcional)"
            density="comfortable"
            type="number"
            class="mb-4"
          />
        </v-card-text>
        
        <v-card-actions class="justify-end">
          <v-btn color="default" variant="text" @click="showQuoteDialog = false">
            Cancelar
          </v-btn>
          <v-btn 
            color="primary" 
            variant="elevated"
            :disabled="!newQuote.text"
            @click="addQuoteFromDialog"
          >
            Adicionar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import BookRecommendationDialog from '@/components/BookRecommendationDialog.vue';
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { useFriendsStore } from "@/stores/useFriendsStore";
import { supabase } from "@/supabase";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const bookshelfStore = useBookshelfStore();
const friendsStore = useFriendsStore();
const selectedBook = ref<any>(null);
const newQuote = ref({ text: "", page: null });
const editingIndex = ref(-1);
const editingQuote = ref({ text: "", page: null });
const confirmDeleteBook = ref(false);
const confirmDeleteQuote = ref(false);
const quoteToDeleteIndex = ref(-1);
const showSnackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");
const bookRating = ref(0);
const showRecommendDialog = ref(false);
const quoteSearchQuery = ref("");
const quotesPage = ref(1);
const quotesPerPage = 3;
const showQuoteDialog = ref(false);
const friendId = computed(() => route.query.friendId as string);
const friendName = ref("");

// Formatação de datas para exibição e armazenamento
const formatDateForDisplay = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toISOString().split('T')[0]; // Formato YYYY-MM-DD para input date
};

const formatDateForStorage = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`; // Formato DD/MM/YYYY
};

// Converter data DD/MM/YYYY para objeto Date
const parseFormattedDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
};

const startDateFormatted = computed({
  get: () => {
    if (selectedBook.value?.dataInicioLeitura) {
      // Se já temos uma data no formato DD/MM/YYYY, precisamos convertê-la para YYYY-MM-DD para o input
      const parsedDate = parseFormattedDate(selectedBook.value.dataInicioLeitura);
      return parsedDate ? formatDateForDisplay(parsedDate) : '';
    }
    return '';
  },
  set: (value) => {
    if (selectedBook.value && value) {
      // Convertemos para o formato DD/MM/YYYY antes de salvar
      const date = new Date(value);
      selectedBook.value.dataInicioLeitura = formatDateForStorage(date);
    } else if (selectedBook.value) {
      selectedBook.value.dataInicioLeitura = '';
    }
  }
});

const endDateFormatted = computed({
  get: () => {
    if (selectedBook.value?.dataFinalLeitura) {
      // Se já temos uma data no formato DD/MM/YYYY, precisamos convertê-la para YYYY-MM-DD para o input
      const parsedDate = parseFormattedDate(selectedBook.value.dataFinalLeitura);
      return parsedDate ? formatDateForDisplay(parsedDate) : '';
    }
    return '';
  },
  set: (value) => {
    if (selectedBook.value && value) {
      // Convertemos para o formato DD/MM/YYYY antes de salvar
      const date = new Date(value);
      selectedBook.value.dataFinalLeitura = formatDateForStorage(date);
    } else if (selectedBook.value) {
      selectedBook.value.dataFinalLeitura = '';
    }
  }
});

// Opções de status de leitura
const statusOptions = [
  { label: "Quero Ler", value: 0, color: "grey", icon: "mdi-bookmark-outline" },
  { label: "Já Li", value: 1, color: "success", icon: "mdi-check-circle" },
  { label: "Estou Lendo", value: 2, color: "info", icon: "mdi-book-open-variant" },
];

// Status de leitura atual
const readingStatus = computed(() => {
  const status = selectedBook.value?.status ?? 0;
  const option = statusOptions.find(o => o.value === Number(status)) || statusOptions[0];
  return {
    label: option.label,
    color: option.color
  };
});

// Computed para renderização condicional da seção de frases favoritas
const showQuotesSection = computed(() => {
  return Number(selectedBook.value?.status) === 2 || Number(selectedBook.value?.status) === 1;
});

// Computed para frases filtradas
const filteredQuotes = computed(() => {
  if (!selectedBook.value?.quotes) return [];
  return selectedBook.value.quotes
    .map((text, index) => ({ text, page: selectedBook.value.quotePages[index] }))
    .filter(quote => quote.text.toLowerCase().includes(quoteSearchQuery.value.toLowerCase()));
});

// Computed para frases paginadas
const paginatedAndFilteredQuotes = computed(() => {
  const start = (quotesPage.value - 1) * quotesPerPage;
  const end = start + quotesPerPage;
  return filteredQuotes.value.slice(start, end);
});

// Watch para manter o status persistente e atualizar o banco quando necessário
watch(
  () => selectedBook.value?.status, 
  (newStatus, oldStatus) => {
    if (newStatus !== undefined && selectedBook.value && !friendId.value) {
      console.log(`Status do livro alterado de ${oldStatus} para ${newStatus}`);
      
      // Salvar o status no localStorage imediatamente
      const bookStatusCache = JSON.parse(localStorage.getItem('bookStatuses') || '{}');
      bookStatusCache[selectedBook.value.id] = Number(newStatus);
      localStorage.setItem('bookStatuses', JSON.stringify(bookStatusCache));
      
      // Garantir que o banco de dados seja atualizado
      if (oldStatus !== newStatus) {
        const numericStatus = Number(newStatus);
        updateReadingStatus(numericStatus);
        
        // Também atualize diretamente na lista global de livros no store
        const bookInList = bookshelfStore.books.find(b => b.id === selectedBook.value?.id);
        if (bookInList) {
          console.log(`Atualizando status no livro da lista global: ${bookInList.id} para ${numericStatus}`);
          bookInList.status = numericStatus;
        }
      }
    }
  },
  { immediate: true }
);

// Carrega o livro quando o componente é montado
onMounted(async () => {
  let bookId = route.params.id as string;
  
  // Se não temos um ID na rota, tenta recuperar do localStorage
  if (!bookId) {
    bookId = localStorage.getItem('lastViewedBookId') || '';
    
    // Se encontramos um ID no localStorage, atualiza a URL sem recarregar
    if (bookId) {
      router.replace(`/book/${bookId}`);
    } else {
      // Se não encontrarmos nenhum ID, redireciona para a estante
      router.push('/bookshelf');
      return;
    }
  }
  
  // Salva o ID atual no localStorage
  localStorage.setItem('lastViewedBookId', bookId);
  
  // Obtém o friendId da query (não dos parâmetros da rota)
  const friendIdFromQuery = route.query.friendId as string;
  
  // Verifica se estamos visualizando um livro de um amigo
  if (friendIdFromQuery) {
    try {
      console.log(`Carregando livro ${bookId} do amigo ${friendIdFromQuery}`);
      
      // Busca informações do amigo
      // Verificar se já temos os amigos carregados, se não, carregar
      if (friendsStore.friends.length === 0) {
        console.log("Carregando lista de amigos para obter informações do amigo");
        await friendsStore.fetchFriends();
      }
      
      // Buscar o amigo na lista de amigos
      const friend = friendsStore.friends.find(f => f.id === friendIdFromQuery);
      
      // Se não encontrou o amigo na lista, tentar buscar diretamente do banco
      if (!friend) {
        console.log("Amigo não encontrado na lista de amigos, buscando diretamente");
        try {
          // Buscar informações do amigo diretamente do banco
          const { data, error } = await supabase
            .from('available_users')
            .select('id, name, email, avatar_url')
            .eq('id', friendIdFromQuery)
            .single();
            
          if (error) {
            throw error;
          }
          
          if (data) {
            friendName.value = data.name || data.email || 'Amigo';
          }
        } catch (err) {
          console.error("Erro ao buscar informações do amigo diretamente:", err);
        }
      } else {
        // Se encontrou o amigo na lista, usar as informações
        friendName.value = friend.name || friend.email || 'Amigo';
      }
      
      // Usar o novo método específico para carregar detalhes do livro do amigo
      await bookshelfStore.fetchFriendBookDetails(bookId, friendIdFromQuery);
      selectedBook.value = bookshelfStore.selectedBook;

      if (selectedBook.value) {
        // Buscar as citações/frases favoritas do livro do amigo
        // Usando a view friend_quotes_view quando for livro de amigo
        const { data: quotes, error: quotesError } = await supabase
          .from('friend_quotes_view')
          .select('*')
          .eq('book_id', bookId)
          .eq('user_id', friendIdFromQuery);
        
        // Fallback para consulta direta caso a view não retorne resultados
        if (quotesError || !quotes || quotes.length === 0) {
          console.log('Fallback: Buscando citações diretamente da tabela quotes');
          const { data: directQuotes, error: directError } = await supabase
            .from('quotes')
            .select('*')
            .eq('book_id', bookId)
            .eq('user_id', friendIdFromQuery);
          
          if (!directError && directQuotes) {
            quotes = directQuotes;
            quotesError = null;
          }
        }
        
        // Preparar arrays de citações e páginas
        const quoteTexts: string[] = []
        const quotePages: (number | null)[] = []
        
        if (quotes && Array.isArray(quotes)) {
          quotes.forEach(quote => {
            quoteTexts.push(quote.text)
            quotePages.push(quote.page)
          })
        }
        
        // Adicionar as citações ao selectedBook
        if (quoteTexts.length > 0) {
          selectedBook.value.quotes = quoteTexts;
          selectedBook.value.quotePages = quotePages;
          selectedBook.value.quotesData = quotes;
        } else {
          selectedBook.value.quotes = [];
          selectedBook.value.quotePages = [];
          selectedBook.value.quotesData = [];
        }
      }

      // Carregando a avaliação
      if (selectedBook.value?.rating) {
        bookRating.value = Number(selectedBook.value.rating);
      } else if (selectedBook.value?.avaliacao) {
        bookRating.value = Number(selectedBook.value.avaliacao);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do livro do amigo:", error);
      showNotification("Erro ao carregar detalhes do livro do amigo", "error");
      router.push('/bookshelf');
    }
  } else {
    // Verifica se temos um status em cache para este livro
    const bookStatusCache = JSON.parse(localStorage.getItem('bookStatuses') || '{}');
    const cachedStatus = bookStatusCache[bookId];
    
    console.log("Cache de status para o livro:", bookId, "Status:", cachedStatus);
    
    // Carrega o livro
    try {
      // Garantir que não estamos mais no modo de visualização de amigo
      bookshelfStore.setViewingFriend(null);
      
      await bookshelfStore.fetchBookDetails(bookId);
      selectedBook.value = bookshelfStore.selectedBook;
      
      // Se temos um status em cache e ele é diferente do status que veio do banco
      // vamos atualizá-lo para manter consistência
      if (cachedStatus !== undefined && 
          selectedBook.value && 
          Number(selectedBook.value.status) !== Number(cachedStatus)) {
        console.log(`Atualizando status do livro de ${selectedBook.value.status} para ${cachedStatus} baseado no cache.`);
        selectedBook.value.status = Number(cachedStatus);
      }
      
      // Carregando a avaliação, considerando os campos 'rating' ou 'avaliacao'
      if (selectedBook.value?.rating) {
        bookRating.value = Number(selectedBook.value.rating);
      } else if (selectedBook.value?.avaliacao) {
        bookRating.value = Number(selectedBook.value.avaliacao);
        // Mantemos a retrocompatibilidade preenchendo o campo rating se só existir avaliacao
        selectedBook.value.rating = selectedBook.value.avaliacao;
      }
      
      // Definindo um status padrão se não houver
      if (selectedBook.value && (selectedBook.value.status === undefined || selectedBook.value.status === null)) {
        selectedBook.value.status = 0; // Quero ler
      }
      
      // Se não conseguimos carregar o livro, redireciona para a estante
      if (!selectedBook.value) {
        router.push('/bookshelf');
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do livro:", error);
      showNotification("Erro ao carregar detalhes do livro", "error");
      router.push('/bookshelf');
    }
  }
});

// Retorna a cor baseada no status de leitura
const getStatusColor = (status: string | number): string => {
  const statusNum = Number(status);
  const option = statusOptions.find(o => o.value === statusNum);
  return option ? option.color : 'grey';
};

// Retorna o ícone do status
const getStatusIcon = (status: string | number): string => {
  const statusNum = Number(status);
  const option = statusOptions.find(o => o.value === statusNum);
  return option ? option.icon : 'mdi-bookmark-outline';
};

// Retorna o texto do status
const getStatusLabel = (status: string | number): string => {
  const statusNum = Number(status);
  const option = statusOptions.find(o => o.value === statusNum);
  return option ? option.label : 'Quero Ler';
};

// Atualiza o gênero do livro
const updateBookGenre = async () => {
  if (!selectedBook.value) return;
  
  try {
    await bookshelfStore.updateBook(selectedBook.value.id, { genre: selectedBook.value.genre });
    await bookshelfStore.fetchBooks();
    showNotification("Gênero atualizado com sucesso!", "success");
  } catch (err: any) {
    console.error("Erro ao atualizar gênero:", err);
    showNotification("Erro ao atualizar gênero", "error");
  }
};

// Atualiza a avaliação do livro
const updateBookRating = async (rating: number) => {
  if (!selectedBook.value) return;
  
  try {
    await bookshelfStore.updateBook(selectedBook.value.id, { 
      rating,
      avaliacao: rating
    });
    selectedBook.value.rating = rating;
    selectedBook.value.avaliacao = rating;
    showNotification("Avaliação atualizada!", "success");
  } catch (err: any) {
    console.error("Erro ao atualizar avaliação:", err);
    showNotification("Erro ao atualizar avaliação", "error");
  }
};

// Atualiza o status de leitura
const updateReadingStatus = async (status: number) => {
  console.log("⭐ updateReadingStatus chamado com status:", status);
  console.log("⭐ selectedBook:", selectedBook.value);
  
  if (!selectedBook.value) {
    console.error("Erro: selectedBook.value é null ou undefined");
    showNotification("Erro: Livro não encontrado", "error");
    return;
  }
  
  try {
    console.log("⭐ Tentando atualizar status do livro:", selectedBook.value.id);
    const today = new Date();
    
    // Importante: usar os nomes corretos das colunas do banco de dados
    const updateData: any = { status };
    
    if (status === 2 && !selectedBook.value.started_reading_at) {
      updateData.started_reading_at = new Date().toISOString();
      // Manter a propriedade local para UI
      selectedBook.value.dataInicioLeitura = formatDateForStorage(today);
    }
    
    if (status === 1) {
      if (!selectedBook.value.finished_reading_at) {
        updateData.finished_reading_at = new Date().toISOString();
        // Manter a propriedade local para UI
        selectedBook.value.dataFinalLeitura = formatDateForStorage(today);
      }
      
      if (!selectedBook.value.started_reading_at) {
        const startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        updateData.started_reading_at = startDate.toISOString();
        // Manter a propriedade local para UI
        selectedBook.value.dataInicioLeitura = formatDateForStorage(startDate);
      }
    }
    
    console.log("⭐ updateData final a ser enviado:", updateData);
    console.log("⭐ ID do livro:", selectedBook.value.id);
    
    await bookshelfStore.updateBook(selectedBook.value.id, updateData);
    
    // Também atualizar na lista global de livros
    const bookInList = bookshelfStore.books.find(b => b.id === selectedBook.value?.id);
    if (bookInList) {
      console.log("⭐ Atualizando status no livro da lista global:", bookInList.id);
      bookInList.status = status;
      if (updateData.started_reading_at) bookInList.started_reading_at = updateData.started_reading_at;
      if (updateData.finished_reading_at) bookInList.finished_reading_at = updateData.finished_reading_at;
    }
    
    // Atualizar o status no localStorage para garantir persistência entre navegações
    const bookStatusCache = JSON.parse(localStorage.getItem('bookStatuses') || '{}');
    bookStatusCache[selectedBook.value.id] = status;
    localStorage.setItem('bookStatuses', JSON.stringify(bookStatusCache));
    
    const statusLabel = statusOptions.find(o => o.value === status)?.label;
    showNotification(`Status atualizado para "${statusLabel}"`, "success");
  } catch (err: any) {
    console.error("Erro ao atualizar status:", err);
    showNotification("Erro ao atualizar status", "error");
  }
};

// Atualiza a data de início de leitura
const updateStartDate = async () => {
  if (!selectedBook.value) return;
  
  try {
    // Obter a data do formato DD/MM/YYYY para ISO string para o banco de dados
    let started_reading_at = null;
    if (selectedBook.value.dataInicioLeitura) {
      const dateParts = selectedBook.value.dataInicioLeitura.split('/');
      if (dateParts.length === 3) {
        const date = new Date(
          parseInt(dateParts[2]), // ano
          parseInt(dateParts[1]) - 1, // mês (0-11)
          parseInt(dateParts[0]) // dia
        );
        started_reading_at = date.toISOString();
      }
    }
    
    await bookshelfStore.updateBook(selectedBook.value.id, {
      started_reading_at: started_reading_at
    });
    
    showNotification("Data de início de leitura atualizada!", "success");
  } catch (err: any) {
    console.error("Erro ao atualizar data de início:", err);
    showNotification("Erro ao atualizar data de início", "error");
  }
};

// Atualiza a data de conclusão da leitura
const updateEndDate = async () => {
  if (!selectedBook.value) return;
  
  try {
    // Obter a data do formato DD/MM/YYYY para ISO string para o banco de dados
    let finished_reading_at = null;
    if (selectedBook.value.dataFinalLeitura) {
      const dateParts = selectedBook.value.dataFinalLeitura.split('/');
      if (dateParts.length === 3) {
        const date = new Date(
          parseInt(dateParts[2]), // ano
          parseInt(dateParts[1]) - 1, // mês (0-11)
          parseInt(dateParts[0]) // dia
        );
        finished_reading_at = date.toISOString();
      }
    }
    
    await bookshelfStore.updateBook(selectedBook.value.id, {
      finished_reading_at: finished_reading_at
    });
    
    showNotification("Data de conclusão de leitura atualizada!", "success");
  } catch (err: any) {
    console.error("Erro ao atualizar data de conclusão:", err);
    showNotification("Erro ao atualizar data de conclusão", "error");
  }
};

// Função genérica para mostrar notificações
const showNotification = (text: string, color: string = "success") => {
  snackbarText.value = text;
  snackbarColor.value = color;
  showSnackbar.value = true;
};

// Adicionar uma nova frase
const addQuote = async () => {
  if (!selectedBook.value || !newQuote.value.text) return;
  
  try {
    if (!selectedBook.value.quotes) {
      selectedBook.value.quotes = [];
    }
    if (!selectedBook.value.quotePages) {
      selectedBook.value.quotePages = [];
    }
    
    await bookshelfStore.addPhase(selectedBook.value.id, {
      text: newQuote.value.text,
      page: newQuote.value.page || null,
    });
    
    selectedBook.value.quotes.push(newQuote.value.text);
    selectedBook.value.quotePages.push(newQuote.value.page);
    
    newQuote.value = { text: "", page: null };
    showNotification("Frase favorita adicionada com sucesso!");
  } catch (err: any) {
    console.error("Erro ao adicionar frase:", err);
    showNotification("Erro ao adicionar frase", "error");
  }
};

// Adicionar uma nova frase a partir do diálogo
const addQuoteFromDialog = async () => {
  console.log("⭐ addQuoteFromDialog chamado");
  console.log("⭐ selectedBook:", selectedBook.value);
  console.log("⭐ newQuote:", newQuote.value);
  
  if (!selectedBook.value) {
    console.error("Erro: selectedBook é null ou undefined");
    showNotification("Erro: Livro não encontrado", "error");
    return;
  }
  
  if (!newQuote.value.text) {
    console.error("Erro: Texto da frase está vazio");
    showNotification("Por favor, digite o texto da frase", "error");
    return;
  }
  
  try {
    console.log("⭐ Inicializando arrays de frases, se necessário");
    if (!selectedBook.value.quotes) {
      selectedBook.value.quotes = [];
    }
    if (!selectedBook.value.quotePages) {
      selectedBook.value.quotePages = [];
    }
    if (!selectedBook.value.quotesData) {
      selectedBook.value.quotesData = [];
    }
    
    console.log("⭐ Chamando bookshelfStore.addPhase com livro ID:", selectedBook.value.id);
    const quoteData = {
      text: newQuote.value.text,
      page: newQuote.value.page || null,
    };
    console.log("⭐ Dados da frase:", quoteData);
    
    const quoteId = await bookshelfStore.addPhase(selectedBook.value.id, quoteData);
    console.log("⭐ Resposta da API addPhase ID:", quoteId);
    
    // Adiciona a frase localmente para atualização imediata da UI
    selectedBook.value.quotes.push(newQuote.value.text);
    selectedBook.value.quotePages.push(newQuote.value.page);
    
    if (quoteId) {
      selectedBook.value.quotesData.push({
        id: quoteId,
        book_id: selectedBook.value.id,
        text: newQuote.value.text,
        page: newQuote.value.page,
      });
    }
    
    // Limpa o formulário e fecha o diálogo
    newQuote.value = { text: "", page: null };
    showQuoteDialog.value = false;
    showNotification("Frase favorita adicionada com sucesso!");
  } catch (err: any) {
    console.error("Erro ao adicionar frase:", err);
    showNotification("Erro ao adicionar frase", "error");
  }
};

// Iniciar edição de uma frase
const startEdit = (index: number, quote: string) => {
  editingIndex.value = index;
  editingQuote.value = { 
    text: quote, 
    page: selectedBook.value.quotePages ? selectedBook.value.quotePages[index] : null 
  };
};

// Cancelar edição
const cancelEdit = () => {
  editingIndex.value = -1;
  editingQuote.value = { text: "", page: null };
};

// Salvar edição de frase
const saveQuoteEdit = async (index: number) => {
  if (!selectedBook.value || !editingQuote.value.text) return;
  
  try {
    // Obter o ID da citação para poder editar corretamente
    const quoteId = selectedBook.value.quotesData[index]?.id;
    
    if (!quoteId) {
      console.error("ID da citação não encontrado");
      return;
    }
    
    await bookshelfStore.editPhase(
      quoteId,
      {
        text: editingQuote.value.text,
        page: editingQuote.value.page
      }
    );
    
    // Atualizar arrays localmente
    selectedBook.value.quotes[index] = editingQuote.value.text;
    selectedBook.value.quotePages[index] = editingQuote.value.page;
    
    showNotification("Frase atualizada com sucesso!");
    cancelEdit();
  } catch (err: any) {
    console.error("Erro ao editar frase:", err);
    showNotification("Erro ao atualizar frase", "error");
  }
};

// Preparar para remover uma frase (abrir diálogo de confirmação)
const confirmRemoveQuote = (index: number) => {
  quoteToDeleteIndex.value = index;
  confirmDeleteQuote.value = true;
};

// Remover a frase após confirmação
const removeQuoteConfirmed = async () => {
  const index = quoteToDeleteIndex.value;
  if (!selectedBook.value || index < 0) return;
  
  try {
    // Obter o ID da frase para poder remover corretamente
    const quoteId = selectedBook.value.quotesData[index]?.id;
    
    if (!quoteId) {
      console.error("ID da frase não encontrado");
      return;
    }
    
    await bookshelfStore.removePhase(quoteId);
    
    // Atualizar arrays localmente
    selectedBook.value.quotes.splice(index, 1);
    selectedBook.value.quotePages.splice(index, 1);
    selectedBook.value.quotesData.splice(index, 1);
    
    showNotification("Frase removida com sucesso!");
    confirmDeleteQuote.value = false;
    quoteToDeleteIndex.value = -1;
  } catch (err: any) {
    console.error("Erro ao remover frase:", err);
    showNotification("Erro ao remover frase", "error");
    confirmDeleteQuote.value = false;
  }
};

// Excluir o livro após confirmação
const deleteBookConfirmed = async () => {
  if (!selectedBook.value) return;
  
  try {
    await bookshelfStore.deleteBook(selectedBook.value.id);
    router.push({
      path: "/bookshelf",
      query: { message: `Livro "${selectedBook.value.title}" removido com sucesso!` }
    });
  } catch (err: any) {
    console.error("Erro ao deletar livro:", err);
    showNotification("Erro ao remover livro", "error");
    confirmDeleteBook.value = false;
  }
};

// Adicionar a função de callback
const onRecommendationSent = (count: number) => {
  showNotification(`Livro recomendado para ${count} ${count === 1 ? 'amigo' : 'amigos'} com sucesso!`);
};

// Função para obter o índice correto na paginação
const getPaginationIndex = (index: number) => {
  return (quotesPage.value - 1) * quotesPerPage + index;
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
  border-radius: 16px;
  transition: all 0.3s ease;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.page-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.5px;
}

.bookshelf-title {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-header {
  border-radius: 16px 16px 0 0;
}

.book-cover {
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.book-cover:hover {
  transform: scale(1.03);
}

.book-image-container {
  position: relative;
}

.card-title {
  font-weight: 700;
  line-height: 1.2;
  color: rgb(var(--v-theme-primary));
}

.description-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  max-height: 250px; /* Mudando de height fixo para max-height */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
}

.info-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.description-text {
  line-height: 1.8;
  color: rgb(var(--v-theme-on-surface));
}

.no-description-text {
  display: flex;
  align-items: center;
  line-height: 1.8;
  color: rgb(var(--v-theme-on-surface));
}

.quote-card {
  transition: all 0.3s ease;
  border-left: 3px solid rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.quote-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quote-text {
  font-style: italic;
  line-height: 1.7;
  position: relative;
  padding: 0.5rem;
  color: rgb(var(--v-theme-on-surface));
}

.quote-mark {
  font-size: 1.2em;
  font-weight: bold;
  color: rgb(var(--v-theme-accent));
}

.page-reference {
  display: inline-block;
  margin-left: 8px;
  opacity: 0.8;
}

.quote-form-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.status-chip {
  font-weight: 700;
  letter-spacing: 0.5px;
}

.status-select {
  border-radius: 8px;
}

/* Efeito de livro sendo lido */
.book-shadow-effect {
  box-shadow: 0 10px 20px rgba(var(--v-theme-warning), 0.4);
  animation: glowing 3s ease-in-out infinite alternate;
}

@keyframes glowing {
  from { box-shadow: 0 10px 20px rgba(var(--v-theme-warning), 0.3); }
  to { box-shadow: 0 10px 20px rgba(var(--v-theme-warning), 0.7); }
}

/* Sistema de avaliação */
.rating-container {
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Dialog de confirmação */
.delete-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.text-serif {
  font-family: 'Georgia', serif;
}

@media (max-width: 768px) {
  .card-title {
    font-size: 1.8rem !important;
  }
  
  .page-title {
    font-size: 1.8rem;
  }
}
</style>
