import { withThemeByDataAttribute } from '@storybook/addon-themes'

import type { Preview } from '@storybook/react-vite'
import '../src/assets/styles/global.css'

export const parameters: Preview['parameters'] = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  a11y: {
    test: 'todo',
  },
  layout: 'centered',
}

export const decorators: Preview['decorators'] = [
  withThemeByDataAttribute({
    themes: {
      light: 'light',
      dark: 'dark',
    },
    defaultTheme: 'light',
    attributeName: 'data-theme',
    parentSelector: 'html',
  }),
]
