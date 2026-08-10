"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { TaskStatus } from "@prisma/client"
import { startOfDay, endOfDay } from "date-fns"

export async function fetchAssignments({
  userId,
  status,
  startDate,
  endDate,
  page = 1,
  limit = 10,
}: {
  userId: string;
  status?: TaskStatus | "PENDING_ONLY" | "ALL";
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  let targetUserId = userId
  if (userId === "self") {
    targetUserId = session.user.id
  } else {
    // Only Managers/Admins can view other's assignments generally, but wait, employees only view their own
    if (session.user.role === "EMPLOYEE" && session.user.id !== userId) {
      throw new Error("Unauthorized access")
    }
  }

  let statusFilter: any = undefined
  if (status && status !== "ALL") {
    if (status === "PENDING_ONLY") {
      statusFilter = "PENDING"
    } else {
      statusFilter = status
    }
  }

  let dateFilter: any = undefined
  if (startDate && endDate) {
    dateFilter = {
      gte: startOfDay(startDate),
      lte: endOfDay(endDate),
    }
  } else if (startDate) {
    dateFilter = { gte: startOfDay(startDate) }
  } else if (endDate) {
    dateFilter = { lte: endOfDay(endDate) }
  }

  const skip = (page - 1) * limit

  const where = {
    user_id: targetUserId,
    assigned_by_id: { not: null },
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(dateFilter ? { due_date: dateFilter } : {}),
  }

  const [assignments, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assigned_by: { select: { username: true } }
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.task.count({ where })
  ])

  return {
    data: assignments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
