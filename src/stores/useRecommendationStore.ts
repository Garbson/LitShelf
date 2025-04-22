import { db } from '@/firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useAuthStore } from './useAuthStore';
import { useBookshelfStore } from './useBookshelfStore';

export const useRecommendationStore = defineStore('recommendation', () => {
  const authStore = useAuthStore();
  const bookshelfStore = useBookshelfStore();
  
  // Estado
  const receivedRecommendations = ref<any[]>([]);
  const sentRecommendations = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const unsubscribe = ref<(() => void) | null>(null);

  // Getters
  const pendingRecommendationsCount = computed(() => {
    return receivedRecommendations.value.filter(rec => rec.status === 'pending').length;
  });

  // Adiciona o getter pendingRecommendations
  const pendingRecommendations = computed(() => {
    return receivedRecommendations.value.filter(rec => rec.status === 'pending');
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
    if (!authStore.user) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Configurar listener para recomendações recebidas
      if (unsubscribe.value) {
        unsubscribe.value();
      }
      
      const receivedQuery = query(
        collection(db, 'bookRecommendations'),
        where('recipientId', '==', authStore.user.uid),
        orderBy('createdAt', 'desc')
      );
      
      unsubscribe.value = onSnapshot(receivedQuery, (snapshot) => {
        const recommendations: any[] = [];
        
        snapshot.forEach((doc) => {
          recommendations.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          });
        });
        
        receivedRecommendations.value = recommendations;
      });
    } catch (err) {
      console.error('Erro ao buscar recomendações recebidas:', err);
      error.value = 'Não foi possível carregar suas recomendações de livros.';
    } finally {
      isLoading.value = false;
    }
  }
  
  async function fetchRecommendations() {
    if (!authStore.user) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Buscar recomendações recebidas
      await fetchReceivedRecommendations();
      
      // Buscar recomendações enviadas (uma única vez)
      const sentQuery = query(
        collection(db, 'bookRecommendations'),
        where('senderId', '==', authStore.user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const sentSnapshot = await getDocs(sentQuery);
      const sentRecs: any[] = [];
      
      sentSnapshot.forEach((doc) => {
        sentRecs.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });
      
      sentRecommendations.value = sentRecs;
      
    } catch (err) {
      console.error('Erro ao buscar recomendações:', err);
      error.value = 'Não foi possível carregar suas recomendações de livros.';
    } finally {
      isLoading.value = false;
    }
  }
  
  async function sendRecommendation(bookId: string, friendIds: string[], message?: string) {
    if (!authStore.user) {
      error.value = 'Você precisa estar logado para enviar recomendações.';
      return { success: false };
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Buscar dados do livro
      const book = bookshelfStore.allBooks.find(b => b.id === bookId);
      
      if (!book) {
        throw new Error('Livro não encontrado na estante');
      }
      
      const successCount = friendIds.length;
      
      // Notificação será feita diretamente no componente para manter compatibilidade
      
      isLoading.value = false;
      return { success: true, count: successCount };
      
    } catch (err) {
      console.error('Erro ao enviar recomendação:', err);
      error.value = 'Não foi possível enviar a recomendação. Tente novamente mais tarde.';
      isLoading.value = false;
      return { success: false };
    }
  }
  
  async function acceptRecommendation(recommendationId: string) {
    if (!authStore.user) return { success: false };
    
    try {
      const recommendationRef = doc(db, 'bookRecommendations', recommendationId);
      const recommendationSnap = await getDoc(recommendationRef);
      
      if (!recommendationSnap.exists()) {
        throw new Error('Recomendação não encontrada');
      }
      
      const recommendationData = recommendationSnap.data();
      
      // Adicionar o livro à estante do usuário
      await bookshelfStore.fetchBookDetails(recommendationData.bookId, {
        addToBookshelf: true,
        status: 'want-to-read',
        source: 'recommendation',
        sourceId: recommendationId
      });
      
      // Atualizar o status da recomendação
      await updateDoc(recommendationRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      
      return { success: true };
      
    } catch (err) {
      console.error('Erro ao aceitar recomendação:', err);
      error.value = 'Não foi possível adicionar o livro à sua estante.';
      return { success: false };
    }
  }
  
  async function rejectRecommendation(recommendationId: string) {
    if (!authStore.user) return { success: false };
    
    try {
      const recommendationRef = doc(db, 'bookRecommendations', recommendationId);
      
      await updateDoc(recommendationRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      });
      
      return { success: true };
      
    } catch (err) {
      console.error('Erro ao rejeitar recomendação:', err);
      error.value = 'Não foi possível rejeitar a recomendação.';
      return { success: false };
    }
  }
  
  async function deleteRecommendation(recommendationId: string) {
    if (!authStore.user) return { success: false };
    
    try {
      const recommendationRef = doc(db, 'bookRecommendations', recommendationId);
      await deleteDoc(recommendationRef);
      
      return { success: true };
      
    } catch (err) {
      console.error('Erro ao excluir recomendação:', err);
      error.value = 'Não foi possível excluir a recomendação.';
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
    pendingRecommendations, // Expor o novo getter
    groupedRecommendations,
    
    // Actions
    fetchRecommendations,
    fetchReceivedRecommendations,
    sendRecommendation,
    acceptRecommendation,
    rejectRecommendation,
    deleteRecommendation,
    cleanup
  };
});