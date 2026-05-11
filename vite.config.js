import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { generateSitemapXml, getSlugsFromS3 } from './scripts/generate-sitemap';
import { generateLlmsFullTxt } from './scripts/generate-llms-full';
function sitemapPlugin() {
    return {
        name: 'generate-sitemap',
        apply: 'build',
        async buildStart() {
            const publicDir = fileURLToPath(new URL('./public', import.meta.url));
            await generateSitemapXml(publicDir);
        },
    };
}
function llmsFullPlugin() {
    return {
        name: 'generate-llms-full',
        apply: 'build',
        async buildStart() {
            const publicDir = fileURLToPath(new URL('./public', import.meta.url));
            await generateLlmsFullTxt(publicDir);
        },
    };
}
export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
        sitemapPlugin(),
        llmsFullPlugin(),
    ],
    ssgOptions: {
        async includedRoutes(paths) {
            const staticPaths = paths.filter((p) => !p.includes(':') && !p.startsWith('/admin'));
            let articleRoutes = [];
            try {
                const slugs = await getSlugsFromS3();
                articleRoutes = slugs.map((slug) => `/kennisbank/${slug}`);
            }
            catch {
                // S3 unreachable — build continues without article routes
            }
            return [...staticPaths, ...articleRoutes];
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
