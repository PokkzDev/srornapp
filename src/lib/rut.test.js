/**
 * Pruebas Unitarias - Validación de RUT Chileno
 * Archivo: src/lib/rut.test.js
 * 
 * Este archivo contiene las pruebas unitarias para las funciones
 * de validación y formateo de RUT chileno.
 */

import { validarRUT, formatearRUT, esEmail, pareceRUT } from './rut'

describe('Validación de RUT Chileno', () => {
  
  describe('validarRUT - RUTs válidos', () => {
    test('debe validar RUT correcto con dígito numérico', () => {
      expect(validarRUT('12345678-5')).toBe(true)
      expect(validarRUT('76086428-5')).toBe(true)
      expect(validarRUT('11111111-1')).toBe(true)
    })

    test('debe validar RUT con dígito verificador K', () => {
      // RUT real con dígito K válido (verificado con algoritmo módulo 11)
      expect(validarRUT('10000013-K')).toBe(true)
      expect(validarRUT('10000013-k')).toBe(true) // minúscula también válida
    })

    test('debe validar RUT de 7 dígitos', () => {
      expect(validarRUT('1234567-4')).toBe(true)
    })
  })

  describe('validarRUT - RUTs inválidos', () => {
    test('debe rechazar RUT con dígito verificador incorrecto', () => {
      expect(validarRUT('12345678-0')).toBe(false)
      expect(validarRUT('12345678-9')).toBe(false)
      expect(validarRUT('76086428-K')).toBe(false)
    })

    test('debe rechazar RUT con formato inválido', () => {
      expect(validarRUT('12.345.678-5')).toBe(false) // con puntos
      expect(validarRUT('123456785')).toBe(false) // sin guion
      expect(validarRUT('')).toBe(false)
      expect(validarRUT(null)).toBe(false)
      expect(validarRUT(undefined)).toBe(false)
    })

    test('debe rechazar RUT con longitud incorrecta', () => {
      expect(validarRUT('123456-5')).toBe(false) // muy corto
      expect(validarRUT('123456789-5')).toBe(false) // muy largo
    })

    test('debe rechazar RUT con caracteres inválidos', () => {
      expect(validarRUT('1234567A-5')).toBe(false)
      expect(validarRUT('abcdefgh-5')).toBe(false)
    })
  })

  describe('formatearRUT', () => {
    test('debe formatear RUT agregando guion automáticamente', () => {
      expect(formatearRUT('123456785')).toBe('12345678-5')
      expect(formatearRUT('12174133K')).toBe('12174133-K')
    })

    test('debe preservar guion existente', () => {
      expect(formatearRUT('12345678-5')).toBe('12345678-5')
      expect(formatearRUT('12174133-K')).toBe('12174133-K')
    })

    test('debe eliminar caracteres inválidos y formatear', () => {
      // formatearRUT mantiene el guion cuando existe
      expect(formatearRUT('12.345.678-5')).toBe('12345678-5')
      expect(formatearRUT('abc12345678def5')).toBe('12345678-5')
    })

    test('debe retornar vacío para entrada vacía', () => {
      expect(formatearRUT('')).toBe('')
      expect(formatearRUT(null)).toBe('')
      expect(formatearRUT(undefined)).toBe('')
    })

    test('debe convertir K a mayúscula', () => {
      expect(formatearRUT('12174133-k')).toBe('12174133-K')
    })

    test('debe truncar RUTs muy largos', () => {
      expect(formatearRUT('1234567890123')).toBe('12345678-9')
    })
  })

  describe('esEmail', () => {
    test('debe identificar emails válidos', () => {
      expect(esEmail('usuario@example.com')).toBe(true)
      expect(esEmail('test.user@hospital.cl')).toBe(true)
      expect(esEmail('admin+tag@domain.org')).toBe(true)
    })

    test('debe rechazar emails inválidos', () => {
      expect(esEmail('usuario')).toBe(false)
      expect(esEmail('usuario@')).toBe(false)
      expect(esEmail('@domain.com')).toBe(false)
      expect(esEmail('')).toBe(false)
      expect(esEmail(null)).toBe(false)
    })

    test('debe rechazar RUTs como emails', () => {
      expect(esEmail('12345678-5')).toBe(false)
    })
  })

  describe('pareceRUT', () => {
    test('debe identificar strings que parecen RUT', () => {
      expect(pareceRUT('12345678-5')).toBe(true)
      expect(pareceRUT('12345678-K')).toBe(true)
      expect(pareceRUT('1234567-5')).toBe(true)
    })

    test('debe identificar números sin guion como posible RUT', () => {
      expect(pareceRUT('12345678')).toBe(true)
      expect(pareceRUT('123456789')).toBe(true)
    })

    test('debe rechazar strings que no parecen RUT', () => {
      expect(pareceRUT('abc')).toBe(false)
      expect(pareceRUT('usuario@email.com')).toBe(false)
      expect(pareceRUT('')).toBe(false)
      expect(pareceRUT(null)).toBe(false)
    })
  })
})