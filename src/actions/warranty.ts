"use server";

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { WarrantyStatus } from "@prisma/client"

export async function createWarrantyExchange(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const customerName = formData.get("customer_name") as string
  const deviceDetails = formData.get("device_details") as string
  const reason = formData.get("reason") as string
  const exchangeWith = formData.get("exchange_with") as string | null

  if (!customerName || !deviceDetails || !reason) {
    throw new Error("Missing required fields")
  }

  await prisma.warrantyExchange.create({
    data: {
      customer_name: customerName,
      device_details: deviceDetails,
      reason,
      exchange_with: exchangeWith || null,
      status: "RECORDED",
    },
  })

  revalidatePath("/coordinator/warranty")
}

export async function updateWarrantyStatus(warrantyId: string, status: WarrantyStatus) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  await prisma.warrantyExchange.update({
    where: { id: warrantyId },
    data: { status },
  })

  revalidatePath("/coordinator/warranty")
}
