import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import '@fortawesome/fontawesome-free/css/all.css'
import 'vuetify/styles'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          'primary': '#2980b9',
          'secondary': '#546e7a',
          'surface': '#f8f8f8',
          'background': '#f0f2f5',
          'on-primary': '#ffffff',
          'on-secondary': '#ffffff',
        },
      },
      dark: {
        dark: true,
        colors: {
          'primary': '#4fc3f7',
          'secondary': '#90a4ae',
          'surface': '#1e2738',
          'background': '#141c27',
          'on-primary': '#000000',
          'on-secondary': '#000000',
        },
      },
      warm: {
        dark: false,
        colors: {
          'primary': '#bf360c',
          'secondary': '#e64a19',
          'surface': '#fff8f5',
          'background': '#fff3ee',
          'on-primary': '#ffffff',
          'on-secondary': '#ffffff',
        },
      },
      cool: {
        dark: false,
        colors: {
          'primary': '#00695c',
          'secondary': '#00796b',
          'surface': '#f5fffe',
          'background': '#e8f5e9',
          'on-primary': '#ffffff',
          'on-secondary': '#ffffff',
        },
      },
    },
  },
})
