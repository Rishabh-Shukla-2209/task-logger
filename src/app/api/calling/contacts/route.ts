import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const ownerId = searchParams.get("ownerId");

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let whereClause: any = {};
    
    // Visibility logic:
    // Sales can only see their own assigned data_owner_id
    // Others (Admin, Manager, Director) can see all, or filter by ownerId
    if (session.user.role === "SALES") {
      whereClause.data_owner_id = session.user.id;
    } else {
      if (ownerId && ownerId !== "ALL") {
        whereClause.data_owner_id = ownerId;
      }
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const contacts = await prisma.callContact.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      take: 100, // Added limit to prevent unbounded fetch on large datasets
      include: {
        customer: true,
        data_owner: {
          select: { username: true }
        },
        CallLogs: {
          orderBy: { created_at: "desc" },
          take: 1,
          select: { status: true, followup_date: true, created_at: true }
        }
      },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching call contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch call contacts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, location, customer_id, data_owner_id } = body;

    if (!name || !phone || !data_owner_id) {
      return NextResponse.json(
        { error: "Name, phone, and Data Owner are required" },
        { status: 400 }
      );
    }
    
    // Check if phone already exists across any user
    const existing = await prisma.callContact.findFirst({
      where: { phone },
      include: { user: { select: { username: true } } }
    });

    if (existing) {
      return NextResponse.json(
        { error: `Customer already exists for ${existing.user.username}` },
        { status: 400 }
      );
    }

    const newContact = await prisma.callContact.create({
      data: {
        name,
        phone,
        location,
        customer_id: customer_id || null,
        user_id: session.user.id, // person who added it
        data_owner_id, // person who owns the data
      },
    });

    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error("Error creating call contact:", error);
    return NextResponse.json(
      { error: "Failed to create call contact" },
      { status: 500 }
    );
  }
}
