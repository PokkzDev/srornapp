import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Parse PRISMA_LOG env var: "query,error,warn" or "error" or empty string
// If not set, defaults to 'query,error,warn' in development, 'error' in production
const getLogLevels = () => {
  const logEnv = process.env.PRISMA_LOG
  if (logEnv) {
    return logEnv.split(',').filter(Boolean)
  }
  // Default based on ENVIRONMENT env var
  const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development'
  return environment === 'development' ? ['query', 'error', 'warn'] : ['error']
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: getLogLevels(),
  })

const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development'
if (environment !== 'production') globalForPrisma.prisma = prisma

