"use server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { TransactionType } from "@prisma/client"

async function checkAccess() {
  const session = await getServerSession(authOptions)
  if (!session || !["DIRECTOR", "MANAGER", "ACCOUNTANT"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }
}

export async function getSalesAnalysis(groupBy: "customer" | "model" | "processor" | "generation" | "salesperson") {
  await checkAccess()
  
  const transactions = await prisma.transaction.findMany({
    where: { type: "SALE" },
    include: {
      customer: true,
      salesperson: true,
      LineItems: true
    }
  })

  const results: Record<string, { name: string, quantity: number, total_value: number }> = {}

  transactions.forEach(tx => {
    if (groupBy === "customer" || groupBy === "salesperson") {
      const key = groupBy === "customer" ? (tx.customer?.name || "Unknown") : (tx.salesperson?.username || "Unknown")
      if (!results[key]) results[key] = { name: key, quantity: 0, total_value: 0 }
      
      // For transaction level grouping, sum all line items for qty, and use tx.total_value (or sum line item total_price)
      let qty = 0
      tx.LineItems.forEach(li => {
        qty += (li.quantity || li.serial_numbers.length || 1)
      })
      results[key].quantity += qty
      results[key].total_value += tx.total_value
    } else {
      // Grouping by LineItem properties
      tx.LineItems.forEach(li => {
        let key = "Unknown"
        if (groupBy === "model" && li.item_model) key = li.item_model
        if (groupBy === "processor" && li.processor) key = li.processor
        if (groupBy === "generation" && li.generation) key = li.generation
        
        // If it's a bundle with components, it's harder to group properly, but for now we group the main line item
        if (key === "Unknown" && groupBy !== "model") return // skip if no processor/gen

        if (!results[key]) results[key] = { name: key, quantity: 0, total_value: 0 }
        results[key].quantity += (li.quantity || li.serial_numbers.length || 1)
        results[key].total_value += (li.total_price || 0)
      })
    }
  })

  return Object.values(results).sort((a, b) => b.total_value - a.total_value)
}

export async function getPurchaseAnalysis(groupBy: "vendor" | "category" | "model" | "processor" | "generation") {
  await checkAccess()
  
  const transactions = await prisma.transaction.findMany({
    where: { type: "PURCHASE" },
    include: {
      supplier: true,
      LineItems: true
    }
  })

  const results: Record<string, { name: string, quantity: number, total_value: number }> = {}

  transactions.forEach(tx => {
    if (groupBy === "vendor") {
      const key = tx.supplier?.name || "Unknown"
      if (!results[key]) results[key] = { name: key, quantity: 0, total_value: 0 }
      
      let qty = 0
      tx.LineItems.forEach(li => {
        qty += (li.quantity || li.serial_numbers.length || 1)
      })
      results[key].quantity += qty
      results[key].total_value += tx.total_value
    } else {
      tx.LineItems.forEach(li => {
        let key = "Unknown"
        if (groupBy === "category" && li.category) key = li.category
        if (groupBy === "model" && li.item_model) key = li.item_model
        if (groupBy === "processor" && li.processor) key = li.processor
        if (groupBy === "generation" && li.generation) key = li.generation
        
        if (key === "Unknown" && groupBy !== "category" && groupBy !== "model") return

        if (!results[key]) results[key] = { name: key, quantity: 0, total_value: 0 }
        results[key].quantity += (li.quantity || li.serial_numbers.length || 1)
        results[key].total_value += (li.total_price || 0)
      })
    }
  })

  return Object.values(results).sort((a, b) => b.total_value - a.total_value)
}

export async function getReplacementAnalysis(groupBy: "model" | "customer") {
  await checkAccess()
  
  const transactions = await prisma.transaction.findMany({
    where: { type: "REPLACEMENT" },
    include: {
      customer: true,
      LineItems: true
    }
  })

  const results: Record<string, { name: string, quantity: number, total_value: number }> = {}

  transactions.forEach(tx => {
    if (groupBy === "customer") {
      const key = tx.customer?.name || "Unknown"
      if (!results[key]) results[key] = { name: key, quantity: 0, total_value: 0 }
      
      let qty = 0
      tx.LineItems.forEach(li => {
        qty += (li.quantity || li.serial_numbers.length || 1)
      })
      results[key].quantity += qty
      results[key].total_value += tx.total_value
    } else {
      tx.LineItems.forEach(li => {
        let key = li.item_model || "Unknown"
        
        if (!results[key]) results[key] = { name: key, quantity: 0, total_value: 0 }
        results[key].quantity += (li.quantity || li.serial_numbers.length || 1)
        results[key].total_value += (li.total_price || 0)
      })
    }
  })

  return Object.values(results).sort((a, b) => b.quantity - a.quantity)
}

export async function getRepairAnalysis() {
  await checkAccess()
  
  const transactions = await prisma.transaction.findMany({
    where: { type: "REPAIR" },
    include: {
      customer: true,
      LineItems: true
    },
    orderBy: { created_at: 'desc' }
  })

  // For repairs, user just wants a table representation. 
  // We'll flatten the line items into rows.
  const results = transactions.flatMap(tx => {
    return tx.LineItems.map(li => ({
      id: li.id,
      transaction_id: tx.id,
      date: tx.created_at,
      customer: tx.customer?.name || "Unknown",
      category: li.category || "-",
      model: li.item_model || "-",
      defect: li.defect || "-",
      quantity: li.quantity || li.serial_numbers.length || 1,
      repair_cost: li.total_price || 0,
      remark: tx.remark || "-"
    }))
  })

  return results
}
