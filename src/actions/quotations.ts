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

  const customerName = formData.get("customer_name") as string
  const description = formData.get("description") as string
  const amount = formData.get("amount") as string | null

  if (!customerName || !description) {
    throw new Error("Missing required fields")
  }

  await prisma.quotation.create({
    data: {
      customer_name: customerName,
      description,
      amount: amount || null,
      status: "DRAFT",
    },
  })

  revalidatePath("/coordinator/quotations")
}

export async function updateQuotationStatus(quotationId: string, status: QuotationStatus) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") {
    throw new Error("Unauthorized")
  }

  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status },
  })

  revalidatePath("/coordinator/quotations")
}
