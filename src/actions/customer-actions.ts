'use server'

import prisma from '@/lib/prisma'

export async function searchCustomers(query: string) {
  if (!query || query.length < 2) {
    return prisma.customer.findMany({ take: 10, orderBy: { name: 'asc' } })
  }
  
  const customers = await prisma.$queryRaw`
    SELECT id, name, phone, address, similarity(name, ${query}) as score
    FROM "Customer"
    WHERE similarity(name, ${query}) > 0.25 OR name ILIKE ${'%' + query + '%'}
    ORDER BY score DESC
    LIMIT 10;
  `
  return customers as any[]
}

export async function createCustomer(data: { name: string, phone?: string, address?: string }) {
  return prisma.customer.create({
    data,
  })
}
