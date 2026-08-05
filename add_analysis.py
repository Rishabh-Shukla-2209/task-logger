with open("src/actions/analysis.ts", "a") as f:
    f.write("""
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
""")

with open("src/components/director/SingleAnalysis.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'getRepairAnalysis, getSalesAnalysisDetails } from "@/actions/analysis"',
    'getRepairAnalysis, getSalesAnalysisDetails, getRentAnalysis, getReturnAnalysis } from "@/actions/analysis"'
)

fetch_data_old = """      if (type === "SALE") setData(await getSalesAnalysis(salesGroupBy, startDate, endDate))
      else if (type === "PURCHASE") setData(await getPurchaseAnalysis(purchaseGroupBy, startDate, endDate))
      else if (type === "REPLACEMENT") setData(await getReplacementAnalysis(replacementGroupBy, startDate, endDate))
      else if (type === "REPAIR") setData(await getRepairAnalysis(startDate, endDate))"""

fetch_data_new = """      if (type === "SALE") setData(await getSalesAnalysis(salesGroupBy, startDate, endDate))
      else if (type === "PURCHASE") setData(await getPurchaseAnalysis(purchaseGroupBy, startDate, endDate))
      else if (type === "REPLACEMENT") setData(await getReplacementAnalysis(replacementGroupBy, startDate, endDate))
      else if (type === "REPAIR") setData(await getRepairAnalysis(startDate, endDate))
      else if (type === "RENT") setData(await getRentAnalysis(startDate, endDate))
      else if (type === "RETURN") setData(await getReturnAnalysis(startDate, endDate))"""

content = content.replace(fetch_data_old, fetch_data_new)

with open("src/components/director/SingleAnalysis.tsx", "w") as f:
    f.write(content)
print("Updated Analysis")
