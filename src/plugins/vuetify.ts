import '@mdi/font/css/materialdesignicons.css' // Ícones Material Design
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import 'vuetify/styles' // Importa os estilos do Vuetify

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light', // Tema padrão
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
          background: '#FFFFFF',
          surface: '#F5F5F5',
        },
      },
      dark: {
        colors: {
          primary: '#BB86FC',
          secondary: '#03DAC6',
          accent: '#3700B3',
          error: '#CF6679',
          info: '#2196F3',
          success: '#03DAC6',
          warning: '#FFC107',
          background: '#121212',
          surface: '#1E1E1E',
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
