/**
 * Pruebas Unitarias - Cálculo de Indicadores REM
 * Archivo: src/lib/indicadores-helpers.test.js
 * 
 * Este archivo contiene las pruebas unitarias para las funciones
 * de cálculo de indicadores del reporte REM A.11 del Ministerio de Salud.
 */

import {
  agruparPorFecha,
  calcularTasa,
  calcularTendenciaComparativa,
  calcularEdadGestacionalRangos,
  construirFiltroFecha,
  calcularDistribucionApgar,
  calcularRangosPeso,
  calcularDiasEstadiaPromedio
} from './indicadores-helpers'

describe('Cálculo de Indicadores REM', () => {

  describe('calcularEdadAlParto (calculado desde agruparPorFecha)', () => {
    test('debe agrupar fechas por día correctamente', () => {
      const fecha = new Date('2025-11-30T10:30:00')
      expect(agruparPorFecha(fecha, 'dia')).toBe('2025-11-30')
    })

    test('debe agrupar fechas por mes correctamente', () => {
      const fecha = new Date('2025-11-30T10:30:00')
      expect(agruparPorFecha(fecha, 'mes')).toBe('2025-11')
    })

    test('debe agrupar fechas por semana correctamente', () => {
      const fecha = new Date('2025-11-30T10:30:00')
      const resultado = agruparPorFecha(fecha, 'semana')
      expect(resultado).toMatch(/^2025-W\d{2}$/)
    })
  })

  describe('calcularTasa', () => {
    test('debe calcular tasa de campo booleano correctamente', () => {
      const items = [
        { lactanciaMaterna: true },
        { lactanciaMaterna: true },
        { lactanciaMaterna: false },
        { lactanciaMaterna: true },
        { lactanciaMaterna: false }
      ]
      const resultado = calcularTasa(items, 'lactanciaMaterna')
      
      expect(resultado.cantidad).toBe(3)
      expect(resultado.total).toBe(5)
      expect(resultado.tasa).toBe('60.0')
    })

    test('debe manejar array vacío', () => {
      const resultado = calcularTasa([], 'campo')
      
      expect(resultado.cantidad).toBe(0)
      expect(resultado.total).toBe(0)
      expect(resultado.tasa).toBe('0.0')
    })

    test('debe calcular 100% cuando todos son true', () => {
      const items = [
        { activo: true },
        { activo: true },
        { activo: true }
      ]
      const resultado = calcularTasa(items, 'activo')
      
      expect(resultado.tasa).toBe('100.0')
    })
  })

  describe('clasificarPeso (calcularRangosPeso)', () => {
    test('debe clasificar peso bajo (<2500g)', () => {
      const recienNacidos = [
        { pesoNacimientoGramos: 450 },
        { pesoNacimientoGramos: 1500 },
        { pesoNacimientoGramos: 2400 }
      ]
      const rangos = calcularRangosPeso(recienNacidos)
      
      expect(rangos.bajoPeso).toBe(3)
      expect(rangos.normal).toBe(0)
      expect(rangos.macrosomia).toBe(0)
    })

    test('debe clasificar peso normal (2500-4000g)', () => {
      const recienNacidos = [
        { pesoNacimientoGramos: 2500 },
        { pesoNacimientoGramos: 3200 },
        { pesoNacimientoGramos: 3800 },
        { pesoNacimientoGramos: 4000 }
      ]
      const rangos = calcularRangosPeso(recienNacidos)
      
      expect(rangos.bajoPeso).toBe(0)
      expect(rangos.normal).toBe(4)
      expect(rangos.macrosomia).toBe(0)
    })

    test('debe clasificar macrosomía (>4000g)', () => {
      const recienNacidos = [
        { pesoNacimientoGramos: 4100 },
        { pesoNacimientoGramos: 4500 },
        { pesoNacimientoGramos: 5000 }
      ]
      const rangos = calcularRangosPeso(recienNacidos)
      
      expect(rangos.bajoPeso).toBe(0)
      expect(rangos.normal).toBe(0)
      expect(rangos.macrosomia).toBe(3)
    })

    test('debe clasificar distribución mixta correctamente', () => {
      const recienNacidos = [
        { pesoNacimientoGramos: 2000 },  // bajo peso
        { pesoNacimientoGramos: 3200 },  // normal
        { pesoNacimientoGramos: 3500 },  // normal
        { pesoNacimientoGramos: 4200 }   // macrosomía
      ]
      const rangos = calcularRangosPeso(recienNacidos)
      
      expect(rangos.bajoPeso).toBe(1)
      expect(rangos.normal).toBe(2)
      expect(rangos.macrosomia).toBe(1)
    })
  })

  describe('evaluarApgar (calcularDistribucionApgar)', () => {
    test('debe identificar APGAR bajo (<7) como crítico', () => {
      const recienNacidos = [
        { apgar1min: 2 },
        { apgar1min: 5 },
        { apgar1min: 6 }
      ]
      const distribucion = calcularDistribucionApgar(recienNacidos, 'apgar1min')
      
      expect(distribucion.bajo).toBe(3)
      expect(distribucion.normal).toBe(0)
    })

    test('debe identificar APGAR normal (7-9)', () => {
      const recienNacidos = [
        { apgar1min: 7 },
        { apgar1min: 8 },
        { apgar1min: 9 }
      ]
      const distribucion = calcularDistribucionApgar(recienNacidos, 'apgar1min')
      
      expect(distribucion.bajo).toBe(0)
      expect(distribucion.normal).toBe(3)
      expect(distribucion.excelente).toBe(0)
    })

    test('debe identificar APGAR excelente (10)', () => {
      const recienNacidos = [
        { apgar1min: 10 },
        { apgar1min: 10 }
      ]
      const distribucion = calcularDistribucionApgar(recienNacidos, 'apgar1min')
      
      expect(distribucion.excelente).toBe(2)
    })

    test('debe evaluar distribución completa', () => {
      const recienNacidos = [
        { apgar5min: 2 },   // bajo - crítico
        { apgar5min: 7 },   // normal
        { apgar5min: 8 },   // normal
        { apgar5min: 10 }   // excelente
      ]
      const distribucion = calcularDistribucionApgar(recienNacidos, 'apgar5min')
      
      expect(distribucion.bajo).toBe(1)
      expect(distribucion.normal).toBe(2)
      expect(distribucion.excelente).toBe(1)
    })
  })

  describe('calcularEdadGestacionalRangos', () => {
    test('debe clasificar partos extremadamente pretérmino (<28 sem)', () => {
      const partos = [
        { edadGestacionalSemanas: 24 },
        { edadGestacionalSemanas: 26 },
        { edadGestacionalSemanas: 27 }
      ]
      const rangos = calcularEdadGestacionalRangos(partos)
      
      expect(rangos.extremadamentePretérmino).toBe(3)
    })

    test('debe clasificar partos a término (37-41 sem)', () => {
      const partos = [
        { edadGestacionalSemanas: 37 },
        { edadGestacionalSemanas: 39 },
        { edadGestacionalSemanas: 40 },
        { edadGestacionalSemanas: 41 }
      ]
      const rangos = calcularEdadGestacionalRangos(partos)
      
      expect(rangos.término).toBe(4)
      expect(rangos.tasaPretérmino).toBe('0.0')
    })

    test('debe calcular tasa de pretérmino correctamente', () => {
      const partos = [
        { edadGestacionalSemanas: 32 },  // pretérmino moderado
        { edadGestacionalSemanas: 35 },  // pretérmino tardío
        { edadGestacionalSemanas: 39 },  // término
        { edadGestacionalSemanas: 40 }   // término
      ]
      const rangos = calcularEdadGestacionalRangos(partos)
      
      expect(rangos.tasaPretérmino).toBe('50.0')
    })

    test('debe calcular promedio de edad gestacional', () => {
      const partos = [
        { edadGestacionalSemanas: 38 },
        { edadGestacionalSemanas: 40 },
        { edadGestacionalSemanas: 39 }
      ]
      const rangos = calcularEdadGestacionalRangos(partos)
      
      expect(rangos.promedio).toBe('39.0')
    })
  })

  describe('calcularTendenciaComparativa', () => {
    test('debe calcular tendencia al alza', () => {
      const resultado = calcularTendenciaComparativa(120, 100)
      
      expect(resultado.direccion).toBe('up')
      expect(resultado.cambio).toBe(20)
      expect(resultado.porcentaje).toBe(20)
    })

    test('debe calcular tendencia a la baja', () => {
      const resultado = calcularTendenciaComparativa(80, 100)
      
      expect(resultado.direccion).toBe('down')
      expect(resultado.cambio).toBe(-20)
      expect(resultado.porcentaje).toBe(20)
    })

    test('debe manejar valores iguales como neutral', () => {
      const resultado = calcularTendenciaComparativa(100, 100)
      
      expect(resultado.direccion).toBe('neutral')
      expect(resultado.cambio).toBe(0)
    })

    test('debe manejar valor anterior nulo', () => {
      const resultado = calcularTendenciaComparativa(100, null)
      
      expect(resultado).toBeNull()
    })

    test('debe manejar valor anterior cero', () => {
      const resultado = calcularTendenciaComparativa(50, 0)
      
      expect(resultado.direccion).toBe('up')
      expect(resultado.porcentaje).toBe(100)
    })
  })

  describe('construirFiltroFecha', () => {
    test('debe construir filtro con fecha inicio', () => {
      const filtro = construirFiltroFecha('2025-11-01', null)
      
      expect(filtro).toHaveProperty('gte')
      expect(filtro.gte).toBeInstanceOf(Date)
    })

    test('debe construir filtro con fecha fin', () => {
      const filtro = construirFiltroFecha(null, '2025-11-30')
      
      expect(filtro).toHaveProperty('lte')
      expect(filtro.lte).toBeInstanceOf(Date)
    })

    test('debe construir filtro con ambas fechas', () => {
      const filtro = construirFiltroFecha('2025-11-01', '2025-11-30')
      
      expect(filtro).toHaveProperty('gte')
      expect(filtro).toHaveProperty('lte')
    })

    test('debe retornar null sin fechas', () => {
      const filtro = construirFiltroFecha(null, null)
      
      expect(filtro).toBeNull()
    })
  })

  describe('calcularDiasEstadiaPromedio', () => {
    test('debe calcular promedio de días de estadía', () => {
      const episodios = [
        { fechaIngreso: '2025-11-01', fechaAlta: '2025-11-05' }, // 4 días
        { fechaIngreso: '2025-11-10', fechaAlta: '2025-11-16' }, // 6 días
        { fechaIngreso: '2025-11-20', fechaAlta: '2025-11-22' }  // 2 días
      ]
      const promedio = calcularDiasEstadiaPromedio(episodios, 'fechaIngreso', 'fechaAlta')
      
      expect(promedio).toBe(4) // (4+6+2)/3 = 4
    })

    test('debe retornar 0 para array vacío', () => {
      const promedio = calcularDiasEstadiaPromedio([], 'fechaIngreso', 'fechaAlta')
      
      expect(promedio).toBe(0)
    })
  })
})
