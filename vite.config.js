import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // INI OBATNYA: Pastikan nama ini persis sama dengan nama repo GitHub-mu
  base: '/br-cloud-frontend/', 
})