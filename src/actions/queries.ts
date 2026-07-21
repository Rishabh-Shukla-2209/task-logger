"use server";

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { QueryType, QueryStatus } from "@prisma/client"

const STEP_ORDER: QueryStatus[] = [
  "RECORDED",
  "CONFIRMED",
  "DISPATCHED",
  "ASSIGNED",
  "RECEIVED",
  "QC_CHECKED",
  "PACKED",
  "RESOLVED",
]

export async function createServiceQuery(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const queryType = formData.get("query_type") as QueryType
  const customerName = formData.get("customer_name") as string
  const deviceDetails = formData.get("device_details") as string | null
  const replacementReason = formData.get("replacement_reason") as string | null
  const replacedWith = formData.get("replaced_with") as string | null

  if (!queryType || !customerName) {
    throw new Error("Missing required fields")
  }

  const query = await prisma.serviceQuery.create({
    data: {
      query_type: queryType,
      status: "RECORDED",
      customer_name: customerName,
      device_details: deviceDetails || null,
      replacement_reason: replacementReason || null,
      replaced_with: replacedWith || null,
    },
  })

  // Record the creation event
  await prisma.queryEvent.create({
    data: {
      query_id: query.id,
      user_id: session.user.id,
      action: `Query created as RECORDED (${queryType})`,
    },
  })

  revalidatePath("/coordinator")
}

export async function advanceQueryStep(queryId: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const query = await prisma.serviceQuery.findUnique({ where: { id: queryId } })
  if (!query) throw new Error("Query not found")

  const currentIndex = STEP_ORDER.indexOf(query.status)
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
    throw new Error("Cannot advance further")
  }

  const nextStatus = STEP_ORDER[currentIndex + 1]

  await prisma.serviceQuery.update({
    where: { id: queryId },
    data: { status: nextStatus },
  })

  await prisma.queryEvent.create({
    data: {
      query_id: queryId,
      user_id: session.user.id,
      action: `${query.status} → ${nextStatus}`,
    },
  })

  revalidatePath(`/coordinator/service-desk/${queryId}`)
  revalidatePath("/coordinator")
}

export async function reopenQuery(queryId: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const query = await prisma.serviceQuery.findUnique({ where: { id: queryId } })
  if (!query || query.status !== "RESOLVED") {
    throw new Error("Only resolved queries can be reopened")
  }

  await prisma.serviceQuery.update({
    where: { id: queryId },
    data: { status: "RECEIVED" },
  })

  await prisma.queryEvent.create({
    data: {
      query_id: queryId,
      user_id: session.user.id,
      action: "RESOLVED → RECEIVED (Reopened)",
    },
  })

  revalidatePath(`/coordinator/service-desk/${queryId}`)
  revalidatePath("/coordinator")
}

export async function updateReplacementDetails(queryId: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const reason = formData.get("replacement_reason") as string
  const replacedWith = formData.get("replaced_with") as string
  const approvedById = formData.get("replacement_approved_by_id") as string

  await prisma.serviceQuery.update({
    where: { id: queryId },
    data: {
      replacement_reason: reason,
      replaced_with: replacedWith,
      replacement_approved_by_id: approvedById || null,
    },
  })

  await prisma.queryEvent.create({
    data: {
      query_id: queryId,
      user_id: session.user.id,
      action: `Replacement details updated: reason="${reason}", replaced with="${replacedWith}"`,
    },
  })

  revalidatePath(`/coordinator/service-desk/${queryId}`)
}
