"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createFollowup(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const clientName = formData.get("client_name") as string
  const pendingAmount = parseFloat(formData.get("pending_amount") as string)
  const remark = formData.get("remark") as string

  if (!clientName || isNaN(pendingAmount)) {
    throw new Error("Missing or invalid fields")
  }

  await prisma.$transaction(async (tx) => {
    const followup = await tx.paymentFollowup.create({
      data: {
        client_name: clientName,
        pending_amount: pendingAmount,
        status: "ACTIVE",
      }
    })

    await tx.paymentFollowupEvent.create({
      data: {
        followup_id: followup.id,
        user_id: session.user.id,
        action: "RECORDED",
        remark: remark || "Initial followup recorded."
      }
    })
  })

  revalidatePath("/admin/followups")
  revalidatePath("/manager/followups")
  revalidatePath("/director/followups")
}

export async function addFollowupEvent(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const followupId = formData.get("followup_id") as string
  const remark = formData.get("remark") as string
  const action = formData.get("action") as string // e.g. "FOLLOW_UP" or "RESOLVED"
  const amountChangeStr = formData.get("amount_change") as string
  const amountChange = amountChangeStr ? parseFloat(amountChangeStr) : null

  if (!followupId || !action) {
    throw new Error("Missing required fields")
  }

  await prisma.$transaction(async (tx) => {
    let previousAmount: number | null = null;
    const isValidAmountChange = amountChange !== null && !isNaN(amountChange) && amountChange !== 0;
    
    if (isValidAmountChange) {
      const currentFollowup = await tx.paymentFollowup.findUnique({
        where: { id: followupId },
        select: { pending_amount: true }
      });
      if (currentFollowup) {
        previousAmount = currentFollowup.pending_amount;
        const newAmount = previousAmount + amountChange;
        
        if (newAmount < 0) {
          throw new Error("Amount cannot go below zero");
        }

        await tx.paymentFollowup.update({
          where: { id: followupId },
          data: { 
            pending_amount: newAmount,
            ...(action === "RESOLVED" ? { status: "RESOLVED" } : {})
          }
        });
      }
    } else if (action === "RESOLVED") {
      await tx.paymentFollowup.update({
        where: { id: followupId },
        data: { status: "RESOLVED" }
      });
    }

    await tx.paymentFollowupEvent.create({
      data: {
        followup_id: followupId,
        user_id: session.user.id,
        action: action,
        remark: remark,
        amount_change: isValidAmountChange ? amountChange : null,
        previous_amount: previousAmount
      }
    });
  })

  revalidatePath("/admin/followups")
  revalidatePath(`/admin/followups/${followupId}`)
  revalidatePath("/manager/followups")
  revalidatePath("/director/followups")
}
