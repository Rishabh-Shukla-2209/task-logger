import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let dateFilter: any = {
      user_id: session.user.id,
    };
    if (startDate || endDate) {
      dateFilter.created_at = {};
      if (startDate) {
        dateFilter.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.created_at.lte = end;
      }
    }

    const logs = await prisma.callLog.findMany({
      where: dateFilter,
      select: {
        created_at: true,
        status: true,
      },
      orderBy: {
        created_at: "desc",
      }
    });

    // Grouping by Date in YYYY-MM-DD format
    const summaryMap: Record<string, any> = {};

    logs.forEach(log => {
      // Create local date string
      const dateKey = log.created_at.toISOString().split('T')[0];
      
      if (!summaryMap[dateKey]) {
        summaryMap[dateKey] = {
          date: dateKey,
          total: 0,
          DID_NOT_ANSWER: 0,
          INVALID_CONTACT: 0,
          SWITCHED_OFF: 0,
          SOLD: 0,
          FOLLOW_UP: 0,
          DONT_CALL_AGAIN: 0,
          DIFFERENT_REQUIREMENT: 0,
          PRICING_ISSUE: 0,
          QTY_INSUFFICIENT: 0,
          NO_REQUIREMENT_RIGHT_NOW: 0,
        };
      }

      summaryMap[dateKey].total += 1;
      if (summaryMap[dateKey][log.status] !== undefined) {
        summaryMap[dateKey][log.status] += 1;
      }
    });

    const summaryList = Object.values(summaryMap).sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json(summaryList);
  } catch (error: any) {
    console.error("Error fetching logs summary:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
