"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { startOfDay, endOfDay, subDays } from "date-fns"

export async function fetchTaskHistory({
  userId,
  startDate,
  endDate,
  searchQuery,
  limit = 7, // days
  offset = 0, // days offset
}: {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
  limit?: number;
  offset?: number;
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
  const now = new Date()
  let queryStart = startDate
  let queryEnd = endDate

  if (!queryStart || !queryEnd) {
    const end = subDays(now, offset)
    const start = subDays(end, limit - 1)
    queryEnd = endOfDay(end)
    queryStart = startOfDay(start)
  }

  const tasks = await prisma.task.findMany({
    where: {
      user_id: targetUserId,
      log_date: {
        gte: queryStart,
        lte: queryEnd,
      },
      ...(searchQuery ? {
        description: { contains: searchQuery, mode: "insensitive" }
      } : {})
    },
    orderBy: { log_date: "desc" }
  })

  // Group by date
  const grouped: Record<string, typeof tasks> = {}
  tasks.forEach((task) => {
    const dateStr = task.log_date.toISOString().split("T")[0]
    if (!grouped[dateStr]) grouped[dateStr] = []
    grouped[dateStr].push(task)
  })

  // Convert to array sorted by date descending
  const groupedArray = Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(date => ({
    date,
    tasks: grouped[date]
  }))

  return { data: groupedArray, hasMore: groupedArray.length > 0 } // In a real app we'd check if more exist
}
