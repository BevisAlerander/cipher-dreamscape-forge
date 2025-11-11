import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
// https://vitejs.dev/config/
export default defineConfig({
    server: {
        host: "0.0.0.0",
        port: 8080,
        headers: {
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
        },
    },
    plugins: [
        react(),
        nodePolyfills({
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
            include: ["util", "buffer", "crypto", "stream", "path"],
            protocolImports: true,
        }),
    ],
    define: {
        global: "globalThis",
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    optimizeDeps: {
        exclude: ["@zama-fhe/relayer-sdk", "keccak"],
        esbuildOptions: {
            define: {
                global: "globalThis",
            },
            banner: {
                js: "globalThis.require = globalThis.require || (() => {});",
            },
        },
    },
    assetsInclude: ["**/*.wasm"],
    build: {
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
});
