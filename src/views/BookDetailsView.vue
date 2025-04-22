<template>
  <div class="bookshelf-container fill-height d-flex justify-center">
    <v-card elevation="0" class="card-container pa-4 rounded-xl" style="width: 90%">
      <h1 class="text-h3 font-weight-bold mb-6 text-center bookshelf-title">
        <span class="page-title">📖 Detalhes do Livro</span>
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
              :src="selectedBook.coverImage || '/placeholder-book.png'"
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
            <div class="mb-6">
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
            
            <!-- Espaçamento adicionado entre os botões -->
            <div class="d-flex flex-wrap gap-4">
              <v-btn 
                color="primary" 
                variant="tonal" 
                prepend-icon="mdi-heart" 
              >
                Favoritar
              </v-btn>
              <v-btn 
                color="secondary" 
                variant="tonal" 
                prepend-icon="mdi-share" 
                @click="showRecommendDialog = true"
              >
                Recomendar
              </v-btn>
              <v-btn 
                :to="`/bookshelf`"
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
              </div>

              <!-- Datas de leitura -->
              <div v-if="selectedBook.status !== 0" class="reading-date mb-4">
                <template v-if="selectedBook.status === 2">
                  <p class="font-weight-medium mb-1">Começou a ler em</p>
                  <v-text-field
                    v-model="startDateFormatted"
                    type="date"
                    variant="outlined"
                    density="compact"
                    @update:model-value="updateStartDate"
                  ></v-text-field>
                </template>
                <template v-else-if="selectedBook.status === 1">
                  <p class="font-weight-medium mb-1">Leitura concluída em</p>
                  <v-text-field
                    v-model="endDateFormatted"
                    type="date"
                    variant="outlined"
                    density="compact"
                    @update:model-value="updateEndDate"
                  ></v-text-field>
                </template>
              </div>
              
              <p class="font-weight-medium mb-1">Gênero</p>
              <v-text-field
                v-model="selectedBook.genre"
                variant="outlined"
                density="compact"
                hide-details
                class="mb-4"
                @blur="updateBookGenre"
              />
              
              <p class="font-weight-medium mb-1">Número de Páginas</p>
              <p class="mb-4">{{ selectedBook.pageCount || 'Não informado' }}</p>
              
              <v-btn 
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
              <p class="text-body-1 description-text">
                {{ selectedBook.description || 'Sem descrição disponível.' }}
              </p>
            </v-card>
            
            <!-- Seção de frases favoritas - modificado para aparecer com o status correto -->
            <div v-if="showQuotesSection">
              <h3 class="text-h5 mb-4 text-serif">
                <v-icon icon="mdi-format-quote-close" color="accent" class="mr-2"></v-icon>
                Frases Favoritas
              </h3>
              
              <!-- Formulário para adicionar nova frase -->
              <v-card class="pa-4 mb-4 quote-form-card" variant="outlined" elevation="1">
                <v-text-field
                  v-model="newQuote.text"
                  label="Digite uma frase favorita"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  class="mb-3"
                />
                
                <v-text-field
                  v-model="newQuote.page"
                  label="Página (opcional)"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  type="number"
                  class="mb-3"
                />
                
                <v-btn 
                  @click="addQuote" 
                  color="primary" 
                  :disabled="!newQuote.text"
                  prepend-icon="mdi-plus"
                  class="mt-2"
                >
                  Adicionar Frase
                </v-btn>
              </v-card>
              
              <!-- Lista de frases -->
              <div class="quotes-list">
                <v-card 
                  v-for="(quote, index) in selectedBook.quotes" 
                  :key="index"
                  class="mb-4 quote-card"
                  variant="outlined"
                  elevation="1"
                >
                  <v-card-text>
                    <!-- Modo de edição -->
                    <template v-if="editingIndex === index">
                      <v-text-field
                        v-model="editingQuote.text"
                        label="Editar Frase"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="mb-2"
                      />
                      
                      <v-text-field
                        v-model="editingQuote.page"
                        label="Editar Página (opcional)"
                        variant="outlined"
                        density="compact"
                        hide-details
                        type="number"
                        class="mb-3"
                      />
                      
                      <div class="d-flex gap-2 justify-end">
                        <v-btn @click="saveQuoteEdit(index)" color="success" size="small" variant="tonal">Salvar</v-btn>
                        <v-btn @click="cancelEdit" color="error" size="small" variant="tonal">Cancelar</v-btn>
                      </div>
                    </template>
                    
                    <!-- Modo de visualização -->
                    <template v-else>
                      <div class="quote-text">
                        <span class="quote-mark">"</span>
                        {{ quote }}
                        <span class="quote-mark">"</span>
                        
                        <span v-if="selectedBook.quotePages && selectedBook.quotePages[index]" 
                              class="text-caption page-reference">
                          (Página {{ selectedBook.quotePages[index] }})
                        </span>
                      </div>
                      
                      <div class="d-flex mt-3 justify-end gap-2">
                        <v-btn 
                          @click="startEdit(index, quote)" 
                          color="primary" 
                          size="small"
                          variant="tonal"
                          icon
                        >
                          <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                        
                        <v-btn 
                          @click="confirmRemoveQuote(index)" 
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
                <p v-if="!selectedBook.quotes || selectedBook.quotes.length === 0" class="text-center pa-4">
                  Nenhuma frase favorita adicionada ainda.
                </p>
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
import BookRecommendationDialog from '@/components/BookRecommendationDialog.vue';
import { db } from "@/firebase";
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const bookshelfStore = useBookshelfStore();
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

// Carrega o livro quando o componente é montado
onMounted(async () => {
  const bookId = route.params.id as string;
  await bookshelfStore.fetchBookDetails(bookId);
  selectedBook.value = bookshelfStore.selectedBook;
  
  // Carregando a avaliação, caso exista
  if (selectedBook.value?.rating) {
    bookRating.value = selectedBook.value.rating;
  }
  
  // Definindo um status padrão se não houver
  if (selectedBook.value.status === undefined || selectedBook.value.status === null) {
    selectedBook.value.status = 0; // Quero ler
  }
  
  console.log('Status do livro:', selectedBook.value.status);
});

// Retorna a cor baseada no status de leitura
const getStatusColor = (status: string | number): string => {
  const statusNum = Number(status);
  const option = statusOptions.find(o => o.value === statusNum);
  return option ? option.color : 'grey';
};

// Retorna o texto do status
const getStatusLabel = (status: string | number): string => {
  const statusNum = Number(status);
  const option = statusOptions.find(o => o.value === statusNum);
  return option ? option.label : 'Quero Ler';
};

// Atualiza o gênero do livro
const updateBookGenre = async () => {
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
      await setDoc(docRef, { genre: selectedBook.value.genre }, { merge: true });
      await bookshelfStore.fetchBooks();
      
      showNotification("Gênero atualizado com sucesso!", "success");
    }
  } catch (err: any) {
    console.error("Erro ao atualizar gênero:", err);
    showNotification("Erro ao atualizar gênero", "error");
  }
};

// Atualiza a avaliação do livro
const updateBookRating = async (rating: number) => {
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
      await setDoc(docRef, { rating }, { merge: true });
      
      // Atualizar localmente
      selectedBook.value.rating = rating;
      
      showNotification("Avaliação atualizada!", "success");
    }
  } catch (err: any) {
    console.error("Erro ao atualizar avaliação:", err);
    showNotification("Erro ao atualizar avaliação", "error");
  }
};

// Atualiza o status de leitura
const updateReadingStatus = async (status: number) => {
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
      
      // Preparar os dados para atualização
      const updateData: any = { status };
      
      // Se o status é "Estou lendo" (2) e não tem data de início, adicionamos
      if (status === 2 && !selectedBook.value.dataInicioLeitura) {
        // Formatar a data como DD/MM/YYYY
        const today = new Date();
        const formattedDate = formatDateForStorage(today);
        updateData.dataInicioLeitura = formattedDate;
        selectedBook.value.dataInicioLeitura = formattedDate;
        console.log(`Status atualizado para "Estou lendo" - Data início: ${formattedDate}`);
      }
      
      // Se o status é "Já li" (1) e não tem data de término, adicionamos
      if (status === 1 && !selectedBook.value.dataFinalLeitura) {
        // Formatar a data como DD/MM/YYYY
        const today = new Date();
        const formattedDate = formatDateForStorage(today);
        updateData.dataFinalLeitura = formattedDate;
        selectedBook.value.dataFinalLeitura = formattedDate;
        console.log(`Status atualizado para "Já li" - Data final: ${formattedDate}`);
      }
      
      // Log para depuração
      console.log("Atualizando livro com dados:", updateData);
      
      await setDoc(docRef, updateData, { merge: true });
      
      // Atualizar a lista de livros para manter a consistência
      await bookshelfStore.fetchBooks();
      
      const statusLabel = statusOptions.find(o => o.value === status)?.label;
      showNotification(`Status atualizado para "${statusLabel}"`, "success");
    }
  } catch (err: any) {
    console.error("Erro ao atualizar status:", err);
    showNotification("Erro ao atualizar status", "error");
  }
};

// Atualiza a data de início de leitura
const updateStartDate = async () => {
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
      
      // Usar o campo dataInicioLeitura que já está no formato DD/MM/YYYY
      await setDoc(docRef, { dataInicioLeitura: selectedBook.value.dataInicioLeitura }, { merge: true });
      
      showNotification("Data de início de leitura atualizada!", "success");
    }
  } catch (err: any) {
    console.error("Erro ao atualizar data de início:", err);
    showNotification("Erro ao atualizar data de início", "error");
  }
};

// Atualiza a data de conclusão da leitura
const updateEndDate = async () => {
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
      
      // Usar o campo dataFinalLeitura que já está no formato DD/MM/YYYY
      await setDoc(docRef, { dataFinalLeitura: selectedBook.value.dataFinalLeitura }, { merge: true });
      
      showNotification("Data de conclusão de leitura atualizada!", "success");
    }
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
  if (!bookshelfStore.user || !selectedBook.value || !newQuote.value.text) return;
  
  try {
    // Inicializa os arrays se não existirem
    if (!selectedBook.value.quotes) {
      selectedBook.value.quotes = [];
    }
    if (!selectedBook.value.quotePages) {
      selectedBook.value.quotePages = [];
    }
    
    // Adiciona a frase ao Firebase
    await bookshelfStore.addPhase(selectedBook.value.id, {
      text: newQuote.value.text,
      page: newQuote.value.page || null,
    });
    
    // Atualiza localmente
    selectedBook.value.quotes.push(newQuote.value.text);
    selectedBook.value.quotePages.push(newQuote.value.page);
    
    // Limpa o formulário
    newQuote.value = { text: "", page: null };
    
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
  if (!bookshelfStore.user || !selectedBook.value || !editingQuote.value.text) return;
  
  try {
    // Buscar o documento do livro
    const q = query(
      collection(db, `users/${bookshelfStore.user.uid}/books`),
      where("id", "==", selectedBook.value.id)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Recuperar as frases e páginas existentes
      const bookRef = doc(db, `users/${bookshelfStore.user.uid}/books/${querySnapshot.docs[0].id}`);
      const phasesQuery = collection(bookRef, "phases");
      const phasesSnapshot = await getDocs(phasesQuery);
      
      // Encontrar o documento da frase a ser editada
      if (phasesSnapshot.docs[index]) {
        const phaseDoc = phasesSnapshot.docs[index];
        // Atualizar o documento da frase usando o método do store
        await bookshelfStore.editPhase(
          selectedBook.value.id,
          phaseDoc.id,
          {
            text: editingQuote.value.text,
            page: editingQuote.value.page
          }
        );
        
        showNotification("Frase atualizada com sucesso!");
        
        // Resetar estado de edição
        cancelEdit();
      }
    }
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
  if (!bookshelfStore.user || !selectedBook.value || index < 0) return;
  
  try {
    // Buscar o documento do livro
    const q = query(
      collection(db, `users/${bookshelfStore.user.uid}/books`),
      where("id", "==", selectedBook.value.id)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const bookRef = doc(db, `users/${bookshelfStore.user.uid}/books/${querySnapshot.docs[0].id}`);
      const phasesQuery = collection(bookRef, "phases");
      const phasesSnapshot = await getDocs(phasesQuery);
      
      // Encontrar o documento da frase a ser removida
      if (phasesSnapshot.docs[index]) {
        const phaseDoc = phasesSnapshot.docs[index];
        // Remover o documento da frase usando o método do store
        await bookshelfStore.removePhase(
          selectedBook.value.id,
          phaseDoc.id,
          selectedBook.value.quotes[index]
        );
        
        showNotification("Frase removida com sucesso!");
      }
    }
    
    // Fechar o diálogo de confirmação
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
  if (!bookshelfStore.user) return;
  try {
    await bookshelfStore.deleteBook(selectedBook.value.id);
    
    // Redirecionar com mensagem de sucesso
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
  toast.add({
    color: 'success',
    title: 'Recomendação enviada',
    text: `Livro recomendado para ${count} ${count === 1 ? 'amigo' : 'amigos'} com sucesso!`
  });
};

// Computed para renderização condicional da seção de frases favoritas
const showQuotesSection = computed(() => {
  return Number(selectedBook.value?.status) === 2 || Number(selectedBook.value?.status) === 1;
});
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
  background: linear-gradient(to right, rgba(var(--v-theme-surface-variant), 0.7), rgba(var(--v-theme-surface), 0.9));
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
  height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
