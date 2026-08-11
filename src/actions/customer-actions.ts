'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function fetchUsers() {
  const session = await getServerSession(authOptions)
  if (!session) return []
  return prisma.user.findMany({
    where: { role: { not: "SUPERUSER" }, is_active: true },
    select: { id: true, username: true, role: true },
    orderBy: { username: 'asc' }
  })
}

export async function searchCustomers(query: string) {
  if (!query || query.length < 2) {
    return prisma.customer.findMany({ take: 10, orderBy: { name: 'asc' } })
  }
  
  const customers = await prisma.$queryRaw`
    SELECT id, name, phone, address, location, similarity(name, ${query}) as score
    FROM "Customer"
    WHERE similarity(name, ${query}) > 0.25 OR name ILIKE ${'%' + query + '%'}
    ORDER BY score DESC
    LIMIT 10;
  `
  return customers as any[]
}

export async function createCustomer(data: { name: string, phone?: string, address?: string, location?: string, user_id: string }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    throw new Error('Unauthorized')
  }

  if (!data.user_id) {
    throw new Error('User/Salesperson is required')
  }

  try {
    return await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        location: data.location,
        user_id: data.user_id,
      },
    })
  } catch (error: any) {
    if (error.code === 'P2003') {
      throw new Error("Your session appears to be invalid or expired. Please log out and log in again.")
    }
    throw error
  }
}
