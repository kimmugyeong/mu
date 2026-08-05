import 'dotenv/config' // 👈 이 줄을 최상단에 꼭 추가하세요!
import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL,
    directUrl: process.env.POSTGRES_URL_NON_POOLING,
  },
})