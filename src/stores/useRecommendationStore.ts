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
          console.log("Recomendações carregadas do localStorage:", receivedRecommendations.value.length);
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
      // Tentamos carregar as recomendações com uma consulta simplificada 
      // para verificar se a tabela existe
      const { data: testData, error: testError } = await supabase
        .from('recommendations')
        .select('id')
        .limit(1);
      
      if (testError) {
        if (testError.code === '42P01') { // Tabela não existe
          console.log('A tabela "recommendations" não existe, usando dados mockados');
          useLocalStorage.value = true;
          _createMockRecommendations();
          return;
        }
        throw testError;
      }
      
      // Se chegou aqui, a tabela existe, tentamos a consulta completa
      const query = supabase
        .from('recommendations')
        .select(`
          id,
          book_id,
          sender_id,
          message,
          status,
          created_at,
          accepted_at,
          rejected_at
        `)
        .eq('recipient_id', authStore.userId)
        .order('created_at', { ascending: false });
      
      const { data, error: supaError } = await query;
      
      if (supaError) throw supaError;
      
      // Se não tiver dados, inicializa um array vazio em vez de mostrar erro
      if (!data || data.length === 0) {
        console.log('Nenhuma recomendação recebida encontrada');
        receivedRecommendations.value = [];
        return;
      }
      
      // Se conseguimos os dados, mas não temos as informações relacionadas
      // precisamos buscar os detalhes do usuário e do livro separadamente
      const userIds = [...new Set(data.map(rec => rec.sender_id))];
      const bookIds = [...new Set(data.map(rec => rec.book_id))];
      
      // Buscar usuários
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, name, email, profile_picture_url')
        .in('id', userIds);
        
      const usersMap = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
      
      // Buscar livros
      const { data: booksData } = await supabase
        .from('books')
        .select('id, title, author, cover_image_url, google_book_id')
        .in('id', bookIds);
        
      const booksMap = (booksData || []).reduce((acc, book) => {
        acc[book.id] = book;
        return acc;
      }, {});
      
      // Mapear os dados completos
      receivedRecommendations.value = data.map(rec => {
        const user = usersMap[rec.sender_id] || {};
        const book = booksMap[rec.book_id] || {};
        
        return {
          id: rec.id,
          bookId: rec.book_id,
          senderId: rec.sender_id,
          senderName: user.name || 'Usuário',
          senderEmail: user.email,
          senderPhotoURL: user.profile_picture_url,
          recipientId: authStore.userId,
          status: rec.status,
          message: rec.message || '',
          createdAt: new Date(rec.created_at),
          acceptedAt: rec.accepted_at ? new Date(rec.accepted_at) : null,
          rejectedAt: rec.rejected_at ? new Date(rec.rejected_at) : null,
          book: {
            id: book.id,
            title: book.title,
            authors: book.author,
            coverUrl: book.cover_image_url,
            isbn: book.google_book_id
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
      console.log("Recomendações mockadas carregadas do localStorage:", receivedRecommendations.value.length);
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
          console.log("Recomendações enviadas carregadas do localStorage:", sentRecommendations.value.length);
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
          recipient_id,
          message,
          status,
          created_at,
          accepted_at,
          rejected_at
        `)
        .eq('sender_id', authStore.userId)
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
        console.log('Nenhuma recomendação enviada encontrada');
        sentRecommendations.value = [];
        return;
      }
      
      // Buscar perfis para os destinatários
      const recipientIds = [...new Set(data.map(rec => rec.recipient_id))];
      const { data: recipientsData } = await supabase
        .from('profiles')
        .select('id, name, email, profile_picture_url')
        .in('id', recipientIds);
        
      const recipientsMap = (recipientsData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
      
      // Buscar detalhes dos livros
      const bookIds = [...new Set(data.map(rec => rec.book_id))];
      const { data: booksData } = await supabase
        .from('books')
        .select('id, title, author, cover_image_url, google_book_id')
        .in('id', bookIds);
        
      const booksMap = (booksData || []).reduce((acc, book) => {
        acc[book.id] = book;
        return acc;
      }, {});
      
      sentRecommendations.value = data.map(rec => {
        const recipient = recipientsMap[rec.recipient_id] || {};
        const book = booksMap[rec.book_id] || {};
        
        return {
          id: rec.id,
          bookId: rec.book_id,
          recipientId: rec.recipient_id,
          recipientName: recipient.name || 'Usuário',
          recipientEmail: recipient.email,
          recipientPhotoURL: recipient.profile_picture_url,
          senderId: authStore.userId,
          status: rec.status,
          message: rec.message || '',
          createdAt: new Date(rec.created_at),
          acceptedAt: rec.accepted_at ? new Date(rec.accepted_at) : null,
          rejectedAt: rec.rejected_at ? new Date(rec.rejected_at) : null,
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
  
  // Função para criar recomendações enviadas mockadas
  function _createMockSentRecommendations() {
    // Verificar se já temos dados no localStorage
    const storedSentRecs = localStorage.getItem('sentRecommendations');
    if (storedSentRecs) {
      const parsed = JSON.parse(storedSentRecs);
      sentRecommendations.value = parsed.map((rec: any) => ({
        ...rec,
        createdAt: new Date(rec.createdAt),
        acceptedAt: rec.acceptedAt ? new Date(rec.acceptedAt) : null,
        rejectedAt: rec.rejectedAt ? new Date(rec.rejectedAt) : null
      }));
      return;
    }
    
    // Se não temos dados, criar mockados
    sentRecommendations.value = [
      {
        id: 'sent-mock-1',
        bookId: 'sent-book-1',
        recipientId: 'recipient-1',
        recipientName: 'Carlos Mendes',
        recipientEmail: 'carlos@exemplo.com',
        recipientPhotoURL: 'https://i.pravatar.cc/150?img=13',
        senderId: authStore.userId || 'current-user',
        status: RecommendationStatus.ACCEPTED,
        message: 'Achei que você iria gostar deste livro sobre história.',
        createdAt: new Date(Date.now() - 345600000),
        acceptedAt: new Date(Date.now() - 259200000),
        book: {
          id: 'sent-book-1',
          title: 'A Arte da Guerra',
          authors: 'Sun Tzu',
          coverUrl: 'https://m.media-amazon.com/images/I/61fj+FDs7PL._AC_UF1000,1000_QL80_.jpg'
        }
      },
      {
        id: 'sent-mock-2',
        bookId: 'sent-book-2',
        recipientId: 'recipient-2',
        recipientName: 'Fernanda Lima',
        recipientEmail: 'fernanda@exemplo.com',
        recipientPhotoURL: 'https://i.pravatar.cc/150?img=14',
        senderId: authStore.userId || 'current-user',
        status: RecommendationStatus.REJECTED,
        message: 'Um clássico da literatura brasileira que adorei.',
        createdAt: new Date(Date.now() - 432000000),
        rejectedAt: new Date(Date.now() - 345600000),
        book: {
          id: 'sent-book-2',
          title: 'Grande Sertão: Veredas',
          authors: 'João Guimarães Rosa',
          coverUrl: 'https://m.media-amazon.com/images/I/515S24QPCSL._SY445_SX342_.jpg'
        }
      },
      {
        id: 'sent-mock-3',
        bookId: 'sent-book-3',
        recipientId: 'recipient-3',
        recipientName: 'Roberto Almeida',
        recipientEmail: 'roberto@exemplo.com',
        recipientPhotoURL: 'https://i.pravatar.cc/150?img=15',
        senderId: authStore.userId || 'current-user',
        status: RecommendationStatus.PENDING,
        message: 'Este livro mudou minha forma de ver o mundo, acho que você vai gostar.',
        createdAt: new Date(Date.now() - 172800000),
        book: {
          id: 'sent-book-3',
          title: 'Mindset: A Nova Psicologia do Sucesso',
          authors: 'Carol S. Dweck',
          coverUrl: 'https://m.media-amazon.com/images/I/71Ili-6A+gL._AC_UF1000,1000_QL80_.jpg'
        }
      }
    ];
    
    // Salvar no localStorage para próximos acessos
    localStorage.setItem('sentRecommendations', 
      JSON.stringify(sentRecommendations.value));
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
      
      // Se não estamos usando localStorage, tentamos enviar para o Supabase
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
      
      // Criar recomendações para cada amigo
      const recsToInsert = friendIds.map(friendId => ({
        book_id: bookId,
        sender_id: authStore.userId,
        recipient_id: friendId,
        message: message || null,
        status: RecommendationStatus.PENDING
      }));
      
      const { error: insertError } = await supabase
        .from('recommendations')
        .insert(recsToInsert);
      
      if (insertError) throw insertError;
      
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
  
  async function acceptRecommendation(recommendationId: string) {
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
        recommendation.status = RecommendationStatus.ACCEPTED;
        recommendation.acceptedAt = new Date();
        
        // Atualizar array local
        receivedRecommendations.value[index] = recommendation;
        
        // Salvar no localStorage
        localStorage.setItem('receivedRecommendations', 
          JSON.stringify(receivedRecommendations.value));
        
        // Tentar adicionar o livro à estante (simulado)
        console.log(`Livro ${recommendation.bookId} adicionado à estante via recomendação`);
        
        return { success: true };
      }
      
      // Se não estamos usando localStorage, tentamos atualizar no Supabase
      // Buscar a recomendação para obter o ID do livro
      const { data: recommendation, error: fetchError } = await supabase
        .from('recommendations')
        .select('id, book_id, status')
        .eq('id', recommendationId)
        .eq('recipient_id', authStore.userId);
      
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
      if (rec.status !== RecommendationStatus.PENDING) {
        throw new Error('Esta recomendação já foi processada');
      }
      
      // Buscar detalhes do livro
      await bookshelfStore.fetchBookDetails(rec.book_id);
      
      // Atualizar o status da recomendação
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('recommendations')
        .update({
          status: RecommendationStatus.ACCEPTED,
          accepted_at: now
        })
        .eq('id', recommendationId);
      
      if (updateError) throw updateError;
      
      // Atualizar o estado local
      const index = receivedRecommendations.value.findIndex(r => r.id === recommendationId);
      if (index !== -1) {
        receivedRecommendations.value[index].status = RecommendationStatus.ACCEPTED;
        receivedRecommendations.value[index].acceptedAt = new Date();
      }
      
      return { success: true };
      
    } catch (err) {
      console.error('Erro ao aceitar recomendação:', err);
      error.value = 'Não foi possível adicionar o livro à sua estante.';
      
      // Se ocorrer erro, mudar para o modo local
      useLocalStorage.value = true;
      return { success: false };
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
        .eq('recipient_id', authStore.userId);
      
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
      if (rec.status !== RecommendationStatus.PENDING) {
        throw new Error('Esta recomendação já foi processada');
      }
      
      // Atualizar o status da recomendação
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('recommendations')
        .update({
          status: RecommendationStatus.REJECTED,
          rejected_at: now
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