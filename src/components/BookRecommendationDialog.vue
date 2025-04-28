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

        <v-list v-if="friendsStore.friends.length > 0" class="friends-list bg-grey-lighten-4 rounded-lg">
          <v-list-item
            v-for="friend in friendsStore.friends"
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

            <v-list-item-title>{{ friend.name || friend.email.split('@')[0] }}</v-list-item-title>
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
          <div class="mt-2">
            <v-btn
              variant="outlined"
              color="primary"
              size="small"
              :to="{ name: 'Friends' }"
              prepend-icon="mdi-account-multiple-plus"
              @click="dialog = false"
            >
              Adicionar amigos
            </v-btn>
          </div>
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
                :src="book.coverImage || book.cover_image_url || '/placeholder-book.png'"
                width="80"
                height="120"
                cover
              ></v-img>
              <div class="pa-3">
                <div class="text-subtitle-1 font-weight-bold text-truncate">{{ book.title }}</div>
                <div class="text-caption">{{ book.author }}</div>
                <div class="mt-1">
                  <v-rating
                    v-if="book.rating || book.avaliacao"
                    :model-value="book.rating || book.avaliacao"
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
import { useAuthStore } from '@/stores/useAuthStore';
import { useFriendsStore } from '@/stores/useFriendsStore';
import { useRecommendationStore } from '@/stores/useRecommendationStore';
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  book: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'recommendation-sent']);

const authStore = useAuthStore();
const recommendationStore = useRecommendationStore();
const friendsStore = useFriendsStore();
const dialog = ref(false);
const selectedFriends = ref<string[]>([]);
const message = ref('');
const isLoading = ref(false);
const error = ref('');

// Sync dialog with v-model
watch(() => props.modelValue, (val) => {
  dialog.value = val;
  if (val) {
    loadFriends();
  }
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
  if (!authStore.userId) return;
  
  try {
    // Carregar amigos através do store
    if (friendsStore.friends.length === 0) {
      await friendsStore.fetchFriends();
    }
  } catch (err) {
    console.error("Erro ao carregar amigos:", err);
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
      // Emitir evento de sucesso
      emit('recommendation-sent', {
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