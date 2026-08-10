"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { TransactionType, PaymentStatus, LineItemType } from "@prisma/client"
import { revalidatePath } from "next/cache"

export type LineItemPayload = {
  id?: string
  type: LineItemType
  category?: string
  item_model?: string
  serial_numbers?: string[]
  mis_numbers?: string[]
  quantity?: number
  bundle_name?: string
  bundle_components?: any
  price_per_unit?: number
  total_price?: number
  
  make?: string
  processor?: string
  generation?: string
  ram_gb?: number
  ssd_gb?: number
  hdd_gb?: number
  graphic_card?: string
  desktop_type?: string
  screen_size?: string
  ram_type?: string
  storage_type?: string
  peripheral_item?: string
  
  defect?: string
  replacement_reason?: string
  replaced_with?: string
}

export type TransactionPayload = {
  type: TransactionType
  customer_id?: string
  supplier_id?: string
  salesperson_id?: string
  total_value: number
  amount_paid: number
  pending_amount: number
  payment_status: PaymentStatus
  payment_account?: string
  remark?: string
  created_at?: Date | string
  line_items: LineItemPayload[]
}

export async function createTransaction(data: TransactionPayload) {
  const session = await getServerSession(authOptions)
  if (!session || !["ACCOUNTANT", "MANAGER", "DIRECTOR"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const transaction = await prisma.transaction.create({
    data: {
      type: data.type,
      customer_id: data.customer_id,
      supplier_id: data.supplier_id,
      salesperson_id: data.salesperson_id,
      accountant_id: session.user.id,
      total_value: data.total_value,
      amount_paid: data.amount_paid,
      pending_amount: data.pending_amount,
      payment_status: data.payment_status,
      payment_account: data.payment_account,
      remark: data.remark,
      ...(data.created_at ? { created_at: new Date(data.created_at) } : {}),
      LineItems: {
        create: data.line_items.map((item) => ({
          type: item.type,
          category: item.category,
          item_model: item.item_model,
          serial_numbers: item.serial_numbers || [],
          mis_numbers: item.mis_numbers || [],
          quantity: item.quantity,
          bundle_name: item.bundle_name,
          bundle_components: item.bundle_components || null,
          price_per_unit: item.price_per_unit,
          total_price: item.total_price !== undefined ? item.total_price : (item.type === "BUNDLE" ? item.total_price : ((item.price_per_unit || 0) * (item.type === "SERIALIZED" ? (item.serial_numbers?.length || 0) : (item.quantity || 1)))),
          make: item.make,
          processor: item.processor,
          generation: item.generation,
          ram_gb: item.ram_gb,
          ssd_gb: item.ssd_gb,
          hdd_gb: item.hdd_gb,
          graphic_card: item.graphic_card,
          desktop_type: item.desktop_type,
          screen_size: item.screen_size,
          ram_type: item.ram_type,
          storage_type: item.storage_type,
          peripheral_item: item.peripheral_item,
          
          defect: item.defect,
          replacement_reason: item.replacement_reason,
          replaced_with: item.replaced_with,
        }))
      }
    }
  })

  revalidatePath("/accountant/transactions")
  return transaction
}

export async function fetchTransactions({
  type,
  payment_status,
}: {
  type?: TransactionType
  payment_status?: PaymentStatus
} = {}) {
  const session = await getServerSession(authOptions)
  if (!session || !["ACCOUNTANT", "MANAGER", "DIRECTOR"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(payment_status ? { payment_status } : {})
    },
    include: {
      customer: true,
      supplier: true,
      salesperson: true,
    },
    orderBy: { created_at: "desc" }
  })

  return transactions
}

export async function fetchTransactionById(id: string) {
  const session = await getServerSession(authOptions)
  if (!session || !["ACCOUNTANT", "MANAGER", "DIRECTOR"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      customer: true,
      supplier: true,
      salesperson: true,
      accountant: true,
      LineItems: true
    }
  })

  return transaction
}

export async function updateTransaction(id: string, data: TransactionPayload) {
  const session = await getServerSession(authOptions)
  if (!session || !["ACCOUNTANT", "MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const existingTransaction = await prisma.transaction.findUnique({
    where: { id },
    include: { LineItems: true }
  })

  if (!existingTransaction) {
    throw new Error("Transaction not found")
  }

  // Record Audit
  await prisma.transactionAudit.create({
    data: {
      transaction_id: id,
      edited_by_id: session.user.id,
      previous_state: JSON.parse(JSON.stringify(existingTransaction)),
      remark: "Edited transaction via form"
    }
  })

  // Delete all existing line items to recreate them
  await prisma.lineItem.deleteMany({
    where: { transaction_id: id }
  })

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      type: data.type,
      customer_id: data.customer_id,
      supplier_id: data.supplier_id,
      salesperson_id: data.salesperson_id,
      total_value: data.total_value,
      amount_paid: data.amount_paid,
      pending_amount: data.pending_amount,
      payment_status: data.payment_status,
      payment_account: data.payment_account,
      remark: data.remark,
      ...(data.created_at ? { created_at: new Date(data.created_at) } : {}),
      LineItems: {
        create: data.line_items.map((item) => ({
          type: item.type,
          category: item.category,
          item_model: item.item_model,
          serial_numbers: item.serial_numbers || [],
          mis_numbers: item.mis_numbers || [],
          quantity: item.quantity,
          bundle_name: item.bundle_name,
          bundle_components: item.bundle_components || null,
          price_per_unit: item.price_per_unit,
          total_price: item.total_price !== undefined ? item.total_price : (item.type === "BUNDLE" ? item.total_price : ((item.price_per_unit || 0) * (item.type === "SERIALIZED" ? (item.serial_numbers?.length || 0) : (item.quantity || 1)))),
          make: item.make,
          processor: item.processor,
          generation: item.generation,
          ram_gb: item.ram_gb,
          ssd_gb: item.ssd_gb,
          hdd_gb: item.hdd_gb,
          graphic_card: item.graphic_card,
          desktop_type: item.desktop_type,
          screen_size: item.screen_size,
          ram_type: item.ram_type,
          storage_type: item.storage_type,
          peripheral_item: item.peripheral_item,
          defect: item.defect,
          replacement_reason: item.replacement_reason,
          replaced_with: item.replaced_with,
        }))
      }
    }
  })

  revalidatePath(`/accountant/transactions/${id}`)
  revalidatePath("/accountant/transactions")
  revalidatePath("/manager/transactions")
  revalidatePath("/director/transactions")
  return transaction
}

export async function deleteTransaction(id: string) {
  const session = await getServerSession(authOptions)
  if (!session || !["ACCOUNTANT", "MANAGER", "DIRECTOR"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  await prisma.transaction.delete({
    where: { id }
  })

  revalidatePath("/accountant/transactions")
  revalidatePath("/manager/transactions")
  revalidatePath("/director/transactions")
}
