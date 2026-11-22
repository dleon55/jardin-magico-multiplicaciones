import { defineConfig, devices } from "@playwright/test";

// En entornos con Chromium preinstalado fuera de la caché de Playwright, se
// puede indicar su ruta con CHROMIUM_RUTA. En el CI se usa el que instala
// `npx playwright install`.
const ejecutable = process.env.CHROMIUM_RUTA;

export default defineConfig({
  testDir: "pruebas",
  testMatch: "*.spec.mjs",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // En local, un proceso por núcleo (Playwright usa la mitad si no se le dice).
  // Medido en una máquina de 4 núcleos: la compuerta entera baja de 28 minutos
  // con 2 procesos a lo que anota docs/PLAN.md. PROCESOS=2 vuelve a lo de antes.
  workers: process.env.CI ? undefined : (Number(process.env.PROCESOS) || "100%"),
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:4173/jardin-magico-multiplicaciones/",
    locale: "es-MX",
    // Con movimiento reducido, como lo pediría un niño con sensibilidad
    // sensorial: el botón de inicio late sin parar y, en movimiento, nunca está
    // "quieto" para un clic automatizado. Las pruebas que necesitan las
    // animaciones abren su propio contexto sin esta preferencia.
    reducedMotion: "reduce",
    // Cada prueba empieza en un dispositivo que ya vio la bienvenida guiada:
    // si no, todas empezarían en ella. Las de la guía (guia.spec.mjs) parten
    // de un dispositivo vacío.
    storageState: "pruebas/estado-inicial.json",
    trace: "retain-on-failure",
    ...(ejecutable ? { launchOptions: { executablePath: ejecutable } } : {}),
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    // Tablet: donde de verdad se usa el juego. Sin ratón ni teclado: los
    // atajos no deben anunciarse aquí.
    { name: "tablet", use: { ...devices["Galaxy Tab S4"] } },
  ],
  webServer: {
    command: "node pruebas/servidor.mjs",
    url: "http://localhost:4173/jardin-magico-multiplicaciones/",
    reuseExistingServer: !process.env.CI,
  },
});
