import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "login.html"),
        model: resolve(__dirname, "model.html"),
        garage: resolve(__dirname, "garage.html"),
      },
    },
  },
});
