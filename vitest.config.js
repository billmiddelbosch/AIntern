import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config';
import viteConfig from './vite.config';
export default mergeConfig(viteConfig, defineConfig({
    resolve: {
        // Force Lambda dependencies to resolve from root node_modules so vi.mock() applies correctly.
        // Without this, lambda/node_modules takes precedence and mocks don't intercept those imports.
        alias: {
            jsonwebtoken: resolve('./node_modules/jsonwebtoken'),
            '@aws-sdk/client-s3': resolve('./node_modules/@aws-sdk/client-s3'),
            '@aws-sdk/client-ssm': resolve('./node_modules/@aws-sdk/client-ssm'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: [...configDefaults.exclude, 'e2e/**'],
        root: fileURLToPath(new URL('./', import.meta.url)),
    },
}));
