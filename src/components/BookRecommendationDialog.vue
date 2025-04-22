<template>
  <v-dialog v-model="dialog" max-width="500" transition="dialog-bottom-transition">
    <v-card>
      <v-card-title class="text-h5 bg-primary text-white pa-4">
        Recomendar livro para amigos
      </v-card-title>

      <v-card-text class="pt-4">
        <p class="mb-4">Escolha amigos para recomendar o livro "{{ book.title }}"</p>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="error = ''"
        >
          {{ error }}
        </v-alert>

        <v-list v-if="friends.length > 0" class="friends-list bg-grey-lighten-4 rounded-lg">
          <v-list-item
            v-for="friend in friends"
            :key="friend.id"
            :value="friend"
            class="mb-1"
          >
            <template v-slot:prepend>
              <v-checkbox
                v-model="selectedFriends"
                :value="friend.id"
                color="primary"
                hide-details
              ></v-checkbox>
            </template>

            <v-list-item-title>{{ friend.displayName || friend.email.split('@')[0] }}</v-list-item-title>
            <v-list-item-subtitle>{{ friend.email }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-alert
          v-else
          type="info"
          variant="tonal"
          class="mt-3"
        >
          Você ainda não tem amigos para recomendar este livro.
        </v-alert>

        <v-textarea
          v-model="message"
          label="Mensagem (opcional)"
          placeholder="Diga o que achou deste livro..."
          variant="outlined"
          rows="3"
          class="mt-4"
          counter
          maxlength="200"
        ></v-textarea>

        <div class="d-flex justify-center mt-3 recommendation-preview">
          <v-card variant="outlined" class="mx-auto" width="100%" max-width="350">
            <div class="d-flex">
              <v-img
                :src="book.coverImage || '/placeholder-book.png'"
                width="80"
                height="120"
                cover
              ></v-img>
              <div class="pa-3">
                <div class="text-subtitle-1 font-weight-bold text-truncate">{{ book.title }}</div>
                <div class="text-caption">{{ book.author }}</div>
                <div class="mt-1">
                  <v-rating
                    v-if="book.rating"
                    :model-value="book.rating"
                    readonly
                    size="x-small"
                    color="amber"
                    half-increments
                  ></v-rating>
                </div>
              </div>
            </div>
          </v-card>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="dialog = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          :disabled="selectedFriends.length === 0 || isLoading"
          :loading="isLoading"
          @click="sendRecommendations"
        >
          Recomendar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { db } from '@/firebase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRecommendationStore } from '@/stores/useRecommendationStore';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp
} from 'firebase/firestore';
import { defineEmits, defineProps, onMounted, ref, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  book: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'recommended']);

const authStore = useAuthStore();
const recommendationStore = useRecommendationStore();
const dialog = ref(false);
const friends = ref<any[]>([]);
const selectedFriends = ref<string[]>([]);
const message = ref('');
const isLoading = ref(false);
const error = ref('');

// Sync dialog with v-model
watch(() => props.modelValue, (val) => {
  dialog.value = val;
});

watch(dialog, (val) => {
  emit('update:modelValue', val);
  if (!val) {
    // Reset form when dialog closes
    selectedFriends.value = [];
    message.value = '';
    error.value = '';
  }
});

onMounted(async () => {
  await loadFriends();
});

const loadFriends = async () => {
  if (!authStore.user) return;
  
  try {
    const userRef = doc(db, 'users', authStore.user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Carregar amigos
      friends.value = [];
      if (userData.friends && userData.friends.length > 0) {
        for (const friendId of userData.friends) {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            friends.value.push({
              id: friendId,
              email: friendData.email,
              displayName: friendData.displayName || null
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Erro ao carregar amigos:", error);
    error.value = "Não foi possível carregar sua lista de amigos.";
  }
};

const sendRecommendations = async () => {
  if (selectedFriends.value.length === 0) {
    error.value = "Selecione pelo menos um amigo para recomendar este livro.";
    return;
  }
  
  isLoading.value = true;
  error.value = '';
  
  try {
    // Usar o store para enviar recomendações
    const result = await recommendationStore.sendRecommendation(
      props.book.id,
      selectedFriends.value,
      message.value
    );
    
    if (result.success) {
      // Firebase integration (manteremos para compatibilidade)
      for (const friendId of selectedFriends.value) {
        await addDoc(collection(db, 'bookRecommendations'), {
          senderId: authStore.user?.uid,
          senderName: authStore.user?.displayName || authStore.user?.email?.split('@')[0] || 'Usuário',
          recipientId: friendId,
          bookId: props.book.id,
          bookTitle: props.book.title,
          bookAuthor: props.book.author,
          bookCoverImage: props.book.coverImage || '',
          message: message.value,
          createdAt: serverTimestamp(),
          status: 'pending' // pending, accepted, rejected
        });
      }
      
      // Emitir evento de sucesso
      emit('recommended', {
        success: true,
        friendCount: selectedFriends.value.length
      });
      
      // Fechar diálogo
      dialog.value = false;
    } else {
      throw new Error('Falha ao enviar recomendações');
    }
  } catch (err) {
    console.error("Erro ao enviar recomendações:", err);
    error.value = "Ocorreu um erro ao enviar as recomendações. Por favor, tente novamente mais tarde.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.friends-list {
  max-height: 200px;
  overflow-y: auto;
}

.recommendation-preview {
  animation: fade-in 0.3s ease-in-out;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>