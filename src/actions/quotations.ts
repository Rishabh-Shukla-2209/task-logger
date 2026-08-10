"use server";

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { QuotationStatus } from "@prisma/client"

export async function createQuotation(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  const customerId = formData.get("customer_id") as string
  const description = formData.get("description") as string
  const amount = formData.get("amount") as string | null

  if (!customerId || !description) {
    throw new Error("Missing required fields")
  }

  const req = await prisma.quotation.create({
    data: {
      customer_id: customerId,
      description,
      amount: amount || null,
      status: "RECORDED",
    },
  })

  await prisma.quotationEvent.create({
    data: {
      quotation_id: req.id,
      user_id: session.user.id,
      action: `Created as RECORDED`,
    },
  })

  revalidatePath("/coordinator/quotations")
  revalidatePath("/manager/quotations")
  revalidatePath("/director/quotations")
}

export async function transitionQuotation(quotationId: string, newStage: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") throw new Error("Unauthorized")

  const req = await prisma.quotation.findUnique({ where: { id: quotationId } })
  if (!req) throw new Error("Not found")

  const validStages: QuotationStatus[] = ["RECORDED", "APPROVED_TO_PROCEED", "VISIT", "PRICE_RECEIVED", "DRAFT", "FINAL_APPROVAL", "SENT", "DROPPED"]
  if (!validStages.includes(newStage as QuotationStatus)) {
    throw new Error("Invalid stage")
  }

  await prisma.$transaction([
    prisma.quotation.update({
      where: { id: quotationId },
      data: { status: newStage as QuotationStatus },
    }),
    prisma.quotationEvent.create({
      data: {
        quotation_id: quotationId,
        user_id: session.user.id,
        action: `Transitioned from ${req.status} to ${newStage}`,
        remark: remark || null,
      },
    })
  ])

  revalidatePath(`/coordinator/quotations/${quotationId}`)
  revalidatePath("/coordinator/quotations")
  revalidatePath(`/manager/quotations/${quotationId}`)
  revalidatePath("/manager/quotations")
  revalidatePath(`/director/quotations/${quotationId}`)
  revalidatePath("/director/quotations")
}

export async function addQuotationRemark(quotationId: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  await prisma.quotationEvent.create({
    data: {
      quotation_id: quotationId,
      user_id: session.user.id,
      action: `Added Note`,
      remark: remark,
    },
  })

  revalidatePath(`/coordinator/quotations/${quotationId}`)
  revalidatePath("/coordinator/quotations")
  revalidatePath(`/manager/quotations/${quotationId}`)
  revalidatePath("/manager/quotations")
  revalidatePath(`/director/quotations/${quotationId}`)
  revalidatePath("/director/quotations")
}

export async function reopenQuotation(quotationId: string, remark: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") throw new Error("Unauthorized")

  await prisma.$transaction([
    prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "RECORDED" },
    }),
    prisma.quotationEvent.create({
      data: {
        quotation_id: quotationId,
        user_id: session.user.id,
        action: `Reopened (Moved back to RECORDED)`,
        remark: remark || null,
      },
    })
  ])

  revalidatePath(`/coordinator/quotations/${quotationId}`)
  revalidatePath("/coordinator/quotations")
  revalidatePath(`/manager/quotations/${quotationId}`)
  revalidatePath("/manager/quotations")
  revalidatePath(`/director/quotations/${quotationId}`)
  revalidatePath("/director/quotations")
}
