<template>
  <div>
    <!-- Navbar sempre no topo e visível apenas quando autenticado -->
    <div v-if="isAuthenticated" class="navbar-container">
      <NavbarTeste />
    </div>
    <!-- Conteúdo principal -->
    <div
      class="mx-auto d-flex justify-center teste"
      style="width: 100% !important; height: 100%"
    >
      <router-view />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { supabase } from "@/supabase";
import NavbarTeste from "@/views/NavBarTest.vue";
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";

// Obtenha o estado de autenticação da store
const authStore = useAuthStore();
const bookshelfStore = useBookshelfStore();
const route = useRoute();
const isAuthenticated = computed(() => !!authStore.user);



// Função para garantir que o perfil do usuário exista
const ensureUserProfile = async () => {
  if (authStore.user) {
    try {
      // Verificar se o perfil já existe
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authStore.user.id)
        .single();
      
      // Se não houver perfil existente, criar um novo
      if (fetchError && fetchError.code === 'PGRST116') { // PGRST116 = Nenhum resultado encontrado        
        // Usando os campos corretos que existem na tabela profiles
        const profileData = {
          id: authStore.user.id,
          name: authStore.user.user_metadata?.full_name || authStore.user.email?.split('@')[0] || 'Usuário',
          profile_picture_url: authStore.user.user_metadata?.avatar_url || null,
          reading_goal: 0, // Valor padrão para meta de leitura
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profileData]);
        
        if (insertError) {
          console.error('Erro ao criar perfil do usuário:', insertError);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar/criar perfil:', error);
    }
  }
};

// Inicializa o listener de autenticação quando o app é carregado
onMounted(async () => {
  // Configura o listener para manter o estado de autenticação mesmo após o reload
  authStore.setupAuthListener();
  
  // Verificar a sessão atual
  const { data } = await supabase.auth.getSession();
  if (data.session && data.session.user) {
    // Se temos um usuário já autenticado, garantir que o perfil existe
    setTimeout(ensureUserProfile, 1000); // Pequeno atraso para garantir que authStore.user seja atualizado
  }
});
</script>

<style scoped>
/* Estilo para fixar o Navbar no topo */
.navbar-container {
  width: 100%;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
</style>
