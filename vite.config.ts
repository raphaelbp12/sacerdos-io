import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // Project site served from https://raphaelbp12.github.io/sacerdos-io/
  base: "/sacerdos-io/",
  plugins: [react()],
  test: {
    // Explicit imports: { describe, it, expect } — no polluting globals.
    globals: false,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
  },
});
