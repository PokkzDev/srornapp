/**
 * Configuración de Jest para el proyecto SRORN
 * 
 * Esta configuración permite ejecutar pruebas unitarias
 * en un proyecto Next.js con módulos ES6.
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Proporciona la ruta al directorio de Next.js
  dir: './',
})

/** @type {import('jest').Config} */
const customJestConfig = {
  // Configurar el entorno de pruebas
  testEnvironment: 'node',
  
  // Directorios donde buscar módulos
  moduleDirectories: ['node_modules', '<rootDir>/'],
  
  // Patrones de archivos de test
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  
  // Archivos a ignorar
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/'
  ],
  
  // Mapeo de alias de módulos (si los usas)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/app/**',
    '!src/components/**',
  ],
  
  // Umbral de cobertura (opcional)
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
  
  // Transformaciones
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  
  // Configuración de setup
  setupFilesAfterEnv: [],
  
  // Verbose para ver detalles
  verbose: true,
}

// createJestConfig es exportado de esta manera para asegurar que next/jest
// pueda cargar la configuración de Next.js de forma asíncrona
module.exports = createJestConfig(customJestConfig)
