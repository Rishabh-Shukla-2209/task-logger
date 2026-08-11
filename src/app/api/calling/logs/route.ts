import { NextResponse } from "next/server";
import { CallStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const status = searchParams.get("status") as CallStatus | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let whereClause: any = {
      user_id: session.user.id,
    };

    if (contactId) {
      whereClause.contact_id = contactId;
    }
    
    if (status && Object.values(CallStatus).includes(status)) {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) {
        whereClause.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        // To include the whole end date, set to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.created_at.lte = end;
      }
    }

    const logs = await prisma.callLog.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      take: 200, // Added limit to prevent unbounded fetch on large datasets
      include: {
        contact: true,
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          }
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching call logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch call logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      contact_id, 
      user_id, 
      status, 
      remark, 
      requirement, 
      price_given, 
      price_asked, 
      qty,
      convertToCustomer
    } = body;

    if (!contact_id || !user_id || !status) {
      return NextResponse.json(
        { error: "contact_id, user_id, and status are required" },
        { status: 400 }
      );
    }

    // Validation based on status
    if (status === "DIFFERENT_REQUIREMENT" && !requirement) {
      return NextResponse.json({ error: "Requirement is mandatory for DIFFERENT_REQUIREMENT status" }, { status: 400 });
    }
    if (status === "PRICING_ISSUE" && (price_given === undefined || price_asked === undefined)) {
      return NextResponse.json({ error: "Price Given and Price Asked are mandatory for PRICING_ISSUE status" }, { status: 400 });
    }
    if (status === "QTY_INSUFFICIENT" && qty === undefined) {
      return NextResponse.json({ error: "Quantity is mandatory for QTY_INSUFFICIENT status" }, { status: 400 });
    }

    // Start a transaction in case we need to convert to customer
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Call Log
      const log = await tx.callLog.create({
        data: {
          contact_id,
          user_id,
          status,
          remark,
          requirement,
          price_given: price_given ? parseFloat(price_given) : null,
          price_asked: price_asked ? parseFloat(price_asked) : null,
          qty: qty ? parseInt(qty, 10) : null,
        },
      });

      // 2. Handle conversion if requested
      if (convertToCustomer && status === "SOLD") {
        const contact = await tx.callContact.findUnique({ where: { id: contact_id } });
        
        if (contact && !contact.customer_id) {
          const newCustomer = await tx.customer.create({
            data: {
              name: contact.name,
              phone: contact.phone,
              address: contact.location,
              user_id: user_id,
            }
          });

          await tx.callContact.update({
            where: { id: contact_id },
            data: { customer_id: newCustomer.id }
          });
        }
      }

      return log;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Your session appears to be invalid or expired. Please log out and log in again." }, { status: 401 });
    }
    console.error("Error creating call log:", error);
    return NextResponse.json(
      { error: "Failed to create call log" },
      { status: 500 }
    );
  }
}
