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

export async function getSalesAnalysis(
  groupBy: "customer" | "model" | "processor" | "generation" | "salesperson" | "category" | "pending_payment" | "source",
  startDate?: Date,
  endDate?: Date
) {
  await checkAccess()

  const transactions = await prisma.transaction.findMany({
    where: {
      type: "SALE",
      ...(startDate && endDate ? { created_at: { gte: startDate, lte: endDate } } : {}),
      ...(groupBy === "pending_payment" ? { pending_amount: { gt: 0 } } : {})
    },
    include: {
      customer: true,
      salesperson: true,
      supplier: true,
      LineItems: true
    }
  })

  const results: Record<string, { name: string, quantity: number, total_value: number }> = {}

  transactions.forEach(tx => {
    if (groupBy === "customer" || groupBy === "salesperson" || groupBy === "pending_payment" || groupBy === "source") {
      let key = "Unknown";
      if (groupBy === "salesperson") key = tx.salesperson?.username || "Unknown"
      else if (groupBy === "customer" || groupBy === "pending_payment") key = tx.customer?.name || "Unknown"
      else if (groupBy === "source") key = tx.supplier?.name || "Unknown"

      if (!results[key]) results[key] = { name: key, quantity: 0, total_value: 0 }

      let qty = 0
      tx.LineItems.forEach(li => {
        qty += (li.type === "SERIALIZED" && li.serial_numbers?.length > 0 ? li.serial_numbers.length : li.quantity) || 1
      })
      results[key].quantity += qty

      if (groupBy === "pending_payment") {
        results[key].total_value += tx.pending_amount;
      } else {
        results[key].total_value += tx.total_value;
      }
    } else {
      // Grouping by LineItem properties
      tx.LineItems.forEach(li => {
        let key = "Unknown"
        if (groupBy === "model" && li.item_model) key = li.item_model
        if (groupBy === "processor" && li.processor) key = li.processor
        if (groupBy === "generation" && li.generation) key = li.generation
        if (groupBy === "category" && li.category) key = li.category

        if (key === "Unknown" && groupBy !== "model") return // skip if no specific trait

        if (!results[key]) results[key] = { name: key, quantity: 0, total_value: 0 }
        results[key].quantity += (li.type === "SERIALIZED" && li.serial_numbers?.length > 0 ? li.serial_numbers.length : li.quantity) || 1
        results[key].total_value += (li.total_price || 0)
      })
    }
  })

  return Object.values(results).sort((a, b) => b.total_value - a.total_value)
}

export async function getSalesAnalysisDetails(
  groupBy: string,
  filterName: string,
  startDate?: Date,
  endDate?: Date
) {
  await checkAccess()

  const transactions = await prisma.transaction.findMany({
    where: {
      type: "SALE",
      ...(startDate && endDate ? { created_at: { gte: startDate, lte: endDate } } : {}),
      ...(groupBy === "pending_payment" ? { pending_amount: { gt: 0 } } : {})
    },
    include: {
      customer: true,
      salesperson: true,
      supplier: true,
      LineItems: true
    }
  })

  const detailedGroupings: Record<string, any> = {}

  transactions.forEach(tx => {
    const isCustomerMatch = (tx.customer?.name || "Unknown") === filterName;
    const isSalespersonMatch = (tx.salesperson?.username || "Unknown") === filterName;
    const isSourceMatch = (tx.supplier?.name || "Unknown") === filterName;

    if ((groupBy === "customer" || groupBy === "pending_payment") && !isCustomerMatch) return;
    if (groupBy === "salesperson" && !isSalespersonMatch) return;
    if (groupBy === "source" && !isSourceMatch) return;

    if (groupBy === "pending_payment") {
      let qty = 0
      tx.LineItems.forEach(li => {
        qty += (li.type === "SERIALIZED" && li.serial_numbers?.length > 0 ? li.serial_numbers.length : li.quantity) || 1
      })

      const d = new Date(tx.created_at)
      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`

      detailedGroupings[tx.id] = {
        date: dateStr,
        items: tx.LineItems,
        quantity: qty,
        amount: tx.pending_amount,
        customerName: tx.customer?.name || "Unknown",
        paymentStatus: tx.payment_status || "UNPAID",
        paymentAccount: tx.payment_account || "-"
      }
      return;
    }

    tx.LineItems.forEach(li => {
      if (groupBy === "model" && li.item_model !== filterName) return;
      if (groupBy === "processor" && li.processor !== filterName) return;
      if (groupBy === "generation" && li.generation !== filterName) return;
      if (groupBy === "category" && li.category !== filterName) return;

      let groupKey = "";
      let groupData: any = {};

      if (groupBy === "customer" || groupBy === "source") {
        groupData = {
          type: li.category || li.type,
          make: li.make || "-",
          model: li.item_model || (li.type === "BUNDLE" ? li.bundle_name : "-"),
          ram: li.ram_gb ? `${li.ram_gb}GB` : "-",
          ssd: li.ssd_gb ? `${li.ssd_gb}GB` : "-",
          processor: li.processor || "-",
          generation: li.generation || "-",
          rate: li.price_per_unit || 0
        };
        groupKey = Object.values(groupData).join("|");
      }
      else if (groupBy === "model") {
        groupData = {
          ram: li.ram_gb ? `${li.ram_gb}GB` : "-",
          ssd: li.ssd_gb ? `${li.ssd_gb}GB` : "-",
          processor: li.processor || "-",
          generation: li.generation || "-",
          rate: li.price_per_unit || 0
        };
        groupKey = Object.values(groupData).join("|");
      }
      else if (groupBy === "processor") {
        groupData = { generation: li.generation || "-" };
        groupKey = groupData.generation;
      }
      else if (groupBy === "generation") {
        groupData = { processor: li.processor || "-" };
        groupKey = groupData.processor;
      }
      else if (groupBy === "salesperson") {
        groupData = {
          type: li.category || li.type,
          make: li.make || "-",
          model: li.item_model || (li.type === "BUNDLE" ? li.bundle_name : "-")
        };
        groupKey = Object.values(groupData).join("|");
      }
      else if (groupBy === "category") {
        groupData = {
          make: li.make || "-",
          model: li.item_model || (li.type === "BUNDLE" ? li.bundle_name : "-")
        };
        groupKey = Object.values(groupData).join("|");
      }

      if (!detailedGroupings[groupKey]) {
        detailedGroupings[groupKey] = { ...groupData, quantity: 0, amount: 0 };
      }
      const qty = (li.type === "SERIALIZED" && li.serial_numbers?.length > 0 ? li.serial_numbers.length : li.quantity) || 1;
      detailedGroupings[groupKey].quantity += qty;
      detailedGroupings[groupKey].amount += (li.total_price || 0);
    })
  })

  return Object.values(detailedGroupings).sort((a: any, b: any) => b.amount - a.amount);
}

export async function getPurchaseAnalysis(
  groupBy: "vendor" | "category" | "model" | "processor" | "generation",
  startDate?: Date,
  endDate?: Date
) {
  await checkAccess()

  const transactions = await prisma.transaction.findMany({
    where: {
      type: "PURCHASE",
      ...(startDate && endDate ? { created_at: { gte: startDate, lte: endDate } } : {})
    },
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

export async function getReplacementAnalysis(
  groupBy: "model" | "customer",
  startDate?: Date,
  endDate?: Date
) {
  await checkAccess()

  const transactions = await prisma.transaction.findMany({
    where: {
      type: "REPLACEMENT",
      ...(startDate && endDate ? { created_at: { gte: startDate, lte: endDate } } : {})
    },
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

export async function getRepairAnalysis(startDate?: Date, endDate?: Date) {
  await checkAccess()

  const transactions = await prisma.transaction.findMany({
    where: {
      type: "REPAIR",
      ...(startDate && endDate ? { created_at: { gte: startDate, lte: endDate } } : {})
    },
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

export async function getRentAnalysis(
  startDate?: Date,
  endDate?: Date
) {
  await checkAccess()
  const transactions = await prisma.transaction.findMany({
    where: {
      type: "RENT",
      ...(startDate && endDate ? { created_at: { gte: startDate, lte: endDate } } : {})
    },
    include: {
      customer: true,
      LineItems: true
    }
  })

  const results: Record<string, any> = {}
  transactions.forEach(tx => {
    const key = tx.customer?.name || "Unknown"
    if (!results[key]) results[key] = { name: key, quantity: 0, total_value: 0 }

    let qty = 0
    tx.LineItems.forEach(li => {
      qty += (li.type === "SERIALIZED" && li.serial_numbers?.length > 0 ? li.serial_numbers.length : li.quantity) || 1
    })
    results[key].quantity += qty
    results[key].total_value += tx.total_value
  })
  return Object.values(results).sort((a: any, b: any) => b.total_value - a.total_value)
}

export async function getReturnAnalysis(
  startDate?: Date,
  endDate?: Date
) {
  await checkAccess()
  const transactions = await prisma.transaction.findMany({
    where: {
      type: "RETURN",
      ...(startDate && endDate ? { created_at: { gte: startDate, lte: endDate } } : {})
    },
    include: {
      customer: true,
      supplier: true,
      LineItems: true
    }
  })

  const results: Record<string, any> = {}
  transactions.forEach(tx => {
    const key = tx.return_type || "Unknown"
    if (!results[key]) results[key] = { name: key + " Return", quantity: 0, total_value: 0 }

    let qty = 0
    tx.LineItems.forEach(li => {
      qty += (li.type === "SERIALIZED" && li.serial_numbers?.length > 0 ? li.serial_numbers.length : li.quantity) || 1
    })
    results[key].quantity += qty
    results[key].total_value += tx.total_value
  })
  return Object.values(results).sort((a: any, b: any) => b.total_value - a.total_value)
}
