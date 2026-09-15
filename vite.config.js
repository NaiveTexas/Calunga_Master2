import { defineConfig } from "vite";
export default defineConfig({
    publicDir: false,
    optimizeDeps: { include: ["jspdf"] },
    server: {
        host: "127.0.0.1",
        proxy: { "/api": "http://127.0.0.1:3000" },
        fs: { deny: [".env", ".env.*", "**/backend/**", "**/.git/**"] }
    }
});
