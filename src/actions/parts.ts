"use server";

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PartRequestStatus } from "@prisma/client"

export async function createPartRequest(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const partName = formData.get("part_name") as string
  const customerId = formData.get("customer_id") as string
  const supplierId = formData.get("supplier_id") as string | null

  if (!partName || !customerId) {
    throw new Error("Missing fields")
  }

  const req = await prisma.partRequest.create({
    data: {
      part_name: partName,
      customer_id: customerId,
      supplier_id: supplierId || null,
      requested_by_id: session.user.id,
      status: "RECORDED",
    },
  })

  await prisma.partRequestEvent.create({
    data: {
      part_request_id: req.id,
      user_id: session.user.id,
      action: `Created as RECORDED`,
    },
  })

  revalidatePath("/coordinator/parts")
  revalidatePath("/manager/parts")
  revalidatePath("/director/parts")
}

export async function reopenPartRequest(requestId: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") throw new Error("Unauthorized")

  await prisma.$transaction([
    prisma.partRequest.update({
      where: { id: requestId },
      data: { status: "RECORDED" },
    }),
    prisma.partRequestEvent.create({
      data: {
        part_request_id: requestId,
        user_id: session.user.id,
        action: `Reopened (Moved back to RECORDED)`,
        remark: remark || null,
      },
    })
  ])

  revalidatePath(`/coordinator/parts/${requestId}`)
  revalidatePath("/coordinator/parts")
  revalidatePath(`/manager/parts/${requestId}`)
  revalidatePath("/manager/parts")
  revalidatePath(`/director/parts/${requestId}`)
  revalidatePath("/director/parts")
}

export async function transitionPartRequest(requestId: string, newStage: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") throw new Error("Unauthorized")

  const req = await prisma.partRequest.findUnique({ where: { id: requestId } })
  if (!req) throw new Error("Not found")

  const validStages: PartRequestStatus[] = ["RECORDED", "PRICING_RECEIVED", "APPROVED_BY_BOSS", "ORDERED", "RECEIVED", "DROPPED"]
  if (!validStages.includes(newStage as PartRequestStatus)) {
    throw new Error("Invalid stage")
  }

  await prisma.$transaction([
    prisma.partRequest.update({
      where: { id: requestId },
      data: { status: newStage as PartRequestStatus },
    }),
    prisma.partRequestEvent.create({
      data: {
        part_request_id: requestId,
        user_id: session.user.id,
        action: `Transitioned from ${req.status} to ${newStage}`,
        remark: remark || null,
      },
    })
  ])

  revalidatePath(`/coordinator/parts/${requestId}`)
  revalidatePath("/coordinator/parts")
  revalidatePath(`/manager/parts/${requestId}`)
  revalidatePath("/manager/parts")
  revalidatePath(`/director/parts/${requestId}`)
  revalidatePath("/director/parts")
}

export async function addPartRequestRemark(requestId: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  await prisma.partRequestEvent.create({
    data: {
      part_request_id: requestId,
      user_id: session.user.id,
      action: `Added Note`,
      remark: remark,
    },
  })

  revalidatePath(`/coordinator/parts/${requestId}`)
  revalidatePath("/coordinator/parts")
  revalidatePath(`/manager/parts/${requestId}`)
  revalidatePath("/manager/parts")
  revalidatePath(`/director/parts/${requestId}`)
  revalidatePath("/director/parts")
}
