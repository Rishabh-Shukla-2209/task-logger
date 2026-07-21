"use server";

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function createInternalRepair(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const itemDescription = formData.get("item_description") as string
  const sentTo = formData.get("sent_to") as string
  const sentDateStr = formData.get("sent_date") as string
  const notes = formData.get("notes") as string | null

  if (!itemDescription || !sentTo || !sentDateStr) {
    throw new Error("Missing required fields")
  }

  await prisma.internalRepair.create({
    data: {
      item_description: itemDescription,
      sent_to: sentTo,
      sent_date: new Date(sentDateStr),
      notes: notes || null,
      status: "SENT_OUT",
    },
  })

  revalidatePath("/coordinator/repairs")
}

export async function markRepairReceived(repairId: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const receivedDateStr = formData.get("received_date") as string | null

  await prisma.internalRepair.update({
    where: { id: repairId },
    data: {
      status: "RECEIVED_BACK",
      received_date: receivedDateStr ? new Date(receivedDateStr) : new Date(),
    },
  })

  revalidatePath("/coordinator/repairs")
}
