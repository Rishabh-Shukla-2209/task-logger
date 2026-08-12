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
  revalidatePath("/manager/warranty")
  revalidatePath("/director/warranty")
}

export async function transitionWarrantyExchange(warrantyId: string, newStage: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session || !["COORDINATOR", "MANAGER", "DIRECTOR"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const we = await prisma.warrantyExchange.findUnique({ where: { id: warrantyId } })
  if (!we) throw new Error("Warranty Exchange not found")

  const validStages: WarrantyStatus[] = ["ADDED", "WARRANTY_CLAIMED", "DROPPED"]
  if (!validStages.includes(newStage as WarrantyStatus)) {
    throw new Error("Invalid stage")
  }

  await prisma.$transaction([
    prisma.warrantyExchange.update({
      where: { id: warrantyId },
      data: { status: newStage as WarrantyStatus },
    }),
    prisma.warrantyExchangeEvent.create({
      data: {
        warranty_exchange_id: warrantyId,
        user_id: session.user.id,
        action: `Transitioned from ${we.status} to ${newStage}`,
        remark: remark || null,
      }
    })
  ])

  revalidatePath(`/coordinator/warranty/${warrantyId}`)
  revalidatePath("/coordinator/warranty")
  revalidatePath(`/manager/warranty/${warrantyId}`)
  revalidatePath("/manager/warranty")
  revalidatePath(`/director/warranty/${warrantyId}`)
  revalidatePath("/director/warranty")
}

export async function addWarrantyExchangeRemark(warrantyId: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session || !["COORDINATOR", "MANAGER", "DIRECTOR"].includes(session.user.role)) {
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
  revalidatePath("/coordinator/warranty")
  revalidatePath(`/manager/warranty/${warrantyId}`)
  revalidatePath("/manager/warranty")
  revalidatePath(`/director/warranty/${warrantyId}`)
  revalidatePath("/director/warranty")
}


export async function updateWarranty(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || !["COORDINATOR", "MANAGER", "SUPERUSER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const supplierId = formData.get("supplier_id") as string
  const deviceDetails = formData.get("device_details") as string
  const reason = formData.get("reason") as string
  const exchangeWith = formData.get("exchange_with") as string | null

  if (!supplierId || !deviceDetails || !reason) throw new Error("Missing fields")

  const w = await prisma.warrantyExchange.findUnique({ where: { id } })
  if (!w) throw new Error("Warranty claim not found")

  await prisma.warrantyExchange.update({
    where: { id },
    data: {
      supplier_id: supplierId,
      device_details: deviceDetails,
      reason,
      exchange_with: exchangeWith || null,
    },
  })

  await prisma.warrantyExchangeEvent.create({
    data: {
      warranty_exchange_id: id,
      user_id: session.user.id,
      action: "Updated warranty details",
    },
  })

  revalidatePath("/coordinator/warranty")
  revalidatePath("/manager/warranty")
  revalidatePath("/director/warranty")
  revalidatePath(`/coordinator/warranty/${id}`)
}

