import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Motorsport Hub',
        short_name: 'Motorsport',
        description: 'Tu centro de información del motorsport',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        icons: [
          { src: 'logo_sl.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo_sl.png', sizes: '512x512', type: 'image/png' },
          { src: 'logo_sl.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api/vueltarapida': {
        target: 'https://api.vueltarapida.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vueltarapida/, '/api'),
        secure: false,
        headers: {
          'Origin': 'https://vueltarapida.com',
          'Referer': 'https://vueltarapida.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        }
      },
      '/api/vueltarapida-html': {
        target: 'https://vueltarapida.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vueltarapida-html/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      },
      '/api/espn-json': {
        target: 'https://site.api.espn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/espn-json/, ''),
        secure: false
      },
      '/api/espn-html': {
        target: 'https://www.espn.com.ar',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/espn-html/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
        }
      },
      '/api/espn': {
        target: 'https://www.espn.com.ar',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/espn/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        }
      },
      '/api/as': {
        target: 'https://as.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/as/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      },
      '/api/motorsport': {
        target: 'https://lat.motorsport.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/motorsport/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
        }
      },
      '/api/motorsport-es': {
        target: 'https://es.motorsport.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/motorsport-es/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        }
      },
      '/api/marca': {
        target: 'https://www.marca.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/marca/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      },
      '/api/wrc': {
        target: 'https://www.wrc.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wrc/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      },
      '/api/wrc-api': {
        target: 'https://p-p.redbull.com/rb-wrccom-lintegration-yv-prod/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wrc-api/, ''),
        secure: false,
        headers: {
          'Origin': 'https://www.wrc.com',
          'Referer': 'https://www.wrc.com/'
        }
      },
      '/api/actc-tiempos': {
        target: 'https://tiempos.actc.org.ar',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/actc-tiempos/, ''),
        secure: false,
        headers: {
          'Origin': 'https://tiempos.actc.org.ar',
          'Referer': 'https://tiempos.actc.org.ar/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
        }
      },
      '/api/actc': {
        target: 'https://actc.org.ar',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/actc/, ''),
        secure: false,
        headers: {
          'Referer': 'https://actc.org.ar/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
        }
      },
      '/api/solotc': {
        target: 'https://www.solotc.com.ar',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/solotc/, ''),
        secure: false,
        headers: {
          'Referer': 'https://www.solotc.com.ar/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
        }
      },
      '/api/campeones': {
        target: 'https://campeones.com.ar',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/campeones/, ''),
        secure: false,
        headers: {
          'Referer': 'https://campeones.com.ar/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
        }
      },
      '/api/nascar': {
        target: 'https://www.nascar.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nascar/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      },
      '/api/nascar-latino': {
        target: 'https://latino.nascar.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nascar-latino/, ''),
        secure: false,
      },
      '/api/wec-api': {
        target: 'https://www.fiawec.com/en',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wec-api/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      },
      '/api/soymotor': {
        target: 'https://soymotor.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/soymotor/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      },
      '/api/campeones': {
        target: 'https://campeones.com.ar',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/campeones/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      },
      '/api/actc-tiempos': {
        target: 'https://tiempos.actc.org.ar',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/actc-tiempos/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      },
      '/api/motorsport-results': {
        target: 'https://lat.motorsport.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/motorsport-results/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      }
    }
  }
})
