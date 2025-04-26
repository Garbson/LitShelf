// src/stores/useDashboardStore.ts
import { supabase } from "@/supabase";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useAuthStore } from "./useAuthStore";
import { useBookshelfStore } from "./useBookshelfStore";

interface ReadingGoal {
  year: number;
  target: number;
}

export const useDashboardStore = defineStore("dashboard", () => {
  const bookshelfStore = useBookshelfStore();
  const authStore = useAuthStore();
  const books = computed(() => bookshelfStore.books);
  
  // Estado para contagens
  const quotesCount = ref(0); // Contador para frases favoritas
  
  // Estado para meta de leitura
  const readingGoal = ref<ReadingGoal>({ year: new Date().getFullYear(), target: 20 });
  const readingGoalLoaded = ref(false);
  
  // Livro atual sendo lido
  const currentlyReading = computed(() => {
    return books.value.find((book) => Number(book.status) === 2);
  });
  
  // Progresso fictício de leitura (em uma aplicação real, você armazenaria isso em cada livro)
  const readingProgress = computed(() => {
    if (!currentlyReading.value) return 0;
    
    // Se temos um livro com progresso de página atual e total de páginas
    if (currentlyReading.value.current_page && currentlyReading.value.page_count) {
      return Math.round((currentlyReading.value.current_page / currentlyReading.value.page_count) * 100);
    }
    
    return 35; // Valor fixo para exemplo, idealmente seria calculado
  });
  
  // Total de livros
  const totalBooks = computed(() => {
    return books.value.length;
  });

  // Total de livros lidos (status 1)
  const totalBooksRead = computed(() => {
    return books.value.filter((book) => Number(book.status) === 1).length;
  });
  
  // Total de livros em progresso (status 2)
  const totalBooksInProgress = computed(() => {
    return books.value.filter((book) => Number(book.status) === 2).length;
  });
  
  // Total de livros na wishlist (status 0)
  const wishlistCount = computed(() => {
    return books.value.filter((book) => Number(book.status) === 0).length;
  });

  // Total de frases favoritas
  const totalFavoriteQuotes = computed(() => {
    let count = 0;
    
    // Verificar arrays de quotes na estrutura de dados
    books.value.forEach((book) => {
      // Array de quotes
      if (book.quotes && Array.isArray(book.quotes)) {
        count += book.quotes.length;
      }
    });
    
    // Se já temos uma contagem dos livros carregados, usamos essa
    if (count > 0) {
      return count;
    }
    
    // Caso a contagem ainda estiver em 0 e temos valor da API, usar esse
    if (quotesCount.value > 0) {
      return quotesCount.value;
    }
    
    // Se ainda não temos dados, buscar do Supabase
    if (count === 0 && authStore.user?.id) {
      // Esta operação será executada de forma assíncrona 
      fetchQuotesCount();
    }
    
    return quotesCount.value;
  });

  // Buscar todas as frases do Supabase
  const fetchQuotesCount = async () => {
    if (!authStore.user?.id) return 0;
    
    try {
      console.log("Buscando contagem de citações para o usuário:", authStore.user.id);
      
      // Buscar citações do Supabase da tabela quotes (não phases)
      const { count, error } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authStore.user.id);
      
      if (error) {
        if (error.code === '42P01') { // Tabela não existe
          console.log('A tabela "quotes" não foi encontrada, usando valor padrão');
          return 0;
        }
        throw error;
      }
      
      console.log("Contagem de citações encontrada:", count);
      quotesCount.value = count || 0;
      return count;
    } catch (error) {
      console.error('Erro ao buscar contagem de citações:', error);
      return 0;
    }
  };

  // Distribuição por gênero
  const genresDistribution = computed(() => {
    const genreCounts = {};
    books.value.forEach((book) => {
      const genre = book.genre || "Não categorizado";
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    return genreCounts;
  });

  // Tempo médio de leitura
  const averageReadingTime = computed(() => {
    let totalTime = 0;
    let completedBooks = 0;
    
    console.log("Calculando tempo médio de leitura com", books.value.length, "livros");

    books.value.forEach((book) => {
      // Log para debug
      if (Number(book.status) === 1) {
        console.log("Analisando livro concluído:", book.title);
        console.log("Datas disponíveis:", {
          started_reading_at: book.started_reading_at,
          finished_reading_at: book.finished_reading_at,
          dataInicioLeitura: book.dataInicioLeitura,
          dataFinalLeitura: book.dataFinalLeitura
        });
      }

      // Se o livro não está marcado como lido (status 1), não consideramos
      if (Number(book.status) !== 1) return;
      
      // Primeiro tentamos usar os campos do banco
      if (book.started_reading_at && book.finished_reading_at) {
        const start = new Date(book.started_reading_at).getTime();
        const end = new Date(book.finished_reading_at).getTime();
        
        const daysElapsed = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        console.log(`Livro ${book.title}: ${daysElapsed} dias (formato ISO)`);
        
        totalTime += daysElapsed;
        completedBooks++;
      } 
      // Se não tiver, tentamos usar os campos formatados em DD/MM/YYYY
      else if (book.dataInicioLeitura && book.dataFinalLeitura) {
        try {
          // Convertendo datas no formato DD/MM/YYYY para objetos Date
          const parseDate = (dateStr) => {
            if (!dateStr) return null;
            const parts = dateStr.split('/');
            if (parts.length !== 3) return null;
            
            const [day, month, year] = parts.map(Number);
            if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
            
            // Mês em JS começa do zero (janeiro = 0)
            return new Date(year, month - 1, day);
          };
          
          const startDate = parseDate(book.dataInicioLeitura);
          const endDate = parseDate(book.dataFinalLeitura);
          
          if (startDate && endDate) {
            const start = startDate.getTime();
            const end = endDate.getTime();
            
            // Garantir que não estamos calculando valores negativos
            // e usar no mínimo 1 dia para evitar divisão por zero
            const daysElapsed = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
            console.log(`Livro ${book.title}: ${daysElapsed} dias (formato DD/MM/YYYY)`);
            
            totalTime += daysElapsed;
            completedBooks++;
          }
        } catch (err) {
          console.error(`Erro ao processar datas do livro ${book.title}:`, err);
        }
      }
      // Se não tiver nenhuma data, usamos um valor padrão estimado
      else if (completedBooks === 0) {
        // Atribui um valor padrão de 14 dias para pelo menos um livro se não tivermos nenhum com datas
        console.log(`Livro ${book.title}: usando valor padrão de 14 dias`);
        totalTime = 14;
        completedBooks = 1;
      }
    });

    console.log(`Total: ${totalTime} dias para ${completedBooks} livros`);
    
    // Se não temos livros concluídos com datas, ou se por algum motivo o cálculo deu zero
    if (completedBooks === 0 || totalTime === 0) {
      // Usamos um valor padrão baseado em estatísticas médias de leitura (14 dias por livro)
      return 14;
    }

    return Math.round(totalTime / completedBooks);
  });

  // Último livro lido
  const lastBookRead = computed(() => {
    // Filtramos livros com status 1 (já lidos)
    const completedBooks = books.value.filter((book) => Number(book.status) === 1);
    if (completedBooks.length === 0) return null;
    
    return completedBooks.sort((a, b) => {
      // Função para obter a data mais recente possível do livro
      const getCompletionDate = (book) => {
        // Primeiro tentamos o campo finished_reading_at do banco
        if (book.finished_reading_at) {
          return new Date(book.finished_reading_at).getTime();
        }
        
        // Se não tiver, tentamos usar o campo dataFinalLeitura formatado em DD/MM/YYYY
        if (book.dataFinalLeitura) {
          const [day, month, year] = book.dataFinalLeitura.split('/').map(Number);
          return new Date(year, month - 1, day).getTime();
        }
        
        // Se não tiver nenhuma data, usamos a data atual
        return Date.now();
      };
      
      const dateA = getCompletionDate(a);
      const dateB = getCompletionDate(b);
      
      return dateB - dateA;
    })[0];
  });

  // Carregar meta de leitura do localStorage ou criar um padrão
  const loadReadingGoal = async () => {
    try {
      // Primeiro, tentamos carregar do localStorage
      const savedGoal = localStorage.getItem('readingGoal');
      if (savedGoal) {
        const parsedGoal = JSON.parse(savedGoal);
        readingGoal.value = parsedGoal;
        readingGoalLoaded.value = true;
        console.log("Meta de leitura carregada do localStorage:", parsedGoal);
        return;
      }
      
      // Se não temos no localStorage e temos um usuário, tentamos carregar do perfil
      if (authStore.user?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('reading_goal')
          .eq('id', authStore.user.id)
          .single();
        
        if (!profileError && profileData?.reading_goal) {
          const newGoal = { 
            year: new Date().getFullYear(), 
            target: profileData.reading_goal || 20 
          };
          readingGoal.value = newGoal;
          localStorage.setItem('readingGoal', JSON.stringify(newGoal));
          readingGoalLoaded.value = true;
          console.log("Meta de leitura carregada do perfil:", newGoal);
          return;
        }
      }

      // Se chegamos aqui, não conseguimos carregar do banco nem do localStorage
      // Vamos usar um valor padrão
      const defaultGoal = { year: new Date().getFullYear(), target: 20 };
      readingGoal.value = defaultGoal;
      localStorage.setItem('readingGoal', JSON.stringify(defaultGoal));
      readingGoalLoaded.value = true;
      console.log("Meta de leitura padrão definida:", defaultGoal);
      
    } catch (error) {
      console.error('Erro ao carregar meta de leitura:', error);
      // Definir um valor padrão em caso de erro
      readingGoal.value = { year: new Date().getFullYear(), target: 20 };
      readingGoalLoaded.value = true;
    }
  };
  
  // Salvar meta de leitura no localStorage e tentar salvar no perfil
  const saveReadingGoal = async (goal: ReadingGoal) => {
    try {
      // Salvar no localStorage sempre
      localStorage.setItem('readingGoal', JSON.stringify(goal));
      readingGoal.value = goal;
      
      // Tentar salvar no perfil do usuário se possível
      if (authStore.user?.id) {
        const { error: userUpdateError } = await supabase
          .from('profiles')
          .update({ reading_goal: goal.target })
          .eq('id', authStore.user.id);
        
        if (userUpdateError) {
          console.warn('Erro ao atualizar meta no perfil:', userUpdateError);
        } else {
          console.log('Meta de leitura atualizada no perfil com sucesso');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar meta de leitura:', error);
      return false;
    }
  };

  // Buscar dados do dashboard
  const fetchDashboardData = async () => {
    try {
      // Carregar a meta de leitura
      await loadReadingGoal();
      
      // Buscar contagem de frases do Supabase
      if (authStore.user?.id) {
        await fetchQuotesCount();
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  return {
    totalBooks,
    totalBooksRead,
    totalBooksInProgress,
    wishlistCount,
    totalFavoriteQuotes,
    genresDistribution,
    averageReadingTime,
    currentlyReading,
    readingProgress,
    lastBookRead,
    readingGoal,
    readingGoalLoaded,
    fetchDashboardData,
    saveReadingGoal,
    loadReadingGoal
  };
});
