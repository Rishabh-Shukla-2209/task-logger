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
  const supplierId = formData.get("supplier_id") as string

  if (!itemDescription || !supplierId) {
    throw new Error("Missing required fields")
  }

  const req = await prisma.internalRepair.create({
    data: {
      item_description: itemDescription,
      supplier_id: supplierId,
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
  revalidatePath("/manager/repairs")
  revalidatePath("/director/repairs")
}

export async function transitionInternalRepair(repairId: string, newStage: string, remark: string, extraData?: { assignedToId?: string }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") throw new Error("Unauthorized")

  const req = await prisma.internalRepair.findUnique({ where: { id: repairId } })
  if (!req) throw new Error("Not found")

  const validStages: InternalRepairStatus[] = ["RECORDED", "CONFIRMED", "SENT_FOR_REPAIR", "RECEIVED_BACK", "QC_CHECKED", "READY", "SCRAPPED", "DROPPED"]
  if (!validStages.includes(newStage as InternalRepairStatus)) {
    throw new Error("Invalid stage")
  }

  let actionString = `Transitioned from ${req.status} to ${newStage}`
  
  if (newStage === "QC_CHECKED" && extraData?.assignedToId) {
    const qcUser = await prisma.user.findUnique({ where: { id: extraData.assignedToId } })
    if (qcUser) actionString += ` (QC done by: ${qcUser.username})`
  }

  await prisma.$transaction([
    prisma.internalRepair.update({
      where: { id: repairId },
      data: { status: newStage as InternalRepairStatus },
    }),
    prisma.internalRepairEvent.create({
      data: {
        internal_repair_id: repairId,
        user_id: session.user.id,
        action: actionString,
        remark: remark || null,
      },
    })
  ])

  revalidatePath(`/coordinator/repairs/${repairId}`)
  revalidatePath("/coordinator/repairs")
  revalidatePath(`/manager/repairs/${repairId}`)
  revalidatePath("/manager/repairs")
  revalidatePath(`/director/repairs/${repairId}`)
  revalidatePath("/director/repairs")
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
  revalidatePath("/coordinator/repairs")
  revalidatePath(`/manager/repairs/${repairId}`)
  revalidatePath("/manager/repairs")
  revalidatePath(`/director/repairs/${repairId}`)

  revalidatePath("/director/repairs")
}

export async function reopenInternalRepair(repairId: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") throw new Error("Unauthorized")

  await prisma.$transaction([
    prisma.internalRepair.update({
      where: { id: repairId },
      data: { status: "RECORDED" },
    }),
    prisma.internalRepairEvent.create({
      data: {
        internal_repair_id: repairId,
        user_id: session.user.id,
        action: `Reopened (Moved back to RECORDED)`,
        remark: remark || null,
      },
    })
  ])

  revalidatePath(`/coordinator/repairs/${repairId}`)
  revalidatePath("/coordinator/repairs")
  revalidatePath(`/manager/repairs/${repairId}`)
  revalidatePath("/manager/repairs")
  revalidatePath(`/director/repairs/${repairId}`)
  revalidatePath("/director/repairs")
}


export async function updateInternalRepair(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || !["COORDINATOR", "MANAGER", "SUPERUSER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const deviceDetails = formData.get("item_description") as string
  const issue = formData.get("supplier_id") as string

  if (!deviceDetails || !issue) throw new Error("Missing fields")

  const rep = await prisma.internalRepair.findUnique({ where: { id } })
  if (!rep) throw new Error("Repair not found")

  await prisma.internalRepair.update({
    where: { id },
    data: {
      item_description: deviceDetails,
      supplier_id: issue,
    },
  })

  await prisma.internalRepairEvent.create({
    data: {
      internal_repair_id: id,
      user_id: session.user.id,
      action: "Updated repair details",
    },
  })

  revalidatePath("/coordinator/repairs")
  revalidatePath("/manager/repairs")
  revalidatePath("/director/repairs")
  revalidatePath(`/coordinator/repairs/${id}`)
}

