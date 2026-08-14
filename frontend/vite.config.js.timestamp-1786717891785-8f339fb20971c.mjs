// vite.config.js
import { defineConfig } from "file:///C:/Users/admin/Desktop/project/stroy-hub/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/admin/Desktop/project/stroy-hub/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///C:/Users/admin/Desktop/project/stroy-hub/frontend/node_modules/vite-plugin-pwa/dist/index.js";
import basicSsl from "file:///C:/Users/admin/Desktop/project/stroy-hub/frontend/node_modules/@vitejs/plugin-basic-ssl/dist/index.mjs";
var apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://backend:5000";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      devOptions: {
        enabled: false
      },
      workbox: {
        importScripts: ["/sw-push.js"],
        cleanupOutdatedCaches: true
      },
      includeAssets: ["favicon.ico", "favicon-32x32.png", "favicon-16x16.png", "robots.txt", "apple-touch-icon.png", "manifest.json", "logo.png"],
      manifest: {
        name: "TORMAG \u2014 \u0412\u0441\u0451 \u0434\u043B\u044F \u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438 \u0440\u0435\u043C\u043E\u043D\u0442\u0430",
        short_name: "TORMAG",
        description: "\u041A\u0443\u043F\u0438\u0442\u044C \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0435 \u0441\u0442\u0440\u043E\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u044B \u043E\u043F\u0442\u043E\u043C \u0438 \u0432 \u0440\u043E\u0437\u043D\u0438\u0446\u0443 \u0432 \u041A\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043D\u0435.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        id: "/",
        icons: [
          {
            src: "/favicon-16x16.png",
            sizes: "16x16",
            type: "image/png"
          },
          {
            src: "/favicon-32x32.png",
            sizes: "32x32",
            type: "image/png"
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png"
          },
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            if (id.includes("lucide-react") || id.includes("clsx")) {
              return "ui-vendor";
            }
            return "vendor";
          }
        }
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 3e3,
    watch: {
      usePolling: true
    },
    proxy: {
      "/_ipx": {
        target: apiProxyTarget,
        changeOrigin: true
      },
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true
      },
      "/uploads": {
        target: apiProxyTarget,
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhZG1pblxcXFxEZXNrdG9wXFxcXHByb2plY3RcXFxcc3Ryb3ktaHViXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhZG1pblxcXFxEZXNrdG9wXFxcXHByb2plY3RcXFxcc3Ryb3ktaHViXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hZG1pbi9EZXNrdG9wL3Byb2plY3Qvc3Ryb3ktaHViL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnO1xyXG5pbXBvcnQgYmFzaWNTc2wgZnJvbSAnQHZpdGVqcy9wbHVnaW4tYmFzaWMtc3NsJztcclxuXHJcbmNvbnN0IGFwaVByb3h5VGFyZ2V0ID0gcHJvY2Vzcy5lbnYuVklURV9BUElfUFJPWFlfVEFSR0VUIHx8ICdodHRwOi8vYmFja2VuZDo1MDAwJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSxcclxuICAgIGJhc2ljU3NsKCksXHJcbiAgICBWaXRlUFdBKHtcclxuICAgICAgcmVnaXN0ZXJUeXBlOiAncHJvbXB0JyxcclxuICAgICAgaW5qZWN0UmVnaXN0ZXI6ICdhdXRvJyxcclxuICAgICAgZGV2T3B0aW9uczoge1xyXG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlXHJcbiAgICAgIH0sXHJcbiAgICAgIHdvcmtib3g6IHtcclxuICAgICAgICBpbXBvcnRTY3JpcHRzOiBbJy9zdy1wdXNoLmpzJ10sXHJcbiAgICAgICAgY2xlYW51cE91dGRhdGVkQ2FjaGVzOiB0cnVlXHJcbiAgICAgIH0sXHJcbiAgICAgIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAnZmF2aWNvbi0zMngzMi5wbmcnLCAnZmF2aWNvbi0xNngxNi5wbmcnLCAncm9ib3RzLnR4dCcsICdhcHBsZS10b3VjaC1pY29uLnBuZycsICdtYW5pZmVzdC5qc29uJywgJ2xvZ28ucG5nJ10sXHJcbiAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgbmFtZTogJ1RPUk1BRyBcdTIwMTQgXHUwNDEyXHUwNDQxXHUwNDUxIFx1MDQzNFx1MDQzQlx1MDQ0RiBcdTA0NDFcdTA0NDJcdTA0NDBcdTA0M0VcdTA0MzlcdTA0M0FcdTA0MzggXHUwNDM4IFx1MDQ0MFx1MDQzNVx1MDQzQ1x1MDQzRVx1MDQzRFx1MDQ0Mlx1MDQzMCcsXHJcbiAgICAgICAgc2hvcnRfbmFtZTogJ1RPUk1BRycsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdcdTA0MUFcdTA0NDNcdTA0M0ZcdTA0MzhcdTA0NDJcdTA0NEMgXHUwNDNBXHUwNDMwXHUwNDQ3XHUwNDM1XHUwNDQxXHUwNDQyXHUwNDMyXHUwNDM1XHUwNDNEXHUwNDNEXHUwNDRCXHUwNDM1IFx1MDQ0MVx1MDQ0Mlx1MDQ0MFx1MDQzRVx1MDQzOFx1MDQ0Mlx1MDQzNVx1MDQzQlx1MDQ0Q1x1MDQzRFx1MDQ0Qlx1MDQzNSBcdTA0M0NcdTA0MzBcdTA0NDJcdTA0MzVcdTA0NDBcdTA0MzhcdTA0MzBcdTA0M0JcdTA0NEIgXHUwNDNFXHUwNDNGXHUwNDQyXHUwNDNFXHUwNDNDIFx1MDQzOCBcdTA0MzIgXHUwNDQwXHUwNDNFXHUwNDM3XHUwNDNEXHUwNDM4XHUwNDQ2XHUwNDQzIFx1MDQzMiBcdTA0MUFcdTA0MzBcdTA0MzdcdTA0MzBcdTA0NDVcdTA0NDFcdTA0NDJcdTA0MzBcdTA0M0RcdTA0MzUuJyxcclxuICAgICAgICB0aGVtZV9jb2xvcjogJyNmZmZmZmYnLFxyXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjZmZmZmZmJyxcclxuICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXHJcbiAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdCcsXHJcbiAgICAgICAgc3RhcnRfdXJsOiAnLycsXHJcbiAgICAgICAgc2NvcGU6ICcvJyxcclxuICAgICAgICBpZDogJy8nLFxyXG4gICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJy9mYXZpY29uLTE2eDE2LnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnMTZ4MTYnLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnL2Zhdmljb24tMzJ4MzIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICczMngzMicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICcvYXBwbGUtdG91Y2gtaWNvbi5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzE4MHgxODAnLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnL2FuZHJvaWQtY2hyb21lLTE5MngxOTIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZydcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJy9wd2EtMTkyeDE5Mi5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnL3B3YS01MTJ4NTEyLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICcvcHdhLW1hc2thYmxlLTUxMng1MTIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6ICdtYXNrYWJsZSdcclxuICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgXSxcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3MoaWQpIHtcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiAncmVhY3QtdmVuZG9yJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2x1Y2lkZS1yZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdjbHN4JykpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ3VpLXZlbmRvcic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3InO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiAnMC4wLjAuMCcsXHJcbiAgICBwb3J0OiAzMDAwLFxyXG4gICAgd2F0Y2g6IHtcclxuICAgICAgdXNlUG9sbGluZzogdHJ1ZSxcclxuICAgIH0sXHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL19pcHgnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBhcGlQcm94eVRhcmdldCxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogYXBpUHJveHlUYXJnZXQsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICAnL3VwbG9hZHMnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBhcGlQcm94eVRhcmdldCxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1WLFNBQVMsb0JBQW9CO0FBQ2hYLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxjQUFjO0FBRXJCLElBQU0saUJBQWlCLFFBQVEsSUFBSSx5QkFBeUI7QUFFNUQsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLElBQ1QsUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsZ0JBQWdCO0FBQUEsTUFDaEIsWUFBWTtBQUFBLFFBQ1YsU0FBUztBQUFBLE1BQ1g7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLGVBQWUsQ0FBQyxhQUFhO0FBQUEsUUFDN0IsdUJBQXVCO0FBQUEsTUFDekI7QUFBQSxNQUNBLGVBQWUsQ0FBQyxlQUFlLHFCQUFxQixxQkFBcUIsY0FBYyx3QkFBd0IsaUJBQWlCLFVBQVU7QUFBQSxNQUMxSSxVQUFVO0FBQUEsUUFDUixNQUFNO0FBQUEsUUFDTixZQUFZO0FBQUEsUUFDWixhQUFhO0FBQUEsUUFDYixhQUFhO0FBQUEsUUFDYixrQkFBa0I7QUFBQSxRQUNsQixTQUFTO0FBQUEsUUFDVCxhQUFhO0FBQUEsUUFDYixXQUFXO0FBQUEsUUFDWCxPQUFPO0FBQUEsUUFDUCxJQUFJO0FBQUEsUUFDSixPQUFPO0FBQUEsVUFDTDtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFlBQ04sU0FBUztBQUFBLFVBQ1g7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGFBQWEsSUFBSTtBQUNmLGNBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQixnQkFBSSxHQUFHLFNBQVMsT0FBTyxLQUFLLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDcEQscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLGNBQWMsS0FBSyxHQUFHLFNBQVMsTUFBTSxHQUFHO0FBQ3RELHFCQUFPO0FBQUEsWUFDVDtBQUNBLG1CQUFPO0FBQUEsVUFDVDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFlBQVk7QUFBQSxJQUNkO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsUUFDUCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLE1BQ0EsWUFBWTtBQUFBLFFBQ1YsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
