/** App version from package.json, injected by Vite at build time. */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /** Base URL of the API proxy Worker, without a trailing slash. */
  readonly VITE_API_BASE: string
}
