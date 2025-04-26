// src/stores/useFriendsStore.ts
import { supabase } from '../supabase';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useAuthStore } from './useAuthStore.js';

// Define tipos para as amizades e solicitações
interface Friend {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  user_id_1: string; // ID do primeiro usuário na relação
  user_id_2: string; // ID do segundo usuário na relação
}

interface FriendRequest {
  user_id_1: string; // ID do primeiro usuário na relação
  user_id_2: string; // ID do segundo usuário na relação
  senderEmail: string;
  senderName: string | null;
  senderPhotoUrl: string | null;
  receiverId: string; // ID do destinatário
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  requested_by_user_id: string; // ID do usuário que solicitou a amizade
}

// Status de amizade
enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export const useFriendsStore = defineStore('friends', () => {
  const authStore = useAuthStore();

  // Estado
  const friends = ref<Friend[]>([]);
  const receivedRequests = ref<FriendRequest[]>([]);
  const sentRequests = ref<FriendRequest[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Para armazenar subscrições de tempo real
  const subscriptions = ref<{
    friends?: () => void;
    receivedRequests?: () => void;
  }>({});

  // Getters
  const friendsCount = computed(() => friends.value.length);

  const pendingRequestsCount = computed(() =>
    receivedRequests.value.filter(req => req.status === FriendshipStatus.PENDING).length
  );

  // Actions
  async function fetchFriends() {
    if (!authStore.userId) return;

    isLoading.value = true;
    error.value = null;

    try {
      // Configurar assinatura para amizades aceitas
      const friendsChannel = supabase
        .channel('friends-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friendships',
            filter: `status=eq.${FriendshipStatus.ACCEPTED}`,
          },
          () => {
            // Recarregar amigos quando houver mudanças
            _fetchAcceptedFriends();
          }
        )
        .subscribe();

      // Salvar função para descadastrar
      subscriptions.value.friends = () => {
        friendsChannel.unsubscribe();
      };

      // Carregar amigos inicialmente
      await _fetchAcceptedFriends();

    } catch (err) {
      console.error('Erro ao buscar amigos:', err);
      error.value = 'Não foi possível carregar sua lista de amigos.';
    } finally {
      isLoading.value = false;
    }
  }

  // Função interna para buscar amizades aceitas
  async function _fetchAcceptedFriends() {
    if (!authStore.userId) return;

    try {
      // Buscar amizades onde o usuário é o remetente
      const { data: sentFriendships, error: sentError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2, status')
        .eq('user_id_1', authStore.userId)
        .eq('status', FriendshipStatus.ACCEPTED);

      if (sentError) throw sentError;

      // Buscar amizades onde o usuário é o destinatário
      const { data: receivedFriendships, error: receivedError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2, status')
        .eq('user_id_2', authStore.userId)
        .eq('status', FriendshipStatus.ACCEPTED);

      if (receivedError) throw receivedError;

      // Array para armazenar os amigos processados
      const processedFriends: Friend[] = [];

      // Processar amigos onde usuário é remetente (buscando os dados dos destinatários)
      if (sentFriendships && sentFriendships.length > 0) {
        for (const friendship of sentFriendships) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, email, name, profile_picture_url')
            .eq('id', friendship.user_id_2)
            .single();

          if (!userError && userData) {
            processedFriends.push({
              id: userData.id,
              email: userData.email,
              fullName: userData.name,
              avatarUrl: userData.profile_picture_url,
              user_id_1: authStore.userId,
              user_id_2: friendship.user_id_2
            });
          }
        }
      }

      // Processar amigos onde usuário é destinatário (buscando dados dos remetentes)
      if (receivedFriendships && receivedFriendships.length > 0) {
        for (const friendship of receivedFriendships) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, email, name, profile_picture_url')
            .eq('id', friendship.user_id_1)
            .single();

          if (!userError && userData) {
            processedFriends.push({
              id: userData.id,
              email: userData.email,
              fullName: userData.name,
              avatarUrl: userData.profile_picture_url,
              user_id_1: friendship.user_id_1,
              user_id_2: authStore.userId
            });
          }
        }
      }

      friends.value = processedFriends;

    } catch (err) {
      console.error('Erro ao buscar amigos aceitos:', err);
      throw err;
    }
  }

  async function fetchFriendRequests() {
    if (!authStore.userId) return;

    isLoading.value = true;
    error.value = null;

    try {
      // Configurar assinatura para solicitações recebidas
      const requestsChannel = supabase
        .channel('friend-requests')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friendships',
            filter: `user_id_2=eq.${authStore.userId}`,
          },
          () => {
            // Recarregar solicitações quando houver mudanças
            _fetchRequestsOnce();
          }
        )
        .subscribe();

      // Salvar função para descadastrar
      subscriptions.value.receivedRequests = () => {
        requestsChannel.unsubscribe();
      };

      // Carregar solicitações inicialmente
      await _fetchRequestsOnce();

    } catch (err) {
      console.error('Erro ao buscar solicitações de amizade:', err);
      error.value = 'Não foi possível carregar suas solicitações de amizade.';
    } finally {
      isLoading.value = false;
    }
  }

  // Função interna para buscar solicitações uma vez
  async function _fetchRequestsOnce() {
    if (!authStore.userId) return;

    try {
      // Buscar solicitações recebidas
      const { data: received, error: receivedError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2, status, created_at, requested_by_user_id')
        .eq('user_id_2', authStore.userId)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Processar solicitações recebidas
      const processedReceivedRequests: FriendRequest[] = [];

      if (received && received.length > 0) {
        for (const request of received) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, email, name, profile_picture_url')
            .eq('id', request.user_id_1)
            .single();

          if (!userError && userData) {
            processedReceivedRequests.push({
              user_id_1: request.user_id_1,
              user_id_2: request.user_id_2,
              senderEmail: userData.email,
              senderName: userData.name,
              senderPhotoUrl: userData.profile_picture_url,
              receiverId: authStore.userId!,
              status: request.status,
              createdAt: new Date(request.created_at),
              requested_by_user_id: request.requested_by_user_id
            });
          }
        }
      }

      receivedRequests.value = processedReceivedRequests;

      // Buscar solicitações enviadas
      const { data: sent, error: sentError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2, status, created_at, requested_by_user_id')
        .eq('user_id_1', authStore.userId)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Processar solicitações enviadas
      const processedSentRequests: FriendRequest[] = [];

      if (sent && sent.length > 0) {
        for (const request of sent) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, email, name, profile_picture_url')
            .eq('id', request.user_id_2)
            .single();

          if (!userError && userData) {
            processedSentRequests.push({
              user_id_1: request.user_id_1,
              user_id_2: request.user_id_2,
              senderEmail: authStore.user?.email || '',
              senderName: authStore.user?.fullName || null,
              senderPhotoUrl: authStore.user?.avatarUrl || null,
              receiverId: request.user_id_2,
              status: request.status,
              createdAt: new Date(request.created_at),
              requested_by_user_id: request.requested_by_user_id
            });
          }
        }
      }

      sentRequests.value = processedSentRequests;

    } catch (err) {
      console.error('Erro ao buscar solicitações de amizade:', err);
      throw err;
    }
  }

  async function sendFriendRequest(email: string) {
    if (!authStore.userId) {
      error.value = 'Você precisa estar logado para enviar solicitações de amizade.';
      return { success: false };
    }

    if (email === authStore.user?.email) {
      error.value = 'Você não pode adicionar a si mesmo como amigo.';
      return { success: false };
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Verificar se o usuário existe
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        throw new Error('Usuário não encontrado com este email.');
      }

      const friendId = userData.id;

      // Verificar se já existe uma amizade ou solicitação
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2, status')
        .or(`and(user_id_1.eq.${authStore.userId},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${authStore.userId})`)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = No rows returned
        throw checkError;
      }

      if (existingFriendship) {
        if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
          error.value = 'Vocês já são amigos.';
          return { success: false, alreadyFriends: true };
        }

        if (existingFriendship.status === FriendshipStatus.PENDING) {
          error.value = 'Uma solicitação de amizade já foi enviada.';
          return { success: false, pendingRequest: true };
        }
      }

      // Criar nova solicitação de amizade
      const { data: newRequest, error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id_1: authStore.userId,
          user_id_2: friendId,
          status: FriendshipStatus.PENDING,
          requested_by_user_id: authStore.userId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Adicionar à lista de solicitações enviadas
      if (newRequest) {
        sentRequests.value.unshift({
          user_id_1: authStore.userId,
          user_id_2: friendId,
          senderEmail: email,
          senderName: null,
          senderPhotoUrl: null,
          receiverId: friendId,
          status: FriendshipStatus.PENDING,
          createdAt: new Date(newRequest.created_at),
          requested_by_user_id: authStore.userId
        });
      }

      isLoading.value = false;
      return { success: true };

    } catch (err: any) {
      console.error('Erro ao enviar solicitação de amizade:', err);
      error.value = err.message || 'Não foi possível enviar a solicitação de amizade.';
      isLoading.value = false;
      return { success: false };
    }
  }

  async function searchUsers(query: string) {
    if (!authStore.userId || !query || query.length < 3) {
      return { users: [] };
    }

    try {
      // Buscar usuários que correspondem à consulta (nome ou email)
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('id, email, name, profile_picture_url')
        .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
        .neq('id', authStore.userId)
        .limit(10);

      if (searchError) throw searchError;

      // Verificar o status de amizade para cada usuário encontrado
      const usersWithStatus = await Promise.all((data || []).map(async user => {
        const { data: friendshipData } = await supabase
          .from('friendships')
          .select('user_id_1, user_id_2, status, requested_by_user_id')
          .or(`and(user_id_1.eq.${authStore.userId},user_id_2.eq.${user.id}),and(user_id_1.eq.${user.id},user_id_2.eq.${authStore.userId})`)
          .single();

        let friendshipStatus = null;
        let requestedByUserId = null;

        if (friendshipData) {
          friendshipStatus = friendshipData.status;
          requestedByUserId = friendshipData.requested_by_user_id;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          photoUrl: user.profile_picture_url,
          friendshipStatus,
          requestedByUserId,
          isSender: friendshipData?.user_id_1 === authStore.userId
        };
      }));

      return { users: usersWithStatus };

    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      error.value = 'Não foi possível buscar usuários.';
      return { users: [] };
    }
  }

  function cleanup() {
    // Cancelar todas as assinaturas
    Object.values(subscriptions.value).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });

    subscriptions.value = {};
    friends.value = [];
    receivedRequests.value = [];
    sentRequests.value = [];
  }

  return {
    // State
    friends,
    receivedRequests,
    sentRequests,
    isLoading,
    error,

    // Getters
    friendsCount,
    pendingRequestsCount,

    // Actions
    fetchFriends,
    fetchFriendRequests,
    sendFriendRequest,
    searchUsers,
    cleanup
  };
});