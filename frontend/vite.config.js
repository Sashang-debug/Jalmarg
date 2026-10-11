import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'production') {
    const env = loadEnv(mode, import.meta.dirname, 'VITE_')
    for (const key of ['VITE_API_BASE_URL', 'VITE_COGNITO_CLIENT_ID', 'VITE_COGNITO_DOMAIN', 'VITE_AWS_REGION']) {
      if (!env[key]?.trim()) throw new Error(`Production build requires ${key}. Check .env.production before publishing.`)
    }
    for (const key of ['VITE_API_BASE_URL', 'VITE_COGNITO_DOMAIN']) {
      if (!env[key].startsWith('https://')) throw new Error(`Production ${key} must be an HTTPS URL, not a local development setting.`)
    }
  }
  return {
    plugins: [react()],
    server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
  }
})
