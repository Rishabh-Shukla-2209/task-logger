"use server";

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { InternalRepairStatus } from "@prisma/client"

export async function createInternalRepair(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const itemDescription = formData.get("item_description") as string
  const sentTo = formData.get("sent_to") as string
  const vendorShop = formData.get("vendor_shop") as string | null

  if (!itemDescription || !sentTo) {
    throw new Error("Missing required fields")
  }

  const req = await prisma.internalRepair.create({
    data: {
      item_description: itemDescription,
      sent_to: sentTo,
      vendor_shop: vendorShop || null,
      sent_date: new Date(),
      status: "RECORDED",
    },
  })

  await prisma.internalRepairEvent.create({
    data: {
      internal_repair_id: req.id,
      user_id: session.user.id,
      action: `Created as RECORDED`,
    },
  })

  revalidatePath("/coordinator/repairs")
}

export async function transitionInternalRepair(repairId: string, newStage: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") throw new Error("Unauthorized")

  const req = await prisma.internalRepair.findUnique({ where: { id: repairId } })
  if (!req) throw new Error("Not found")

  await prisma.internalRepair.update({
    where: { id: repairId },
    data: { status: newStage as InternalRepairStatus },
  })

  await prisma.internalRepairEvent.create({
    data: {
      internal_repair_id: repairId,
      user_id: session.user.id,
      action: `Transitioned from ${req.status} to ${newStage}`,
      remark: remark || null,
    },
  })

  revalidatePath(`/coordinator/repairs/${repairId}`)
  revalidatePath("/coordinator/repairs")
}

export async function addInternalRepairRemark(repairId: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  await prisma.internalRepairEvent.create({
    data: {
      internal_repair_id: repairId,
      user_id: session.user.id,
      action: `Added Note`,
      remark: remark,
    },
  })

  revalidatePath(`/coordinator/repairs/${repairId}`)
}
