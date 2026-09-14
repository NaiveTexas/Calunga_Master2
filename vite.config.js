import { defineConfig } from "vite";
export default defineConfig({
    publicDir: false,
    server: {
        host: "127.0.0.1",
        proxy: { "/api": "http://127.0.0.1:3000" },
        fs: { deny: [".env", ".env.*", "**/backend/**", "**/.git/**"] }
    }
});
