import {defineConfig} from "@nuxtjs/tailwindcss/config"
import TailwindCss3D from "tailwindcss-3d"

export default defineConfig({
    plugins: [
        TailwindCss3D
    ],
    theme: {
        extend: {
          aspectRatio: {
            "auto": "auto",
            square: "1 / 1",
            video: "16 / 9"
          },
          rotate: {
            60: "60deg",
            120: "120deg"
          }
        }
      }
})
