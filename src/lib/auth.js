import { cookies } from 'next/headers'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')
  
  if (!userCookie) {
    return null
  }

  try {
    return JSON.parse(userCookie.value)
  } catch {
    return null
  }
}

export async function getUserPermissions() {
  const user = await getCurrentUser()
  if (!user || !user.roles) {
    return []
  }

  // Get permissions from database based on user roles
  const { prisma } = await import('@/lib/prisma')
  
  const roles = await prisma.role.findMany({
    where: {
      name: {
        in: user.roles,
      },
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  })

  const permissions = new Set()
  roles.forEach(role => {
    role.permissions.forEach(rp => {
      permissions.add(rp.permission.code)
    })
  })

  return Array.from(permissions)
}

