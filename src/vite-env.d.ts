/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_CHECKOUT_URL_PREMIUM?: string
  readonly VITE_CHECKOUT_URL_FAMILIA?: string
  readonly VITE_ENABLE_GOOGLE_AUTH?: string
  readonly VITE_SUPPORT_EMAIL?: string
  readonly VITE_PRICE_PREMIUM?: string
  readonly VITE_PRICE_FAMILIA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
