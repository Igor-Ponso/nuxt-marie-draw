export default defineNuxtConfig({
  // Pin Nitro compatibility date to suppress warning and ensure stable runtime behavior
  compatibilityDate: '2025-11-10',
  ssr: false,
  devtools: { enabled: true },
  app: {
    baseURL: process.env.NUXT_PUBLIC_BASE_PATH || '/',
    head: {
      title: 'Marie Draw | Prize Draw Experience',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Create dazzling prize draws with a delightful interface. Add entrants, spin, and celebrate the winner!'
        }
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
        }
      ]
    }
  },
  nitro: {
    preset: process.env.NITRO_PRESET || 'github-pages'
  },
  css: ['~/assets/css/main.css']
});
