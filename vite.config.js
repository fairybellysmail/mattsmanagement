import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  base: process.env.BASE_URL || "./",
  build: { rollupOptions: { input: {
    home: resolve(process.cwd(), 'index.html'),
    fanMemberships: resolve(process.cwd(), 'experiences/fan-memberships.html'),
    academyCourses: resolve(process.cwd(), 'experiences/academy-courses.html'),
    celebrityAccess: resolve(process.cwd(), 'experiences/celebrity-access.html')
  } } }
});
