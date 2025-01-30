// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';

import tailwind from '@astrojs/tailwind';

import db from '@astrojs/db';

import auth from 'auth-astro';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [
    vue(), 
    tailwind({ applyBaseStyles: false }), 
    db(), 
    auth()
  ],

  adapter: node({
    mode: 'standalone'
  })
});