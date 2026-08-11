'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OptionType, CategoryFieldGroup } from '@prisma/client'

export async function fetchOptions(type: OptionType) {
  return prisma.lineItemOption.findMany({
    where: { type, is_active: true },
    orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
  })
}

export async function fetchAllOptions() {
  const all = await prisma.lineItemOption.findMany({
    where: { is_active: true },
    orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
  })

  // Group by type
  const grouped = {
    categories: [] as any[],
    generations: [] as any[],
    processors: [] as any[],
    desktopTypes: [] as any[],
    ramTypes: [] as any[],
    storageTypes: [] as any[],
    makes: [] as any[],
    models: [] as any[]
  }

  all.forEach(opt => {
    switch (opt.type) {
      case 'CATEGORY': grouped.categories.push(opt); break;
      case 'GENERATION': grouped.generations.push(opt); break;
      case 'PROCESSOR': grouped.processors.push(opt); break;
      case 'DESKTOP_TYPE': grouped.desktopTypes.push(opt); break;
      case 'RAM_TYPE': grouped.ramTypes.push(opt); break;
      case 'STORAGE_TYPE': grouped.storageTypes.push(opt); break;
      case 'MAKE': grouped.makes.push(opt); break;
      case 'MODEL': grouped.models.push(opt); break;
    }
  })

  return grouped
}

export async function createOption(data: { type: OptionType, value: string, field_group?: CategoryFieldGroup }) {
  const session = await getServerSession(authOptions)
  if (!session || !["ACCOUNTANT", "MANAGER", "DIRECTOR", "SUPERUSER"].includes(session.user.role)) {
    throw new Error('Unauthorized')
  }

  try {
    return await prisma.lineItemOption.create({
      data: {
        type: data.type,
        value: data.value,
        field_group: data.field_group,
        sort_order: 999 // New items go to end
      },
    })
  } catch (error: any) {
    if (error.code === 'P2002') { // Unique constraint
      throw new Error(`This ${data.type.toLowerCase()} already exists.`)
    }
    throw error
  }
}

export async function searchOptions(type: OptionType, query: string) {
  if (!query || query.length < 2) {
    return prisma.lineItemOption.findMany({
      where: { type, is_active: true },
      take: 10,
      orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
    })
  }

  return prisma.lineItemOption.findMany({
    where: {
      type,
      is_active: true,
      value: { contains: query, mode: 'insensitive' }
    },
    take: 10,
    orderBy: { value: 'asc' }
  })
}
