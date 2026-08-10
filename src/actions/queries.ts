"use server";

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { QueryType, QueryStatus } from "@prisma/client"

export async function createServiceQuery(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const queryType = formData.get("query_type") as QueryType
  const customerId = formData.get("customer_id") as string
  const deviceDetails = formData.get("device_details") as string | null
  const replacementReason = formData.get("replacement_reason") as string | null

  if (!queryType || !customerId) {
    throw new Error("Missing required fields")
  }

  if ((queryType === "SALE_REPLACEMENT" || queryType === "RENT_REPLACEMENT") && !replacementReason) {
    throw new Error("Replacement Reason is mandatory for replacements")
  }

  const query = await prisma.serviceQuery.create({
    data: {
      query_type: queryType,
      status: "RECORDED",
      customer_id: customerId,
      device_details: deviceDetails || null,
      replacement_reason: replacementReason || null,
    },
  })

  await prisma.queryEvent.create({
    data: {
      query_id: query.id,
      user_id: session.user.id,
      action: `Created as RECORDED (${queryType})`,
    },
  })

  revalidatePath("/coordinator/queries")
  revalidatePath("/manager/queries")
  revalidatePath("/director/queries")
}

export async function transitionServiceQuery(queryId: string, newStage: string, remark: string, extraData?: { assignedToId?: string, replacedWith?: string, confirmedById?: string }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const query = await prisma.serviceQuery.findUnique({ where: { id: queryId } })
  if (!query) throw new Error("Query not found")

  const validStages: QueryStatus[] = ["RECORDED", "CONFIRMED", "MATERIAL_OUT", "ASSIGNED", "QC_CHECKED", "CLEANED", "CROSS_CHECKED", "RESOLVED", "DROPPED"]
  if (!validStages.includes(newStage as QueryStatus)) {
    throw new Error("Invalid stage")
  }

  const updateData: any = { status: newStage as QueryStatus }

  // Validation rules for specific stages
  if (newStage === "CONFIRMED") {
    const isReplacement = query.query_type === "SALE_REPLACEMENT" || query.query_type === "RENT_REPLACEMENT";
    const replacedWith = extraData?.replacedWith
    const confirmedBy = extraData?.confirmedById
    if (isReplacement) {
      if (!replacedWith || !confirmedBy) throw new Error("Missing 'Replaced With' or 'Confirmed By' fields")
      updateData.replaced_with = replacedWith
      updateData.confirmed_by_id = confirmedBy
    } else if (confirmedBy) {
      updateData.confirmed_by_id = confirmedBy
    }
  } else if (newStage === "ASSIGNED") {
    const assignedTo = extraData?.assignedToId
    if (!assignedTo) throw new Error("Missing 'Assigned To' field")
    updateData.assigned_to_id = assignedTo
  }

  let actionString = `Transitioned from ${query.status} to ${newStage}`

  if (newStage === "ASSIGNED" && extraData?.assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: extraData.assignedToId } })
    if (assignee) actionString += ` (Assigned to: ${assignee.username})`
  } else if (newStage === "CONFIRMED" && extraData?.confirmedById) {
    const confirmer = await prisma.user.findUnique({ where: { id: extraData.confirmedById } })
    if (confirmer) actionString += ` (Confirmed by: ${confirmer.username})`
  }

  await prisma.$transaction([
    prisma.serviceQuery.update({
      where: { id: queryId },
      data: updateData,
    }),
    prisma.queryEvent.create({
      data: {
        query_id: queryId,
        user_id: session.user.id,
        action: actionString,
        remark: remark || null,
      },
    })
  ])

  revalidatePath(`/coordinator/queries/${queryId}`)
  revalidatePath("/coordinator/queries")
  revalidatePath(`/manager/queries/${queryId}`)
  revalidatePath("/manager/queries")
  revalidatePath(`/director/queries/${queryId}`)
  revalidatePath("/director/queries")
}

export async function addServiceQueryRemark(queryId: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  await prisma.queryEvent.create({
    data: {
      query_id: queryId,
      user_id: session.user.id,
      action: `Added Note`,
      remark: remark,
    },
  })

  revalidatePath(`/coordinator/queries/${queryId}`)
}

export async function reopenServiceQuery(queryId: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") throw new Error("Unauthorized")

  await prisma.serviceQuery.update({
    where: { id: queryId },
    data: { status: "CONFIRMED" },
  })

  await prisma.queryEvent.create({
    data: {
      query_id: queryId,
      user_id: session.user.id,
      action: `REOPENED (Reverted to CONFIRMED)`,
      remark: remark,
    },
  })

  revalidatePath(`/coordinator/queries/${queryId}`)
  revalidatePath("/coordinator/queries")
  revalidatePath(`/manager/queries/${queryId}`)
  revalidatePath("/manager/queries")
  revalidatePath(`/director/queries/${queryId}`)
  revalidatePath("/director/queries")
}
