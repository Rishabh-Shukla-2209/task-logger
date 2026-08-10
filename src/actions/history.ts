"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { startOfDay, endOfDay, subDays } from "date-fns"
import { TaskStatus } from "@prisma/client"

export async function fetchTaskHistory({
  userId,
  startDate,
  endDate,
  searchQuery,
  status,
  limit = 7, // days
  offset = 0, // days offset
  tzOffset = 0,
}: {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
  status?: TaskStatus;
  limit?: number;
  offset?: number;
  tzOffset?: number;
}) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  let targetUserId = userId
  if (userId === "self") {
    targetUserId = session.user.id
  } else {
    // Check if the current user has permission to view this userId's tasks
    if (session.user.role === "EMPLOYEE" && session.user.id !== userId) {
      throw new Error("Unauthorized access to user tasks")
    }
  }

  // Calculate actual date range based on offset/limit if explicit dates not provided
  let queryStart = startDate
  let queryEnd = endDate

  // Since the client now always provides startDate and endDate properly adjusted to its local timezone,
  // we can still keep the fallback for safety.
  if (!queryStart || !queryEnd) {
    const now = new Date()
    const end = subDays(now, offset)
    const start = subDays(end, limit - 1)
    queryEnd = endOfDay(end)
    queryStart = startOfDay(start)
  }

  let prismaStart = queryStart ? new Date(queryStart.getTime() - (tzOffset * 60000)) : undefined
  let prismaEnd = queryEnd ? new Date(queryEnd.getTime() - (tzOffset * 60000)) : undefined

  const tasks = await prisma.task.findMany({
    where: {
      user_id: targetUserId,
      log_date: {
        gte: prismaStart,
        lte: prismaEnd,
      },
      OR: [
        { assigned_by_id: null },
        { status: "APPROVED" }
      ],
      ...(searchQuery ? {
        description: { contains: searchQuery, mode: "insensitive" }
      } : {}),
      ...(status ? { status } : {})
    },
    orderBy: { log_date: "desc" }
  })

  // Group by date
  const grouped: Record<string, typeof tasks> = {}
  tasks.forEach((task) => {
    if (!task.log_date) return;
    // Offset is in minutes (e.g. -330 for IST)
    const localDate = new Date(task.log_date.getTime() - (tzOffset * 60000))
    const dateStr = localDate.toISOString().split("T")[0]
    if (!grouped[dateStr]) grouped[dateStr] = []
    grouped[dateStr].push(task)
  })

  // Convert to array sorted by date descending
  const groupedArray = Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(date => ({
    date,
    tasks: grouped[date]
  }))

  return { data: groupedArray, hasMore: groupedArray.length > 0 }
}
