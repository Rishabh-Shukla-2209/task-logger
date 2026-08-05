import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let whereClause: any = {
      user_id: session.user.id,
    };
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const contacts = await prisma.callContact.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        customer: true,
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

    const { name, phone, location, customer_id } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
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
        user_id: session.user.id,
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
