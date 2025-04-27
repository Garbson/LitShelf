<template>
  <div class="profile-container fill-height d-flex justify-center">
    <v-card elevation="0" class="card-container pa-4 rounded-xl" style="width: 90%">
      <h1 class="text-h3 font-weight-bold mb-4 text-center profile-title">
        <span class="page-title">👤 Meu Perfil</span>
      </h1>

      <div v-if="isLoading" class="d-flex justify-center align-center pa-8">
        <v-progress-circular indeterminate color="primary" size="64" />
      </div>

      <v-row v-else justify="center">
        <!-- Informações do perfil -->
        <v-col cols="12" md="8" lg="6" class="d-flex flex-column align-center">
          <v-card class="pa-6 rounded-xl profile-card" elevation="2" width="100%">
            <div class="d-flex flex-column align-center">
              <v-avatar size="150" class="mb-4 elevation-3">
                <v-img
                  v-if="profileData.profilePictureUrl"
                  :src="profileData.profilePictureUrl"
                  alt="Foto de perfil"
                />
                <v-icon v-else size="150" icon="mdi-account-circle" color="grey" />
              </v-avatar>

              <h2 class="text-h4 font-weight-bold mb-2">{{ profileData.name }}</h2>
              <p class="text-subtitle-1 text-grey">{{ userEmail }}</p>

              <v-divider class="my-4 w-100"></v-divider>

              <div class="w-100 mt-2">
                <v-form ref="profileForm" @submit.prevent="saveChanges">
                  <!-- ID do usuário -->
                  <div class="d-flex align-center mb-4">
                    <v-text-field
                      label="ID do Usuário"
                      v-model="profileData.id"
                      readonly
                      variant="outlined"
                      density="comfortable"
                      bg-color="surface"
                      class="flex-grow-1 rounded-lg"
                      append-inner-icon="mdi-content-copy"
                      @click:append-inner="copyToClipboard(profileData.id, 'ID')"
                    />
                  </div>

                  <!-- Nome -->
                  <div class="d-flex align-center mb-4">
                    <v-text-field
                      label="Nome"
                      v-model="profileData.name"
                      :readonly="!isEditing"
                      variant="outlined"
                      density="comfortable"
                      bg-color="surface"
                      class="flex-grow-1 rounded-lg"
                      append-inner-icon="mdi-content-copy"
                      @click:append-inner="!isEditing && copyToClipboard(profileData.name, 'Nome')"
                    />
                  </div>

                  <!-- Email -->
                  <v-text-field
                    label="Email"
                    v-model="userEmail"
                    readonly
                    variant="outlined"
                    class="mb-4 rounded-lg"
                    density="comfortable"
                    bg-color="surface"
                  />

                  <!-- Meta de leitura -->
                  <v-text-field
                    label="Meta de leitura (livros por ano)"
                    v-model.number="profileData.readingGoal"
                    :readonly="!isEditing"
                    variant="outlined"
                    type="number"
                    min="0"
                    class="mb-4 rounded-lg"
                    density="comfortable"
                    bg-color="surface"
                  />

                  <div class="d-flex justify-space-between mt-6">
                    <v-btn
                      v-if="!isEditing"
                      color="primary"
                      prepend-icon="mdi-pencil"
                      @click="startEditing"
                      variant="elevated"
                      class="rounded-lg"
                    >
                      Editar Perfil
                    </v-btn>
                    <template v-else>
                      <v-btn
                        color="primary"
                        prepend-icon="mdi-content-save"
                        type="submit"
                        :loading="isSaving"
                        variant="elevated"
                        class="rounded-lg"
                      >
                        Salvar
                      </v-btn>
                      <v-btn
                        color="error"
                        variant="outlined"
                        prepend-icon="mdi-cancel"
                        @click="cancelEditing"
                        :disabled="isSaving"
                        class="rounded-lg"
                      >
                        Cancelar
                      </v-btn>
                    </template>
                  </div>
                </v-form>
              </div>

              <v-divider class="my-5 w-100"></v-divider>

              <v-btn
                v-if="!isEditing"
                variant="outlined"
                prepend-icon="mdi-image"
                @click="changeProfilePicture"
                color="primary"
                class="mt-2 rounded-lg"
              >
                Alterar foto de perfil
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <!-- Dialog para alterar foto de perfil -->
    <v-dialog v-model="showProfilePictureDialog" max-width="500px">
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h5 pt-3 pb-6">Alterar foto de perfil</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newProfilePictureUrl"
            label="URL da imagem"
            placeholder="https://exemplo.com/minha-foto.jpg"
            variant="outlined"
            class="mb-3"
            clearable
          />
          <p class="text-caption text-grey">
            Insira a URL de uma imagem para usar como foto de perfil
          </p>
        </v-card-text>
        <v-card-actions class="pt-3 pb-4 px-4">
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="showProfilePictureDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            @click="updateProfilePicture"
            :disabled="!newProfilePictureUrl"
            :loading="isUpdatingPicture"
            variant="elevated"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Snackbar para feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false"></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/useAuthStore.js';
import { supabase } from '@/supabase.js';
import { onMounted, ref } from 'vue';

// Store
const authStore = useAuthStore();

// Estado 
const isLoading = ref(true);
const isEditing = ref(false);
const isSaving = ref(false);
const showProfilePictureDialog = ref(false);
const isUpdatingPicture = ref(false);
const newProfilePictureUrl = ref('');
const userEmail = ref('');
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// Dados do formulário
const profileData = ref({
  id: '',
  name: '',
  profilePictureUrl: '',
  readingGoal: 0,
});

// Carregar dados do perfil
async function loadProfileData() {
  if (!authStore.userId) return;

  isLoading.value = true;
  
  try {
    // Carregar os dados do perfil
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, profile_picture_url, reading_goal')
      .eq('id', authStore.userId)
      .single();

    if (error) throw error;
    
    // Preencher os dados do perfil
    if (data) {
      profileData.value = {
        id: data.id,
        name: data.name || '',
        profilePictureUrl: data.profile_picture_url || '',
        readingGoal: data.reading_goal || 0,
      };
    }

    // Carregar o email do usuário a partir do authStore
    userEmail.value = authStore.user?.email || '';

  } catch (err) {
    console.error('Erro ao carregar dados do perfil:', err);
    showSnackbar('Erro ao carregar dados do perfil', 'error');
  } finally {
    isLoading.value = false;
  }
}

// Iniciar edição
function startEditing() {
  isEditing.value = true;
}

// Cancelar edição
function cancelEditing() {
  isEditing.value = false;
  loadProfileData(); // Recarregar dados originais
}

// Salvar alterações
async function saveChanges() {
  if (!authStore.userId) return;
  
  isSaving.value = true;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: profileData.value.name,
        reading_goal: profileData.value.readingGoal,
        updated_at: new Date().toISOString()
      })
      .eq('id', authStore.userId);
    
    if (error) throw error;
    
    isEditing.value = false;
    showSnackbar('Perfil atualizado com sucesso', 'success');
  } catch (err) {
    console.error('Erro ao salvar alterações no perfil:', err);
    showSnackbar('Erro ao salvar alterações', 'error');
  } finally {
    isSaving.value = false;
  }
}

// Abrir diálogo para alterar foto de perfil
function changeProfilePicture() {
  newProfilePictureUrl.value = profileData.value.profilePictureUrl;
  showProfilePictureDialog.value = true;
}

// Atualizar foto de perfil
async function updateProfilePicture() {
  if (!authStore.userId) return;
  
  isUpdatingPicture.value = true;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        profile_picture_url: newProfilePictureUrl.value,
        updated_at: new Date().toISOString()
      })
      .eq('id', authStore.userId);
    
    if (error) throw error;
    
    // Atualizar dados locais
    profileData.value.profilePictureUrl = newProfilePictureUrl.value;
    showProfilePictureDialog.value = false;
    showSnackbar('Foto de perfil atualizada com sucesso', 'success');
  } catch (err) {
    console.error('Erro ao atualizar foto de perfil:', err);
    showSnackbar('Erro ao atualizar foto de perfil', 'error');
  } finally {
    isUpdatingPicture.value = false;
  }
}

// Copiar para a área de transferência
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text)
    .then(() => {
      showSnackbar(`${label} copiado para a área de transferência`, 'success');
    })
    .catch(err => {
      console.error('Erro ao copiar para a área de transferência:', err);
      showSnackbar('Não foi possível copiar o texto', 'error');
    });
}

// Exibir snackbar com mensagem
function showSnackbar(text, color = 'success') {
  snackbar.value = {
    show: true,
    text,
    color
  };
}

// Carregar dados ao montar o componente
onMounted(() => {
  loadProfileData();
});
</script>

<style scoped>
.profile-container {
  width: 100%;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  padding: 1rem;
  position: relative;
}

.card-container {
  background: transparent;
}

.profile-title {
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

.profile-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  transition: all 0.3s ease;
}

.profile-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.copy-btn {
  color: rgb(var(--v-theme-primary));
}

.action-btn {
  color: rgb(var(--v-theme-on-primary));
  background-color: rgb(var(--v-theme-primary));
}

.action-btn:hover {
  background-color: rgb(var(--v-theme-primary-dark));
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.8rem;
  }
}
</style>