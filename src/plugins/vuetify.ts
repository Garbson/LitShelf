import '@mdi/font/css/materialdesignicons.css' // Ícones Material Design
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import 'vuetify/styles' // Importa os estilos do Vuetify

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light', 
    themes: {
      light: {
        colors: {
          primary: '#4e342e', 
          secondary: '#8d6e63', 
          accent: '#ffcc80', // Amarelo dourado (cor de destaque, remete a páginas amareladas)
          text: '#ffffff', // Branco (para contraste em fundos escuros)
          background: '#f5f5f5', // Cinza claro (para o fundo geral)
          error: '#B00020', // Vermelho escuro
          success: '#4CAF50', // Verde
          surface: '#FFFFFF', // Branco (para superfícies como cards)
        },
      },
      dark: {
        colors: {
          primary: '#4e342e', // Marrom escuro (cor de madeira escura, couro)
          secondary: '#8d6e63', // Marrom médio (cor de madeira clara, papel envelhecido)
          accent: '#ffcc80', // Amarelo dourado (cor de destaque, remete a páginas amareladas)
          text: '#ffffff', // Branco (para contraste em fundos escuros)
          background: '#121212', // Preto (para o fundo geral)
          error: '#CF6679', // Vermelho claro
          success: '#03DAC6', // Verde claro
          surface: '#1E1E1E', // Cinza escuro (para superfícies como cards)
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})

export default vuetify
