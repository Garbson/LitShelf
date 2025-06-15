import '@mdi/font/css/materialdesignicons.css'; // Ícones Material Design
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import 'vuetify/styles'; // Importa os estilos do Vuetify

// Paleta de cores inspirada em livros e bibliotecas - versão sofisticada
const customTheme = {
  dark: false,
  colors: {
    primary: '#5D4037', // Marrom escuro - couro de livro vintage
    secondary: '#7B5E57', // Marrom médio - mais requintado
    accent: '#DEB887', // Bege dourado - pergaminho antigo
    background: '#F8F5F0', // Bege claro - papel envelhecido
    surface: '#FFFFFF', // Branco - páginas
    error: '#B71C1C', // Vermelho escuro - mais elegante para alertas
    info: '#004D40', // Verde-azulado escuro - inspirado em tinta vintage
    success: '#2E7D32', // Verde escuro - mais sofisticado
    warning: '#E65100', // Laranja escuro - mais elegante para avisos
    text: '#3E2723', // Marrom muito escuro - texto principal
  }
}

const customDarkTheme = {
  dark: true,
  colors: {
    primary: '#8D6E63', // Marrom mais claro para contraste no tema escuro
    secondary: '#A1887F', // Marrom médio mais claro
    accent: '#D7CCC8', // Bege claro para contraste
    background: '#121212', // Quase preto - fundo
    surface: '#1E1E1E', // Cinza muito escuro - componentes
    error: '#CF6679', // Rosa avermelhado - erro para tema escuro
    info: '#80CBC4', // Verde-azulado claro
    success: '#81C784', // Verde médio
    warning: '#FFAB40', // Âmbar
    text: '#E0E0E0', // Cinza claro - texto principal
  }
}

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'customTheme',
    themes: {
      customTheme,
      customDarkTheme,
    }
  },
  defaults: {
    // Configurações padrão para componentes
    VCard: {
      rounded: 'lg',
      elevation: 2,
      class: 'transition-ease'
    },
    VBtn: {
      rounded: 'lg',
      elevation: 1,
      fontWeight: '500',
      class: 'text-capitalize'
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      class: 'rounded-lg'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      class: 'rounded-lg'
    },
    VChip: {
      elevation: 0,
    },
    VDivider: {
      class: 'my-3'
    },
    VList: {
      'bg-color': 'transparent',
      density: 'comfortable'
    }
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
