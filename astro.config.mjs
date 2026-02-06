import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  outDir: './docs',
  site: 'https://manases.dev', // Replace with your custom domain
});
