"use server";

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function createPartRequest(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const partName = formData.get("part_name") as string
  const forWhom = formData.get("for_whom") as string

  if (!partName || !forWhom) {
    throw new Error("Missing fields")
  }

  await prisma.partRequest.create({
    data: {
      part_name: partName,
      for_whom: forWhom,
      requested_by_id: session.user.id,
      status: "PENDING",
    },
  })

  revalidatePath("/coordinator/parts")
}

export async function updatePartPricing(requestId: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  await prisma.partRequest.update({
    where: { id: requestId },
    data: {
      status: "PRICED",
      pricing_received_at: new Date(),
    },
  })

  revalidatePath("/coordinator/parts")
}

export async function approvePartPurchase(requestId: string) {
  const session = await getServerSession(authOptions)
  // Admin approves purchases (the "boss")
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized (Boss only)")
  }

  await prisma.partRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      approved_by_boss_at: new Date(),
    },
  })

  revalidatePath("/coordinator/parts")
  revalidatePath("/admin/parts")
}

export async function markPartOrdered(requestId: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  await prisma.partRequest.update({
    where: { id: requestId },
    data: { status: "ORDERED" },
  })

  revalidatePath("/coordinator/parts")
}

export async function markPartReceived(requestId: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  await prisma.partRequest.update({
    where: { id: requestId },
    data: { status: "RECEIVED" },
  })

  revalidatePath("/coordinator/parts")
}
