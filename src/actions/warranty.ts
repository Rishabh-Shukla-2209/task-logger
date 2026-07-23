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

  const supplierId = formData.get("supplier_id") as string
  const deviceDetails = formData.get("device_details") as string
  const reason = formData.get("reason") as string
  const exchangeWith = formData.get("exchange_with") as string | null

  if (!supplierId || !deviceDetails || !reason) {
    throw new Error("Missing required fields")
  }

  const we = await prisma.warrantyExchange.create({
    data: {
      supplier_id: supplierId,
      device_details: deviceDetails,
      reason,
      exchange_with: exchangeWith || null,
      status: "ADDED",
    },
  })

  await prisma.warrantyExchangeEvent.create({
    data: {
      warranty_exchange_id: we.id,
      user_id: session.user.id,
      action: "Created as ADDED",
    }
  })

  revalidatePath("/coordinator/warranty")
}

export async function transitionWarrantyExchange(warrantyId: string, newStage: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session || !["COORDINATOR", "MANAGER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const we = await prisma.warrantyExchange.findUnique({ where: { id: warrantyId } })
  if (!we) throw new Error("Warranty Exchange not found")

  await prisma.warrantyExchange.update({
    where: { id: warrantyId },
    data: { status: newStage as WarrantyStatus },
  })

  await prisma.warrantyExchangeEvent.create({
    data: {
      warranty_exchange_id: warrantyId,
      user_id: session.user.id,
      action: `${we.status} → ${newStage}`,
      remark: remark || null,
    }
  })

  revalidatePath(`/coordinator/warranty/${warrantyId}`)
  revalidatePath("/coordinator/warranty")
}

export async function addWarrantyExchangeRemark(warrantyId: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session || !["COORDINATOR", "MANAGER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  await prisma.warrantyExchangeEvent.create({
    data: {
      warranty_exchange_id: warrantyId,
      user_id: session.user.id,
      action: "Remark Added",
      remark,
    }
  })

  revalidatePath(`/coordinator/warranty/${warrantyId}`)
}
