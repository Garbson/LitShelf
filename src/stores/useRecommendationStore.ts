import { supabase } from '@/supabase';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useAuthStore } from './useAuthStore';
import { useBookshelfStore } from './useBookshelfStore';

// Enum para status de recomendação
enum RecommendationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

// Interface para recomendações simuladas/mockadas
interface MockRecommendation {
  id: string;
  bookId: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  senderPhotoURL?: string;
  recipientId: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhotoURL?: string;
  status: string;
  message: string;
  createdAt: Date;
  acceptedAt?: Date | null;
  rejectedAt?: Date | null;
  book: {
    id: string;
    title: string;
    authors?: string;
    coverUrl?: string;
    isbn?: string;
  };
}

export const useRecommendationStore = defineStore('recommendation', () => {
  const authStore = useAuthStore();
  const bookshelfStore = useBookshelfStore();
  
  // Estado
  const receivedRecommendations = ref<any[]>([]);
  const sentRecommendations = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const unsubscribe = ref<(() => void) | null>(null);
  const useLocalStorage = ref<boolean>(false);

  // Getters
  const pendingRecommendationsCount = computed(() => {
    return receivedRecommendations.value.filter(rec => rec.status === RecommendationStatus.PENDING).length;
  });

  const pendingRecommendations = computed(() => {
    return receivedRecommendations.value.filter(rec => rec.status === RecommendationStatus.PENDING);
  });

  const acceptedRecommendations = computed(() => {
    return receivedRecommendations.value.filter(rec => rec.status === RecommendationStatus.ACCEPTED);
  });

  const rejectedRecommendations = computed(() => {
    return receivedRecommendations.value.filter(rec => rec.status === RecommendationStatus.REJECTED);
  });

  const sentPendingRecommendations = computed(() => {
    return sentRecommendations.value.filter(rec => rec.status === RecommendationStatus.PENDING);
  });

  const sentAcceptedRecommendations = computed(() => {
    return sentRecommendations.value.filter(rec => rec.status === RecommendationStatus.ACCEPTED);
  });

  const sentRejectedRecommendations = computed(() => {
    return sentRecommendations.value.filter(rec => rec.status === RecommendationStatus.REJECTED);
  });

  const groupedRecommendations = computed(() => {
    const groups: Record<string, any[]> = {
      pending: [],
      accepted: [],
      rejected: []
    };

    receivedRecommendations.value.forEach(rec => {
      if (groups[rec.status]) {
        groups[rec.status].push(rec);
      }
    });

    return groups;
  });

  // Ações
  async function fetchReceivedRecommendations() {
    if (!authStore.userId) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Se usamos localStorage, carregamos de lá primeiro
      if (useLocalStorage.value) {
        const storedRecs = localStorage.getItem('receivedRecommendations');
        if (storedRecs) {
          const parsed = JSON.parse(storedRecs);
          // Converter strings de data para objetos Date
          receivedRecommendations.value = parsed.map((rec: any) => ({
            ...rec,
            createdAt: new Date(rec.createdAt),
            acceptedAt: rec.acceptedAt ? new Date(rec.acceptedAt) : null,
            rejectedAt: rec.rejectedAt ? new Date(rec.rejectedAt) : null
          }));
          return;
        }
      }

      // Tentar carregar do Supabase apenas se não estamos usando localStorage
      await _fetchReceivedRecommendationsOnce();
    } catch (err) {
      console.error('Erro ao buscar recomendações recebidas:', err);
      error.value = 'Não foi possível carregar suas recomendações de livros.';
      
      // Se houve erro, usar localStorage
      useLocalStorage.value = true;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Função privada para buscar recomendações recebidas uma vez
  async function _fetchReceivedRecommendationsOnce() {
    if (!authStore.userId || useLocalStorage.value) return;
    
    try {
      // Verificamos se a view recommendations_view existe
      const { data: testData, error: testError } = await supabase
        .from('recommendations_view')
        .select('id')
        .limit(1);
      
      if (testError) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('recommendations')
          .select('id')
          .limit(1);
          
        if (fallbackError) {
          if (fallbackError.code === '42P01') { // Tabela não existe
            useLocalStorage.value = true;
            _createMockRecommendations();
            return;
          }
          throw fallbackError;
        }
      }
      
      // Se chegarmos aqui, a view existe, usamos ela para buscar os dados completos
      const { data, error: viewError } = await supabase
        .from('recommendations_view')
        .select('*')
        .eq('to_user_id', authStore.userId)
        .order('created_at', { ascending: false });
      
      if (viewError) {
        console.error('Erro ao buscar recomendações da view:', viewError);
        
        // Se falhar na view, tentamos a consulta com a tabela regular
        return await _fallbackFetchRecommendations();
      }
      
      // Se não tiver dados, inicializa um array vazio em vez de mostrar erro
      if (!data || data.length === 0) {
        receivedRecommendations.value = [];
        return;
      }
          
      // Mapear os dados da view para o formato esperado no app
      receivedRecommendations.value = data.map(rec => {
        return {
          id: rec.id,
          bookId: rec.book_id,
          senderId: rec.from_user_id,
          senderName: rec.sender_name || 'Usuário',
          senderEmail: rec.sender_email,
          senderPhotoURL: rec.sender_avatar_url,
          recipientId: rec.to_user_id,
          status: rec.status,
          message: rec.message || '',
          createdAt: new Date(rec.created_at),
          acceptedAt: rec.status === 'accepted' ? new Date(rec.updated_at) : null,
          rejectedAt: rec.status === 'rejected' ? new Date(rec.updated_at) : null,
          book: {
            id: rec.book_id,
            title: rec.book_title,
            authors: rec.book_author,
            coverUrl: rec.book_cover_url,
            description: rec.book_description
          }
        };
      });
      
      // Salvar no localStorage como backup
      localStorage.setItem('receivedRecommendations', 
        JSON.stringify(receivedRecommendations.value));    
    } catch (err) {
      console.error('Erro ao buscar recomendações recebidas:', err);
      error.value = 'Não foi possível carregar suas recomendações de livros.';
      
      // Se ocorrer erro, criar recomendações mockadas para demonstração
      useLocalStorage.value = true;
      _createMockRecommendations();
    }
  }
  
  // Método auxiliar para buscar recomendações da forma antiga (caso a view falhe)
  async function _fallbackFetchRecommendations() {
    // Se chegou aqui, a tabela existe, tentamos a consulta completa para buscar recomendações recebidas pelo usuário atual
    const query = supabase
      .from('recommendations')
      .select(`
        id,
        book_id,
        from_user_id,
        message,
        status,
        created_at,
        updated_at
      `)
      .eq('to_user_id', authStore.userId)
      .order('created_at', { ascending: false });
    
    const { data, error: supaError } = await query;
    
    if (supaError) throw supaError;
    
    // Se não tiver dados, inicializa um array vazio em vez de mostrar erro
    if (!data || data.length === 0) {
      receivedRecommendations.value = [];
      return;
    }
    
    const userIds = [...new Set(data.map(rec => rec.from_user_id))];
    const bookIds = [...new Set(data.map(rec => rec.book_id))];
    
    // Buscar usuários
    const { data: usersData, error: usersError } = await supabase
      .from('available_users')  // Usando a tabela available_users como especificado
      .select('id, name, email, avatar_url')
      .in('id', userIds);

    if (usersError) {
      console.error('Erro ao buscar informações dos usuários:', usersError);
    }
      
    const usersMap = (usersData || []).reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
    
    // Buscar livros
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select('id, title, author, cover_image_url, description, google_book_id')
      .in('id', bookIds);
      
    if (booksError) {
      console.error('Erro ao buscar informações dos livros:', booksError);
    }

    const booksMap = (booksData || []).reduce((acc, book) => {
      acc[book.id] = book;
      return acc;
    }, {});
    
    // Mapear os dados completos
    receivedRecommendations.value = data.map(rec => {
      const user = usersMap[rec.from_user_id] || {};
      const book = booksMap[rec.book_id] || {};
      
      return {
        id: rec.id,
        bookId: rec.book_id,
        senderId: rec.from_user_id,
        senderName: user.name || 'Usuário',
        senderEmail: user.email,
        senderPhotoURL: user.avatar_url,
        recipientId: authStore.userId,
        status: rec.status,
        message: rec.message || '',
        createdAt: new Date(rec.created_at),
        acceptedAt: rec.status === 'accepted' ? new Date(rec.updated_at) : null,
        rejectedAt: rec.status === 'rejected' ? new Date(rec.updated_at) : null,
        book: {
          id: book.id,
          title: book.title,
          authors: book.author,
          coverUrl: book.cover_image_url,
          description: book.description,
          isbn: book.google_book_id
        }
      };
    });
    
    // Salvar no localStorage como backup
    localStorage.setItem('receivedRecommendations', 
      JSON.stringify(receivedRecommendations.value));

  }
  
  async function fetchRecommendations() {
    if (!authStore.userId) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Buscar recomendações recebidas (com dados mockados se necessário)
      await fetchReceivedRecommendations();
      
      // Buscar recomendações enviadas (usando localStorage se necessário)
      if (useLocalStorage.value) {
        const storedSentRecs = localStorage.getItem('sentRecommendations');
        if (storedSentRecs) {
          const parsed = JSON.parse(storedSentRecs);
          sentRecommendations.value = parsed.map((rec: any) => ({
            ...rec,
            createdAt: new Date(rec.createdAt),
            acceptedAt: rec.acceptedAt ? new Date(rec.acceptedAt) : null,
            rejectedAt: rec.rejectedAt ? new Date(rec.rejectedAt) : null
          }));
        } else {
          // Se não houver dados no localStorage, criar mockados
          _createMockSentRecommendations();
        }
        return;
      }
      
      // Tentar buscar do Supabase se não estamos usando localStorage
      const { data, error: supaError } = await supabase
        .from('recommendations')
        .select(`
          id,
          book_id,
          to_user_id,
          message,
          status,
          created_at,
          updated_at
        `)
        .eq('from_user_id', authStore.userId) // Usar from_user_id em vez de sender_id
        .order('created_at', { ascending: false });
      
      if (supaError) {
        if (supaError.code === '42P01') { // Tabela não existe
          useLocalStorage.value = true;
          _createMockSentRecommendations();
          return;
        }
        throw supaError;
      }
      
      // Se não tiver dados, inicializa um array vazio em vez de mostrar erro
      if (!data || data.length === 0) {
        sentRecommendations.value = [];
        return;
      }
      
      
      // Buscar perfis para os destinatários
      const recipientIds = [...new Set(data.map(rec => rec.to_user_id))];
      const { data: recipientsData, error: recipientsError } = await supabase
        .from('available_users') // Buscar informações dos usuários na tabela correta
        .select('id, name, email, avatar_url')
        .in('id', recipientIds);
      
      if (recipientsError) {
        console.error('Erro ao buscar informações dos destinatários:', recipientsError);
      }
      
      const recipientsMap = (recipientsData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
      
      // Buscar detalhes dos livros
      const bookIds = [...new Set(data.map(rec => rec.book_id))];
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('id, title, author, cover_image_url, google_book_id')
        .in('id', bookIds);
      
      if (booksError) {
        console.error('Erro ao buscar informações dos livros:', booksError);
      }
      
      const booksMap = (booksData || []).reduce((acc, book) => {
        acc[book.id] = book;
        return acc;
      }, {});
      
      sentRecommendations.value = data.map(rec => {
        const recipient = recipientsMap[rec.to_user_id] || {};
        const book = booksMap[rec.book_id] || {};
        
        const wasAccepted = rec.status === 'accepted';
        const wasRejected = rec.status === 'rejected';
        
        return {
          id: rec.id,
          bookId: rec.book_id,
          recipientId: rec.to_user_id,
          recipientName: recipient.name || 'Usuário',
          recipientEmail: recipient.email,
          recipientPhotoURL: recipient.avatar_url,
          senderId: authStore.userId,
          status: rec.status,
          message: rec.message || '',
          createdAt: new Date(rec.created_at),
          // Para recomendações aceitas e rejeitadas, podemos usar updated_at como data da ação
          acceptedAt: wasAccepted ? new Date(rec.updated_at) : null,
          rejectedAt: wasRejected ? new Date(rec.updated_at) : null,
          book: {
            id: book.id,
            title: book.title,
            authors: book.author,
            coverUrl: book.cover_image_url,
            isbn: book.google_book_id
          }
        };
      });
      
      
      // Salvar no localStorage para próximos acessos
      localStorage.setItem('sentRecommendations', 
        JSON.stringify(sentRecommendations.value));
    } catch (err) {
      console.error('Erro ao buscar recomendações enviadas:', err);
      error.value = 'Não foi possível carregar suas recomendações enviadas.';
      
      // Se ocorrer erro, usar dados mockados
      useLocalStorage.value = true;
      _createMockSentRecommendations();
    } finally {
      isLoading.value = false;
    }
  }
  
  // Função para criar recomendações mockadas para demonstração
  function _createMockRecommendations() {
    // Verificar se já temos dados no localStorage
    const storedRecs = localStorage.getItem('receivedRecommendations');
    if (storedRecs) {
      const parsed = JSON.parse(storedRecs);
      receivedRecommendations.value = parsed.map((rec: any) => ({
        ...rec,
        createdAt: new Date(rec.createdAt),
        acceptedAt: rec.acceptedAt ? new Date(rec.acceptedAt) : null,
        rejectedAt: rec.rejectedAt ? new Date(rec.rejectedAt) : null
      }));
      return;
    }
    
    // Criar recomendações mockadas para demonstração
    const mockBooks = bookshelfStore.books.slice(0, 3);
    
    // Se não temos livros, usamos dados estáticos
    const mockRecommendations: MockRecommendation[] = mockBooks.length > 0 
      ? mockBooks.map((book, index) => ({
          id: `mock-${index}`,
          bookId: book.id,
          senderId: `sender-${index}`,
          senderName: `Amigo ${index + 1}`,
          senderEmail: `amigo${index + 1}@exemplo.com`,
          senderPhotoURL: `https://i.pravatar.cc/150?img=${index + 10}`,
          recipientId: authStore.userId || 'current-user',
          status: index === 0 ? RecommendationStatus.PENDING : 
                 index === 1 ? RecommendationStatus.ACCEPTED : RecommendationStatus.REJECTED,
          message: `Recomendo este livro para você! Acho que vai gostar muito de "${book.title}". ${index === 0 ? 'Aguardo sua resposta!' : 
                    index === 1 ? 'Fico feliz que tenha aceitado!' : 'Tudo bem, quem sabe na próxima.'}`,
          createdAt: new Date(Date.now() - (index * 86400000)),
          acceptedAt: index === 1 ? new Date(Date.now() - (index * 43200000)) : null,
          rejectedAt: index === 2 ? new Date(Date.now() - (index * 43200000)) : null,
          book: {
            id: book.id,
            title: book.title,
            authors: book.author,
            coverUrl: book.cover_image_url,
            isbn: book.google_book_id
          }
        }))
      : [
          {
            id: 'mock-1',
            bookId: 'book-1',
            senderId: 'sender-1',
            senderName: 'Maria Silva',
            senderEmail: 'maria@exemplo.com',
            senderPhotoURL: 'https://i.pravatar.cc/150?img=10',
            recipientId: authStore.userId || 'current-user',
            status: RecommendationStatus.PENDING,
            message: 'Acabei de ler este livro e achei que você iria gostar. É sobre desenvolvimento pessoal e liderança.',
            createdAt: new Date(Date.now() - 86400000),
            book: {
              id: 'book-1',
              title: 'O Poder do Hábito',
              authors: 'Charles Duhigg',
              coverUrl: 'https://m.media-amazon.com/images/I/71QKQ9+DCQL._AC_UF1000,1000_QL80_.jpg'
            }
          },
          {
            id: 'mock-2',
            bookId: 'book-2',
            senderId: 'sender-2',
            senderName: 'João Santos',
            senderEmail: 'joao@exemplo.com',
            senderPhotoURL: 'https://i.pravatar.cc/150?img=11',
            recipientId: authStore.userId || 'current-user',
            status: RecommendationStatus.ACCEPTED,
            message: 'Este é um dos meus favoritos de todos os tempos. Recomendo muito!',
            createdAt: new Date(Date.now() - 172800000),
            acceptedAt: new Date(Date.now() - 86400000),
            book: {
              id: 'book-2',
              title: 'Sapiens: Uma Breve História da Humanidade',
              authors: 'Yuval Noah Harari',
              coverUrl: 'https://m.media-amazon.com/images/I/71-ghLT4qQL._AC_UF1000,1000_QL80_.jpg'
            }
          },
          {
            id: 'mock-3',
            bookId: 'book-3',
            senderId: 'sender-3',
            senderName: 'Ana Oliveira',
            senderEmail: 'ana@exemplo.com',
            senderPhotoURL: 'https://i.pravatar.cc/150?img=12',
            recipientId: authStore.userId || 'current-user',
            status: RecommendationStatus.REJECTED,
            message: 'Acho que você vai gostar deste livro de ficção científica.',
            createdAt: new Date(Date.now() - 259200000),
            rejectedAt: new Date(Date.now() - 172800000),
            book: {
              id: 'book-3',
              title: 'Duna',
              authors: 'Frank Herbert',
              coverUrl: 'https://m.media-amazon.com/images/I/81F303elPdL._AC_UF1000,1000_QL80_.jpg'
            }
          }
        ];

    receivedRecommendations.value = mockRecommendations;
    
    // Salvar no localStorage para próximos acessos
    localStorage.setItem('receivedRecommendations', 
      JSON.stringify(receivedRecommendations.value));
  }
  
  async function sendRecommendation(bookId: string, friendIds: string[], message?: string) {
    if (!authStore.userId) {
      error.value = 'Você precisa estar logado para enviar recomendações.';
      return { success: false };
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Se estamos usando localStorage, não tentamos enviar para o Supabase
      if (useLocalStorage.value) {
        // Buscar detalhes do livro recomendado
        const book = bookshelfStore.books.find(b => b.id === bookId);
        
        if (!book) {
          throw new Error('Livro não encontrado na estante');
        }
        
        // Criar novas recomendações mockadas
        const newRecommendations = friendIds.map((friendId, index) => {
          const now = new Date();
          const mockId = `sent-mock-${Date.now()}-${index}`;
          
          return {
            id: mockId,
            bookId: book.id,
            recipientId: friendId,
            recipientName: `Amigo ${friendId.substring(0, 5)}`,
            recipientEmail: `amigo_${friendId.substring(0, 5)}@exemplo.com`,
            recipientPhotoURL: `https://i.pravatar.cc/150?img=${20 + index}`,
            senderId: authStore.userId || 'current-user',
            status: RecommendationStatus.PENDING,
            message: message || 'Recomendo este livro para você!',
            createdAt: now,
            book: {
              id: book.id,
              title: book.title,
              authors: book.author,
              coverUrl: book.cover_image_url,
              isbn: book.google_book_id
            }
          };
        });
        
        // Adicionar as novas recomendações à lista
        sentRecommendations.value = [
          ...newRecommendations,
          ...sentRecommendations.value
        ];
        
        // Salvar no localStorage
        localStorage.setItem('sentRecommendations', 
          JSON.stringify(sentRecommendations.value));
        
        isLoading.value = false;
        return { success: true, count: friendIds.length };
      }
      

      
      // Verificar se o livro existe na estante ou na tabela de livros
      let bookExists = bookshelfStore.books.some(b => b.id === bookId);
      
      if (!bookExists) {
        // Se não existir na estante, verifica na tabela de livros do Supabase
        const { data: bookData } = await supabase
          .from('books')
          .select('id')
          .eq('id', bookId)
          .single();
        
        bookExists = !!bookData;
      }
      
      if (!bookExists) {
        throw new Error('Livro não encontrado na estante');
      }
      
      // Verificar a sessão atual do usuário
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
        throw new Error('Erro de autenticação');
      }

      
      // Criar recomendações para cada amigo usando a estrutura correta da tabela
      const recsToInsert = friendIds.map(friendId => ({
        from_user_id: authStore.userId,
        to_user_id: friendId,
        book_id: bookId,
        message: message || null,
        status: 'pending'
      }));
      
      
      // Usar .returns('minimal') para reduzir overhead
      const { data, error: insertError } = await supabase
        .from('recommendations')
        .insert(recsToInsert)
        .select();
      
      if (insertError) {
        console.error('Erro ao inserir recomendações:', insertError);
        
        // Verificar especificamente o erro de RLS
        if (insertError.code === '42501') {
          error.value = 'Erro de permissão: Você não tem permissão para enviar recomendações.';
          return { success: false, error: 'RLS_POLICY_ERROR' };
        }
        
        throw insertError;
      }
      
      
      // Recarregar as recomendações enviadas
      await fetchRecommendations();
      
      isLoading.value = false;
      return { success: true, count: friendIds.length };
      
    } catch (err) {
      console.error('Erro ao enviar recomendação:', err);
      error.value = 'Não foi possível enviar a recomendação. Tente novamente mais tarde.';
      isLoading.value = false;
      
      // Se ocorrer erro, mudar para o modo local
      useLocalStorage.value = true;
      return { success: false };
    }
  }
  
  // Aceitar uma recomendação (adicionar livro à biblioteca)
  async function acceptRecommendation(recommendationId: string) {
    if (useLocalStorage.value) {
      // Implementação para modo offline (mantido como está)
      const index = receivedRecommendations.value.findIndex(r => r.id === recommendationId);
      
      if (index === -1) {
        throw new Error('Recomendação não encontrada');
      }
      
      const recommendation = receivedRecommendations.value[index];
      
      // Verificar se a recomendação já foi processada
      if (recommendation.status !== RecommendationStatus.PENDING) {
        throw new Error('Esta recomendação já foi processada');
      }
      
      // Atualizar status
      recommendation.status = RecommendationStatus.ACCEPTED;
      recommendation.acceptedAt = new Date();
      
      // Atualizar array local
      receivedRecommendations.value[index] = recommendation;
      
      // Salvar no localStorage
      localStorage.setItem('receivedRecommendations', 
        JSON.stringify(receivedRecommendations.value));
      
      
      return { success: true };
    }
    
    // Início da implementação para modo online com Supabase
    isLoading.value = true;
    error.value = null;
    
    try {
      
      // Buscar a recomendação completa com os dados do livro através da view
      const { data: recommendation, error: fetchError } = await supabase
        .from('recommendations_view')
        .select('*')
        .eq('id', recommendationId)
        .eq('to_user_id', authStore.userId)
        .single();
      
      if (fetchError) {
        console.error('Erro ao buscar detalhes da recomendação:', fetchError);
        throw new Error('Erro ao buscar detalhes da recomendação');
      }
      
      if (!recommendation) {
        throw new Error('Recomendação não encontrada');
      }
      
      // Verificar se a recomendação já foi aceita ou rejeitada
      if (recommendation.status !== 'pending') {
        throw new Error('Esta recomendação já foi processada');
      }
      
      // Preparar os dados do livro para adicionar à estante
      const bookData = {
        title: recommendation.book_title,
        author: recommendation.book_author,
        coverImage: recommendation.book_cover_url,
        description: recommendation.book_description || '',
        status: 0, // Por padrão, começa como "Quero Ler"
      };
      
      
      // Adicionar o livro à estante usando a mesma função que o componente adcionarLivro.vue usa
      await bookshelfStore.addBook(bookData);
      
      // Atualizar o status da recomendação para aceita
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('recommendations')
        .update({
          status: 'accepted',
          updated_at: now
        })
        .eq('id', recommendationId);
      
      if (updateError) throw updateError;
      
      // Atualizar o estado local
      const index = receivedRecommendations.value.findIndex(r => r.id === recommendationId);
      if (index !== -1) {
        receivedRecommendations.value[index].status = RecommendationStatus.ACCEPTED;
        receivedRecommendations.value[index].acceptedAt = new Date();
      }
      
      isLoading.value = false;
      return { success: true };
      
    } catch (err) {
      console.error('Erro ao aceitar recomendação:', err);
      error.value = 'Não foi possível adicionar o livro à sua estante.';
      isLoading.value = false;
      return { success: false, error: err };
    }
  }
  
  async function rejectRecommendation(recommendationId: string) {
    if (!authStore.userId) return { success: false };
    
    try {
      // Se estamos usando localStorage, atualizamos diretamente
      if (useLocalStorage.value) {
        const index = receivedRecommendations.value.findIndex(r => r.id === recommendationId);
        
        if (index === -1) {
          throw new Error('Recomendação não encontrada');
        }
        
        const recommendation = receivedRecommendations.value[index];
        
        // Verificar se a recomendação já foi processada
        if (recommendation.status !== RecommendationStatus.PENDING) {
          throw new Error('Esta recomendação já foi processada');
        }
        
        // Atualizar status
        recommendation.status = RecommendationStatus.REJECTED;
        recommendation.rejectedAt = new Date();
        
        // Atualizar array local
        receivedRecommendations.value[index] = recommendation;
        
        // Salvar no localStorage
        localStorage.setItem('receivedRecommendations', 
          JSON.stringify(receivedRecommendations.value));
        
        return { success: true };
      }
      
      // Se não estamos usando localStorage, tentamos atualizar no Supabase
      // Verificar se a recomendação existe e pertence ao usuário
      const { data: recommendation, error: fetchError } = await supabase
        .from('recommendations')
        .select('status')
        .eq('id', recommendationId)
        .eq('to_user_id', authStore.userId); // Usar to_user_id em vez de recipient_id
      
      // Verificar se há erro ou se não encontrou recomendações
      if (fetchError) {
        console.error('Erro ao buscar recomendação:', fetchError);
        throw fetchError;
      }
      
      // Verificar se encontrou a recomendação
      if (!recommendation || recommendation.length === 0) {
        console.error('Recomendação não encontrada');
        throw new Error('Recomendação não encontrada');
      }
      
      const rec = recommendation[0]; // Pegar o primeiro item do array
      
      // Verificar se a recomendação já foi aceita ou rejeitada
      if (rec.status !== 'pending') {
        throw new Error('Esta recomendação já foi processada');
      }
      
      // Atualizar o status da recomendação
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('recommendations')
        .update({
          status: 'rejected',
          updated_at: now // Usar updated_at em vez de rejected_at
        })
        .eq('id', recommendationId);
      
      if (updateError) throw updateError;
      
      // Atualizar o estado local
      const index = receivedRecommendations.value.findIndex(r => r.id === recommendationId);
      if (index !== -1) {
        receivedRecommendations.value[index].status = RecommendationStatus.REJECTED;
        receivedRecommendations.value[index].rejectedAt = new Date();
      }
      
      return { success: true };
      
    } catch (err) {
      console.error('Erro ao rejeitar recomendação:', err);
      error.value = 'Não foi possível rejeitar a recomendação.';
      
      // Se ocorrer erro, mudar para o modo local
      useLocalStorage.value = true;
      return { success: false };
    }
  }
  
  async function deleteRecommendation(recommendationId: string) {
    if (!authStore.userId) return { success: false };
    
    try {
      // Se estamos usando localStorage, atualizamos diretamente
      if (useLocalStorage.value) {
        // Remover das recomendações recebidas
        receivedRecommendations.value = receivedRecommendations.value
          .filter(r => r.id !== recommendationId);
        
        // Remover das recomendações enviadas
        sentRecommendations.value = sentRecommendations.value
          .filter(r => r.id !== recommendationId);
        
        // Salvar no localStorage
        localStorage.setItem('receivedRecommendations', 
          JSON.stringify(receivedRecommendations.value));
        localStorage.setItem('sentRecommendations', 
          JSON.stringify(sentRecommendations.value));
        
        return { success: true };
      }
      
      // Se não estamos usando localStorage, tentamos excluir no Supabase
      // Verificar se a recomendação existe e pertence ao usuário
      // (como remetente ou destinatário)
      const { data: recommendation, error: fetchError } = await supabase
        .from('recommendations')
        .select('id')
        .or(`sender_id.eq.${authStore.userId},recipient_id.eq.${authStore.userId}`)
        .eq('id', recommendationId)
        .single();
      
      if (fetchError || !recommendation) {
        throw fetchError || new Error('Recomendação não encontrada');
      }
      
      // Excluir a recomendação
      const { error: deleteError } = await supabase
        .from('recommendations')
        .delete()
        .eq('id', recommendationId);
      
      if (deleteError) throw deleteError;
      
      // Atualizar os estados locais
      receivedRecommendations.value = receivedRecommendations.value.filter(r => r.id !== recommendationId);
      sentRecommendations.value = sentRecommendations.value.filter(r => r.id !== recommendationId);
      
      return { success: true };
      
    } catch (err) {
      console.error('Erro ao excluir recomendação:', err);
      error.value = 'Não foi possível excluir a recomendação.';
      
      // Se ocorrer erro, mudar para o modo local
      useLocalStorage.value = true;
      return { success: false };
    }
  }
  
  function cleanup() {
    if (unsubscribe.value) {
      unsubscribe.value();
      unsubscribe.value = null;
    }
  }
  
  return {
    // State
    receivedRecommendations,
    sentRecommendations,
    isLoading,
    error,
    
    // Getters
    pendingRecommendationsCount,
    pendingRecommendations,
    acceptedRecommendations,
    rejectedRecommendations,
    sentPendingRecommendations,
    sentAcceptedRecommendations,
    sentRejectedRecommendations,
    groupedRecommendations,
    
    // Actions
    fetchRecommendations,
    fetchReceivedRecommendations,
    sendRecommendation,
    acceptRecommendation,
    rejectRecommendation,
    deleteRecommendation,
    fetchSentRecommendations: fetchRecommendations, // Alias para maior clareza
    cleanup
  };
});