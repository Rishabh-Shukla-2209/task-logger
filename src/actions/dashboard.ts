"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function fetchGlobalProgress() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized")
  }

  // Active items are those NOT in their final states
  const [activeQueries, activeQuotations, activeParts, activeRepairs] = await Promise.all([
    prisma.serviceQuery.findMany({
      where: { status: { not: "RESOLVED" } },
      orderBy: { updated_at: "desc" },
      take: 10
    }),
    prisma.quotation.findMany({
      where: { status: { not: "SENT" } },
      orderBy: { updated_at: "desc" },
      take: 10
    }),
    prisma.partRequest.findMany({
      where: { status: { not: "RECEIVED" } },
      orderBy: { updated_at: "desc" },
      take: 10
    }),
    prisma.internalRepair.findMany({
      where: { status: { notIn: ["READY", "SCRAPPED"] } },
      orderBy: { updated_at: "desc" },
      take: 10
    })
  ])

  const [countQueries, countQuotations, countParts, countRepairs] = await Promise.all([
    prisma.serviceQuery.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.quotation.count({ where: { status: { not: "SENT" } } }),
    prisma.partRequest.count({ where: { status: { not: "RECEIVED" } } }),
    prisma.internalRepair.count({ where: { status: { notIn: ["READY", "SCRAPPED"] } } }),
  ])

  return {
    queries: { data: activeQueries, total: countQueries },
    quotations: { data: activeQuotations, total: countQuotations },
    parts: { data: activeParts, total: countParts },
    repairs: { data: activeRepairs, total: countRepairs }
  }
}
