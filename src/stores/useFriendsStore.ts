// src/stores/useFriendsStore.ts
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './useAuthStore.js';

// Define tipos para as amizades e solicitações
interface Friend {
  id: string;
  email: string;
  name: string | null;  // Alterado de fullName para name
  photoURL: string | null;  // Alterado de avatarUrl para photoURL
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

  // Getter para solicitações recebidas (compatibilidade com o componente)
  const friendRequests = computed(() => 
    receivedRequests.value
      .filter(req => req.status === FriendshipStatus.PENDING)
      .map(req => ({
        id: `${req.user_id_1}-${req.user_id_2}`,
        fromId: req.user_id_1,
        fromEmail: req.senderEmail,
        fromName: req.senderName,
        status: req.status,
        createdAt: req.createdAt
      }))
  );
  
  // Getter para solicitações enviadas pendentes
  const sentRequestsPending = computed(() =>
    sentRequests.value
      .filter(req => req.status === FriendshipStatus.PENDING)
      .map(req => ({
        ...req,
        id: `${req.user_id_1}-${req.user_id_2}`
      }))
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
            .from('available_users')
            .select('id, name, email, avatar_url')
            .eq('id', friendship.user_id_2)
            .single();

          if (!userError && userData) {
            processedFriends.push({
              id: userData.id,
              email: userData.email || userData.id, // Usar email ou ID como fallback
              name: userData.name,
              photoURL: userData.avatar_url,
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
            .from('available_users')
            .select('id, name, email, avatar_url')
            .eq('id', friendship.user_id_1)
            .single();

          if (!userError && userData) {
            processedFriends.push({
              id: userData.id,
              email: userData.email || userData.id, // Usar email ou ID como fallback
              name: userData.name,
              photoURL: userData.avatar_url,
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
      
      // Buscar todas as solicitações relacionadas ao usuário (recebidas E enviadas)
      const { data: allRequests, error: requestsError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2, status, created_at, requested_by_user_id')
        .or(`user_id_1.eq.${authStore.userId},user_id_2.eq.${authStore.userId}`)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      
      // Processar solicitações recebidas (onde requested_by_user_id != authStore.userId)
      const processedReceivedRequests: FriendRequest[] = [];
      const processedSentRequests: FriendRequest[] = [];

      if (allRequests && allRequests.length > 0) {
        for (const request of allRequests) {
          // Determinar se é uma solicitação recebida ou enviada
          const isRequestFromCurrentUser = request.requested_by_user_id === authStore.userId;
          
          // Determinar o ID do outro usuário na relação (remetente ou destinatário)
          const otherUserId = request.user_id_1 === authStore.userId 
            ? request.user_id_2 
            : request.user_id_1;
          

          
          // Buscar dados do outro usuário usando available_users ao invés de profiles
          const { data: userData, error: userError } = await supabase
            .from('available_users')
            .select('id, name, email, avatar_url')
            .eq('id', otherUserId)
            .single();

          if (userError) {
            console.error('Erro ao buscar perfil de usuário:', userError);
            continue;
          }

          // Criar objeto de solicitação 
          const friendRequest: FriendRequest = {
            user_id_1: request.user_id_1,
            user_id_2: request.user_id_2,
            senderEmail: userData.email || userData.id, // Usar email ou ID
            senderName: userData.name || 'Usuário',
            senderPhotoUrl: userData.avatar_url,
            receiverId: isRequestFromCurrentUser ? request.user_id_2 : authStore.userId,
            status: request.status,
            createdAt: new Date(request.created_at),
            requested_by_user_id: request.requested_by_user_id
          };

          // Adicionar à lista apropriada
          if (isRequestFromCurrentUser) {
            processedSentRequests.push(friendRequest);
          } else {
            processedReceivedRequests.push(friendRequest);
          }
        }
      }

      
      // Atualizar as referências
      receivedRequests.value = processedReceivedRequests;
      sentRequests.value = processedSentRequests;

    } catch (err) {
      console.error('Erro ao buscar solicitações de amizade:', err);
      throw err;
    }
  }

  // Buscar solicitações enviadas
  async function fetchSentRequests() {
    if (!authStore.userId) return;
    
    isLoading.value = true;
    
    try {
      const { data: sent, error: sentError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2, status, created_at, requested_by_user_id')
        .eq('requested_by_user_id', authStore.userId)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Processar solicitações enviadas
      const processedSentRequests: FriendRequest[] = [];

      if (sent && sent.length > 0) {
        for (const request of sent) {
          // Se o usuário atual é o user_id_1, então o destinatário é user_id_2, e vice-versa
          const targetUserId = request.user_id_1 === authStore.userId 
            ? request.user_id_2 
            : request.user_id_1;
          
          // Buscar o perfil do destinatário usando available_users em vez de profiles
          const { data: userData, error: userError } = await supabase
            .from('available_users')
            .select('id, name, email, avatar_url')
            .eq('id', targetUserId)
            .single();

          if (!userError && userData) {
            processedSentRequests.push({
              user_id_1: request.user_id_1,
              user_id_2: request.user_id_2,
              senderEmail: userData.email || userData.id,
              senderName: userData.name || 'Usuário',
              senderPhotoUrl: userData.avatar_url,
              receiverId: targetUserId,
              status: request.status,
              createdAt: new Date(request.created_at),
              requested_by_user_id: request.requested_by_user_id
            });
          }
        }
      }

      sentRequests.value = processedSentRequests;
      
    } catch (err) {
      console.error('Erro ao buscar solicitações enviadas:', err);
      throw err;
    } finally {
      isLoading.value = false;
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
      // Verificar se o usuário existe na tabela available_users
      const { data: userData, error: userError } = await supabase
        .from('available_users')
        .select('id, email')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        // Se não encontrar na tabela available_users, tentar buscar pelo ID em vez do email
        // Útil quando o email é na verdade o ID do usuário
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidPattern.test(email)) {
          const { data: idUserData, error: idUserError } = await supabase
            .from('available_users')
            .select('id, email')
            .eq('id', email)
            .single();
            
          if (idUserError || !idUserData) {
            throw new Error('Usuário não encontrado com este email ou ID.');
          }
          
          // Usar os dados encontrados pelo ID
          const friendId = idUserData.id;
          
          return await _processFriendRequest(friendId);
        } else {
          throw new Error('Usuário não encontrado com este email ou ID.');
        }
      }

      const friendId = userData.id;
      return await _processFriendRequest(friendId);

    } catch (err: any) {
      console.error('Erro ao enviar solicitação de amizade:', err);
      error.value = err.message || 'Não foi possível enviar a solicitação de amizade.';
      isLoading.value = false;
      return { success: false };
    }
  }
  
  // Função interna para processar solicitação de amizade após encontrar o ID do usuário
  async function _processFriendRequest(friendId: string) {
    try {
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

      // Ordenar os IDs para satisfazer a restrição check_users_order_and_different
      // Essa restrição geralmente requer que user_id_1 < user_id_2
      let firstUserId, secondUserId;
      
      // Comparar os UUIDs como strings
      if (authStore.userId < friendId) {
        firstUserId = authStore.userId;
        secondUserId = friendId;
      } else {
        firstUserId = friendId;
        secondUserId = authStore.userId;
      }


      
      // Criar nova solicitação de amizade
      const { data: newRequest, error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id_1: firstUserId,
          user_id_2: secondUserId,
          status: FriendshipStatus.PENDING,
          requested_by_user_id: authStore.userId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Buscar informações completas do usuário
      const { data: userData } = await supabase
        .from('available_users')
        .select('id, name, email, avatar_url')
        .eq('id', friendId)
        .single();

      // Adicionar à lista de solicitações enviadas
      if (newRequest) {
        sentRequests.value.unshift({
          user_id_1: firstUserId,
          user_id_2: secondUserId,
          senderEmail: userData?.email || friendId,
          senderName: userData?.name || null,
          senderPhotoUrl: userData?.avatar_url || null,
          receiverId: friendId,
          status: FriendshipStatus.PENDING,
          createdAt: new Date(newRequest.created_at),
          requested_by_user_id: authStore.userId
        });
      }

      isLoading.value = false;
      return { success: true };

    } catch (err: any) {
      console.error('Erro ao processar solicitação de amizade:', err);
      error.value = err.message || 'Não foi possível enviar a solicitação de amizade.';
      isLoading.value = false;
      return { success: false };
    }
  }

  // Buscar livros de um amigo
  async function fetchFriendBooks(friendId: string) {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', friendId);
        
      if (error) throw error;
      
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar livros do amigo:', err);
      return [];
    }
  }

  // Aceitar solicitação de amizade
  async function acceptFriendRequest(requestId: string) {
    if (!authStore.userId) {
      error.value = 'Você precisa estar logado para aceitar solicitações de amizade.';
      return { success: false };
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      
      // Extrair os IDs de usuário do requestId composto
      // O formato do ID deve ser um UUID completo, não apenas parte dele
      // O caractere de separação pode estar em qualquer posição
      // Precisamos encontrar dois UUIDs válidos na string
      
      const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
      const matches = requestId.match(uuidPattern);
      
      if (!matches || matches.length !== 2) {
        console.error("Formato de ID inválido:", requestId);
        throw new Error("ID de solicitação inválido. Formato esperado: UUID-UUID");
      }
      
      const user_id_1 = matches[0];
      const user_id_2 = matches[1];
      
      
      // Atualizar o status para aceito
      const { data: updateData, error: updateError } = await supabase
        .from('friendships')
        .update({ status: FriendshipStatus.ACCEPTED })
        .match({ user_id_1, user_id_2 })
        .select();
        
      if (updateError) {
        console.error("Erro na atualização:", updateError);
        throw updateError;
      }
      
      
      // Atualizar listas locais
      await fetchFriendRequests();
      await fetchFriends();
      
      isLoading.value = false;
      return { success: true };
      
    } catch (err: any) {
      console.error('Erro ao aceitar solicitação:', err);
      error.value = err.message || 'Não foi possível aceitar a solicitação.';
      isLoading.value = false;
      return { success: false };
    }
  }
  
  // Rejeitar solicitação de amizade
  async function rejectFriendRequest(requestId: string) {
    if (!authStore.userId) {
      error.value = 'Você precisa estar logado para rejeitar solicitações de amizade.';
      return { success: false };
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      
      // Extrair os IDs de usuário do requestId composto usando regex
      const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
      const matches = requestId.match(uuidPattern);
      
      if (!matches || matches.length !== 2) {
        console.error("Formato de ID inválido:", requestId);
        throw new Error("ID de solicitação inválido. Formato esperado: UUID-UUID");
      }
      
      const user_id_1 = matches[0];
      const user_id_2 = matches[1];
      
      
      // Atualizar o status para rejeitado
      const { error: updateError } = await supabase
        .from('friendships')
        .update({ status: FriendshipStatus.REJECTED })
        .match({ user_id_1, user_id_2 });
        
      if (updateError) throw updateError;
      
      // Atualizar lista local
      await fetchFriendRequests();
      
      isLoading.value = false;
      return { success: true };
      
    } catch (err: any) {
      console.error('Erro ao rejeitar solicitação:', err);
      error.value = err.message || 'Não foi possível rejeitar a solicitação.';
      isLoading.value = false;
      return { success: false };
    }
  }
  
  // Cancelar solicitação de amizade
  async function cancelFriendRequest(requestId: string) {
    if (!authStore.userId) {
      error.value = 'Você precisa estar logado para cancelar solicitações de amizade.';
      return false;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      
      // Extrair os IDs de usuário do requestId composto usando regex
      const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
      const matches = requestId.match(uuidPattern);
      
      if (!matches || matches.length !== 2) {
        console.error("Formato de ID inválido:", requestId);
        throw new Error("ID de solicitação inválido. Formato esperado: UUID-UUID");
      }
      
      const user_id_1 = matches[0];
      const user_id_2 = matches[1];

      
      // Deletar o registro de amizade
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .match({ user_id_1, user_id_2 });
        
      if (deleteError) throw deleteError;
      
      // Atualizar listas locais
      await fetchSentRequests();
      
      isLoading.value = false;
      return true;
      
    } catch (err: any) {
      console.error('Erro ao cancelar solicitação:', err);
      error.value = err.message || 'Não foi possível cancelar a solicitação.';
      isLoading.value = false;
      return false;
    }
  }
  
  // Remover amigo
  async function removeFriend(friendshipId: string) {
    if (!authStore.userId) {
      error.value = 'Você precisa estar logado para remover amigos.';
      return { success: false };
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Extrair os IDs de usuário do friendshipId composto
      const [user_id_1, user_id_2] = friendshipId.split('-');
      
      // Remover o registro de amizade
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .match({ user_id_1, user_id_2 });
        
      if (deleteError) throw deleteError;
      
      // Atualizar a lista local
      await fetchFriends();
      
      isLoading.value = false;
      return { success: true };
      
    } catch (err: any) {
      console.error('Erro ao remover amigo:', err);
      error.value = err.message || 'Não foi possível remover o amigo.';
      isLoading.value = false;
      return { success: false };
    }
  }

  // Busca usuários usando a tabela available_users
  async function searchUsers(query: string) {
    if (!authStore.userId || !query || query.length < 3) {
      return { users: [] };
    }

    try {

      
      // Verificar se estamos buscando por um UUID
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let searchQuery;
      
      if (uuidPattern.test(query)) {
        // Se for um UUID, buscar exatamente pelo ID
        searchQuery = await supabase
          .from('available_users')
          .select('id, name, email, avatar_url')
          .neq('id', authStore.userId)
          .eq('id', query);
      } else {
        // Se não for um UUID, buscar pelo nome ou email usando ILIKE
        searchQuery = await supabase
          .from('available_users')
          .select('id, name, email, avatar_url')
          .neq('id', authStore.userId)
          .or(`name.ilike.%${query}%,email.ilike.%${query}%`);
      }

      const { data, error: searchError } = searchQuery;
      
      if (searchError) {
        console.error("Erro na busca:", searchError);
        throw searchError;
      }

      
      // Verificar o status de amizade para cada usuário encontrado
      const usersWithStatus = await Promise.all((data || []).map(async user => {
        
        // Verificar se já existe uma amizade entre os usuários
        const { data: friendshipData, error: friendshipError } = await supabase
          .from('friendships')
          .select('user_id_1, user_id_2, status, requested_by_user_id')
          .or(`and(user_id_1.eq.${authStore.userId},user_id_2.eq.${user.id}),and(user_id_1.eq.${user.id},user_id_2.eq.${authStore.userId})`)
          .single();

  
        let friendshipStatus = null;
        let friendshipId = null;
        let isSender = false;
        let requestedByUserId = null;

        if (friendshipData) {
          friendshipStatus = friendshipData.status;
          requestedByUserId = friendshipData.requested_by_user_id;
          // Criar um ID composto já que não existe uma coluna 'id'
          friendshipId = `${friendshipData.user_id_1}-${friendshipData.user_id_2}`;
          isSender = friendshipData.user_id_1 === authStore.userId;
        }

        return {
          id: user.id,
          name: user.name || 'Usuário',
          email: user.email || user.id, // Usar o email real agora
          photoUrl: user.avatar_url, // Usar o novo campo avatar_url
          friendshipStatus,
          friendshipId,
          requestedByUserId,
          isSender
        };
      }));
      
      return { users: usersWithStatus };

    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      error.value = 'Não foi possível buscar usuários.';
      return { users: [] };
    }
  }

  // Busca todos os usuários da plataforma exceto o usuário atual
  async function fetchAllUsers() {
    if (!authStore.userId) {
      return { users: [] };
    }

    try {
      
      // Buscar todos os perfis exceto o próprio usuário
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('*');
      
      if (searchError) {
        console.error("Erro ao buscar perfis:", searchError);
        throw searchError;
      }
      
      
      // Filtrar apenas usuários diferentes do atual
      const filteredUsers = data?.filter(user => user.id !== authStore.userId) || [];
      
      // Se não encontrar nenhum outro usuário, adicionar um usuário fictício para testes
      let usersToProcess = filteredUsers;
      if (filteredUsers.length === 0) {
        usersToProcess = [{
          id: "58050c52-d795-4389-908a-2cabe85dc7e2", // ID fixo para testes
          name: "Usuário Exemplo",
          profile_picture_url: null
        }];
      }
      
      // Verificar o status de amizade para cada usuário
      const usersWithStatus = await Promise.all(usersToProcess.map(async user => {
        
        // Verificar se já existe uma amizade entre os usuários
        const { data: friendshipData, error: friendshipError } = await supabase
          .from('friendships')
          .select('user_id_1, user_id_2, status, requested_by_user_id')
          .or(`and(user_id_1.eq.${authStore.userId},user_id_2.eq.${user.id}),and(user_id_1.eq.${user.id},user_id_2.eq.${authStore.userId})`)
          .single();

        let friendshipStatus = null;
        let friendshipId = null;
        let isSender = false;
        let requestedByUserId = null;

        if (friendshipData && !friendshipError) {
          friendshipStatus = friendshipData.status;
          requestedByUserId = friendshipData.requested_by_user_id;
          // Criar um ID composto já que não existe uma coluna 'id'
          friendshipId = `${friendshipData.user_id_1}-${friendshipData.user_id_2}`;
          isSender = friendshipData.user_id_1 === authStore.userId;
        }

        return {
          id: user.id,
          name: user.name || 'Usuário',
          email: user.id, // Usamos o ID como substituto do email
          photoUrl: user.profile_picture_url,
          friendshipStatus,
          friendshipId,
          requestedByUserId,
          isSender
        };
      }));
      
      return { users: usersWithStatus };

    } catch (err) {
      console.error('Erro ao buscar todos os usuários:', err);
      error.value = 'Não foi possível carregar a lista de usuários.';
      

      return { 
        users: [{
          id: "58050c52-d795-4389-908a-2cabe85dc7e2", // ID fixo para testes
          name: "Usuário Exemplo",
          email: "58050c52-d795-4389-908a-2cabe85dc7e2",
          photoUrl: null,
          friendshipStatus: null,
          friendshipId: null,
          requestedByUserId: null,
          isSender: false
        }]
      };
    }
  }

  // Busca todos os usuários disponíveis usando a tabela available_users
  async function fetchAllUsersPublic() {
    if (!authStore.userId) {
      return { users: [] };
    }

    try {
      
      // Buscar todos os perfis exceto o próprio usuário, usando available_users
      const { data, error: searchError } = await supabase
        .from('available_users')
        .select('id, name, email, avatar_url, available_for_friends')
        .neq('id', authStore.userId)
        .eq('available_for_friends', true); // Apenas usuários que estão disponíveis para amizades
      
      if (searchError) {
        console.error("Erro ao buscar usuários disponíveis:", searchError);
        throw searchError;
      }
      
      
      // Verificar o status de amizade para cada usuário
      const usersWithStatus = await Promise.all((data || []).map(async user => {
        
        // Verificar se já existe uma amizade entre os usuários
        const { data: friendshipData, error: friendshipError } = await supabase
          .from('friendships')
          .select('user_id_1, user_id_2, status, requested_by_user_id')
          .or(`and(user_id_1.eq.${authStore.userId},user_id_2.eq.${user.id}),and(user_id_1.eq.${user.id},user_id_2.eq.${authStore.userId})`)
          .single();

        let friendshipStatus = null;
        let friendshipId = null;
        let isSender = false;
        let requestedByUserId = null;

        if (friendshipData && !friendshipError) {
          friendshipStatus = friendshipData.status;
          requestedByUserId = friendshipData.requested_by_user_id;
          // Criar um ID composto já que não existe uma coluna 'id'
          friendshipId = `${friendshipData.user_id_1}-${friendshipData.user_id_2}`;
          isSender = friendshipData.user_id_1 === authStore.userId;
        }

        return {
          id: user.id,
          name: user.name || 'Usuário sem nome',
          email: user.email || `${user.id}@example.com`,
          photoUrl: user.avatar_url,
          friendshipStatus,
          friendshipId,
          requestedByUserId,
          isSender
        };
      }));
      return { users: usersWithStatus };

    } catch (err) {
      console.error('Erro ao buscar todos os usuários:', err);
      error.value = 'Não foi possível carregar a lista de usuários.';
      return { users: [] };
    }
  }

  // Busca diretamente todos os usuários da tabela auth.users
  async function fetchAuthUsers() {
    try {     
      // Tentativa direta via API de admin
      let authUsers = null;
      try {
        const { data, error } = await supabase.auth.admin.listUsers();
        if (!error) {
          authUsers = data;
        } 
      } catch (err) {
        console.error("Exceção ao chamar auth.admin.listUsers:", err);
      }
      
      // Tentativa alternativa usando funções do Supabase
      try {
        // Esta abordagem usa uma função do Supabase que deve existir no seu projeto
        const { data, error } = await supabase.rpc('get_all_users');
        if (!error) {
          return { users: data };
        }
      } catch (err) {
        console.error("Exceção ao chamar RPC get_all_users:", err);
      }
      
      // Tentativa via query SQL (pode exigir permissões específicas)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .limit(20);
          
        if (!error) {
          return { users: data };
        } 
      } catch (err) {
        console.error("Exceção ao consultar diretamente a tabela users:", err);
      }
      
      // Se tivermos os usuários da primeira tentativa, retorná-los
      if (authUsers) {
        return { users: authUsers.users || [] };
      }
      
      return { users: [] };

    } catch (err) {
      console.error('Erro geral ao buscar usuários auth:', err);
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
    friendRequests,
    sentRequestsPending,

    // Actions
    fetchFriends,
    fetchFriendRequests,
    fetchSentRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    fetchFriendBooks,
    searchUsers,
    fetchAllUsers,
    fetchAllUsersPublic, // Nova função pública para listar usuários
    fetchAuthUsers, 
    cleanup
  };
});