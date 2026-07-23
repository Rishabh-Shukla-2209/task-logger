'use server'

import prisma from '@/lib/prisma'
import { SupplierType } from '@prisma/client'

export async function searchSuppliers(query: string, type?: SupplierType) {
  if (!query || query.length < 2) {
    return prisma.supplier.findMany({ 
      where: type ? { type } : undefined,
      take: 10, 
      orderBy: { name: 'asc' } 
    })
  }

  let suppliers;
  if (type) {
    suppliers = await prisma.$queryRaw`
      SELECT id, name, contact, address, type, similarity(name, ${query}) as score
      FROM "Supplier"
      WHERE (similarity(name, ${query}) > 0.25 OR name ILIKE ${'%' + query + '%'})
        AND type = CAST(${type} AS "SupplierType")
      ORDER BY score DESC
      LIMIT 10;
    `
  } else {
    suppliers = await prisma.$queryRaw`
      SELECT id, name, contact, address, type, similarity(name, ${query}) as score
      FROM "Supplier"
      WHERE similarity(name, ${query}) > 0.25 OR name ILIKE ${'%' + query + '%'}
      ORDER BY score DESC
      LIMIT 10;
    `
  }
  return suppliers as any[]
}

export async function createSupplier(data: { name: string, contact?: string, address?: string, type: SupplierType }) {
  return prisma.supplier.create({
    data,
  })
}
