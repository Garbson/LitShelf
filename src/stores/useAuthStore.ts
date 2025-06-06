// stores/useAuthStore.ts
import { supabase } from '@/supabase'; // Importa o cliente Supabase
import type { User } from '@supabase/supabase-js';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // Estado para armazenar o usuário autenticado do Supabase
  const user = ref<User | null>(null);
  const loading = ref(true); // Indica se a verificação inicial de auth está ocorrendo

  // --- Funções de Autenticação com Supabase ---

  // Login com Google
  const loginWithGoogle = async () => {
    loading.value = true;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Erro no login com Google:', error.message);
      loading.value = false;
      // Aqui você pode adicionar feedback para o usuário (snackbar, etc.)
      return false;
    }
    // O redirecionamento ou atualização do estado será tratado pelo onAuthStateChange
    return true;
  };

  // Login com Email e Senha
  const loginWithEmail = async (email: string, password: string) => {
    loading.value = true;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    loading.value = false;
    if (error) {
      console.error('Erro no login com Email:', error.message);
      // Verifica se o erro é sobre email não confirmado
      if (error.message.includes('Email not confirmed')) {
        return 'email_not_confirmed';
      }
      return false;
    }
    // O estado será atualizado pelo onAuthStateChange
    user.value = data.user; // Atualiza imediatamente para feedback mais rápido
    
    // Garantir que o perfil do usuário exista no banco de dados
    await ensureProfileExists(data.user);
    
    return true;
  };

  // Registro com Email e Senha
  const registerWithEmail = async (email: string, password: string) => {
    loading.value = true;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Você pode adicionar opções aqui, como dados adicionais do usuário:
      // options: {
      //   data: { name: 'Nome Inicial' } // Exemplo
      // }
    });
    loading.value = false;
    if (error) {
      console.error('Erro no registro:', error.message);
      return false;
    }
    // Por padrão, Supabase pode exigir confirmação de email.
    // O usuário não estará logado imediatamente após o signUp se a confirmação estiver ativa.
    // Você pode informar o usuário para verificar o email.
    if (data.user && data.user.identities?.length === 0) {
       console.log("Registro bem-sucedido! Verifique seu email para confirmação.");
       // Mostrar mensagem para o usuário verificar o email
    } else if (data.user) {
       // Se a confirmação não for necessária ou já estiver confirmada
       user.value = data.user;
       
       // Criar um perfil para o novo usuário
       await ensureProfileExists(data.user);
    }
    return true;
  };

  // Logout
  const logout = async () => {
    loading.value = true;
    const { error } = await supabase.auth.signOut();
    loading.value = false;
    if (error) {
      console.error('Erro no logout:', error.message);
      return false;
    }
    user.value = null; // Limpa o usuário localmente
    // Redirecionar para a página de login ou inicial, se necessário
    // router.push('/login');
    return true;
  };

  // --- Observador de Estado de Autenticação ---

  // Função para ser chamada quando o estado de autenticação muda
  const setupAuthListener = () => {
    supabase.auth.onAuthStateChange((event, session) => {
      // console.log('Auth Event:', event); // Para depuração
      // console.log('Auth Session:', session); // Para depuração
      user.value = session?.user ?? null;
      loading.value = false; // Marca que a verificação inicial terminou
    });

    // Verifica o estado inicial (caso o usuário já esteja logado ao carregar a página)
    // O onAuthStateChange pode não disparar imediatamente no carregamento inicial em alguns casos
    // Uma verificação explícita garante que o estado seja definido.
    supabase.auth.getSession().then(({ data }) => {
        if (!user.value) { // Só atualiza se o onAuthStateChange ainda não o fez
            user.value = data.session?.user ?? null;
        }
        loading.value = false;
    });
  };

  // Função para garantir que o perfil exista
  const ensureProfileExists = async (authUser: User) => {
    if (!authUser) return;
    
    try {
      // Verificar se o perfil já existe
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authUser.id)
        .single();
      
      // Se não houver perfil existente, criar um novo
      if (fetchError && fetchError.code === 'PGRST116') { // PGRST116 = Nenhum resultado encontrado
        console.log('Criando novo perfil para o usuário:', authUser.id);
        
        // Usando os campos corretos que existem na tabela profiles
        const profileData = {
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
          profile_picture_url: authUser.user_metadata?.avatar_url || null,
          reading_goal: 0, // Valor padrão para meta de leitura
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Tentando criar perfil com dados:', profileData);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profileData]);
        
        if (insertError) {
          console.error('Erro ao criar perfil do usuário:', insertError);
        } else {
          console.log('Perfil criado com sucesso');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar/criar perfil:', error);
    }
  };

  // --- Getters Computados ---

  const isAuthenticated = computed(() => !!user.value);
  const userId = computed(() => user.value?.id); // ID do usuário Supabase

  // Inicializa o listener quando o store é criado
  // setupAuthListener(); // Chamaremos isso no App.vue ou main.ts

  return {
    user,
    loading,
    isAuthenticated,
    userId,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    setupAuthListener, // Exporta para ser chamado externamente
  };
});
