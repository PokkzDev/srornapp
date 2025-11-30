/**
 * Script para agregar permisos de ingreso/alta al rol matrona
 * Ejecutar con: node prisma/add-matrona-permissions.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Agregando permisos de ingreso/alta al rol matrona...\n')

  // Buscar el rol matrona
  const rolMatrona = await prisma.role.findUnique({
    where: { name: 'matrona' }
  })

  if (!rolMatrona) {
    console.error('❌ No se encontró el rol "matrona"')
    return
  }

  console.log(`✓ Rol matrona encontrado: ${rolMatrona.id}`)

  // Permisos a agregar
  const permisosAAgregar = [
    'ingreso_alta:view',
    'ingreso_alta:create',
    'ingreso_alta:update',
  ]

  for (const codigoPermiso of permisosAAgregar) {
    // Buscar el permiso
    let permiso = await prisma.permission.findUnique({
      where: { code: codigoPermiso }
    })

    // Si no existe, crearlo
    if (!permiso) {
      console.log(`  → Creando permiso "${codigoPermiso}"...`)
      permiso = await prisma.permission.create({
        data: {
          code: codigoPermiso,
          description: `Permiso para ${codigoPermiso.replace('_', ' ').replace(':', ' - ')}`
        }
      })
      console.log(`  ✓ Permiso "${codigoPermiso}" creado`)
    }

    // Verificar si ya existe la relación
    const relacionExistente = await prisma.rolePermission.findFirst({
      where: {
        roleId: rolMatrona.id,
        permissionId: permiso.id
      }
    })

    if (relacionExistente) {
      console.log(`  ⏭ Permiso "${codigoPermiso}" ya está asignado a matrona`)
    } else {
      // Crear la relación rol-permiso
      await prisma.rolePermission.create({
        data: {
          roleId: rolMatrona.id,
          permissionId: permiso.id
        }
      })
      console.log(`  ✓ Permiso "${codigoPermiso}" asignado a matrona`)
    }
  }

  console.log('\n✅ Proceso completado!')
  console.log('\n📝 Nota: Cierra sesión y vuelve a iniciar para que los cambios tomen efecto.')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
