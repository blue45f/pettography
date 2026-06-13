import path from 'path'
import { fileURLToPath } from 'url'

import babel from '@rolldown/plugin-babel'
import { reactCompilerPreset } from '@vitejs/plugin-react'

import type { StorybookConfig } from '@storybook/react-vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-themes'],
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
  async viteFinal(viteConfig) {
    viteConfig.resolve = viteConfig.resolve ?? {}
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias ?? {}),
      '@': path.resolve(__dirname, '../src'),
      '@components': path.resolve(__dirname, '../src/components'),
      '@pages': path.resolve(__dirname, '../src/pages'),
      '@hooks': path.resolve(__dirname, '../src/hooks'),
      '@infrastructure': path.resolve(__dirname, '../src/infrastructure'),
      '@utils': path.resolve(__dirname, '../src/utils'),
      '@types': path.resolve(__dirname, '../src/types'),
      '@store': path.resolve(__dirname, '../src/store'),
      '@assets': path.resolve(__dirname, '../src/assets'),
      '@domains': path.resolve(__dirname, '../src/domains'),
      '@router': path.resolve(__dirname, '../src/router'),
      '@i18n': path.resolve(__dirname, '../src/i18n'),
    }
    viteConfig.plugins = viteConfig.plugins ?? []
    viteConfig.plugins.push(babel({ presets: [reactCompilerPreset()] }))
    return viteConfig
  },
}

export default config
