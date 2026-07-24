"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { LineItemPayload } from "@/actions/accounting"
import { TransactionType } from "@prisma/client"

type Props = {
  item: LineItemPayload
  index: number
  transactionType: TransactionType
  updateLineItem: (index: number, updates: Partial<LineItemPayload>) => void
  removeLineItem: (index: number) => void
  readOnly?: boolean
}

const CATEGORIES = ["Laptop", "Desktop", "TFT", "Printer", "RAM", "SSD", "HDD", "Peripheral", "Other"]
const GENERATIONS = ["NA", "1st Gen", "2nd Gen", "3rd Gen", "4th Gen", "5th Gen", "6th Gen", "7th Gen", "8th Gen", "9th Gen", "10th Gen", "11th Gen", "12th Gen", "13th Gen", "14th Gen"]
const PROCESSORS = ["NA", "Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9", "Apple M1", "Apple M2", "Apple M3"]
const DESKTOP_TYPES = ["NA", "Tiny", "SFF", "Flat", "Tower", "All-in-One"]
const RAM_TYPES = ["NA", "DDR3", "DDR4", "DDR5"]
const STORAGE_TYPES = ["NA", "SATA", "M.2 SATA", "NVMe PCIe"]

export function LineItemRow({ item, index, transactionType, updateLineItem, removeLineItem, readOnly }: Props) {
  const isRepair = transactionType === "REPAIR"
  const isReplacement = transactionType === "REPLACEMENT"

  const cat = item.category || ""
  const isLaptop = cat === "Laptop"
  const isDesktop = cat === "Desktop"
  const isTFT = cat === "TFT"
  const isRAM = cat === "RAM"
  const isSSD = cat === "SSD"
  const isHDD = cat === "HDD"
  const isPrinter = cat === "Printer"
  const isPeripheral = cat === "Peripheral"

  return (
    <div className="border p-4 rounded-md relative bg-muted/10">
      {!readOnly && (
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 text-red-500 hover:text-red-700" 
          onClick={() => removeLineItem(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      
      <div className="mb-4">
        <span className="font-bold text-sm uppercase text-primary border px-2 py-1 rounded bg-background">
          {item.type} Item
        </span>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        {item.type === "BUNDLE" ? (
          <>
            <div className="space-y-2 md:col-span-2">
              <Label>Bundle Name</Label>
              <Input value={item.bundle_name || ""} onChange={e => updateLineItem(index, { bundle_name: e.target.value })} required readOnly={readOnly} />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="1" value={item.quantity || 1} onChange={e => updateLineItem(index, { quantity: parseInt(e.target.value) })} required readOnly={readOnly} />
            </div>
            <div className="space-y-2">
              <Label>Total Price (per bundle)</Label>
              <Input type="number" min="0" step="0.01" value={item.total_price || 0} onChange={e => updateLineItem(index, { total_price: parseFloat(e.target.value) })} required readOnly={readOnly} />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label>Bundle Components (JSON mapping)</Label>
              <textarea 
                className="w-full h-24 p-2 border rounded-md text-sm font-mono" 
                placeholder={'[{"category": "RAM", "model": "8GB", "type": "BULK", "quantity": 2}]'}
                value={typeof item.bundle_components === 'string' ? item.bundle_components : JSON.stringify(item.bundle_components || [], null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    updateLineItem(index, { bundle_components: parsed })
                  } catch {
                    updateLineItem(index, { bundle_components: e.target.value })
                  }
                }}
                readOnly={readOnly}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select disabled={readOnly} value={item.category || undefined} onValueChange={(v) => updateLineItem(index, { category: v || undefined })}>
                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {/* Dynamic Fields based on Category */}
            {(isLaptop || isDesktop || isTFT || isRAM || isSSD || isHDD || isPrinter || isPeripheral) && (
              <div className="space-y-2">
                <Label>Make (Brand)</Label>
                <Input value={item.make || ""} onChange={e => updateLineItem(index, { make: e.target.value })} required readOnly={readOnly} />
              </div>
            )}
            
            {(isLaptop || isDesktop || isTFT || isPrinter) && (
              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={item.item_model || ""} onChange={e => updateLineItem(index, { item_model: e.target.value })} required readOnly={readOnly} />
              </div>
            )}

            {(isLaptop || isDesktop) && (
              <>
                <div className="space-y-2">
                  <Label>Processor</Label>
                  <Select disabled={readOnly} value={item.processor || undefined} onValueChange={(v) => updateLineItem(index, { processor: v || undefined })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {PROCESSORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Generation</Label>
                  <Select disabled={readOnly} value={item.generation || undefined} onValueChange={(v) => updateLineItem(index, { generation: v || undefined })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {GENERATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>RAM (GB)</Label>
                  <Input type="number" min="0" value={item.ram_gb || ""} onChange={e => updateLineItem(index, { ram_gb: parseInt(e.target.value) })} required readOnly={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>SSD (GB)</Label>
                  <Input type="number" min="0" value={item.ssd_gb || ""} onChange={e => updateLineItem(index, { ssd_gb: parseInt(e.target.value) })} required readOnly={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>HDD (GB) Optional</Label>
                  <Input type="number" min="0" value={item.hdd_gb || ""} onChange={e => updateLineItem(index, { hdd_gb: parseInt(e.target.value) || undefined })} readOnly={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>Graphic Card Optional</Label>
                  <Input value={item.graphic_card || ""} onChange={e => updateLineItem(index, { graphic_card: e.target.value })} readOnly={readOnly} />
                </div>
              </>
            )}

            {isDesktop && (
              <div className="space-y-2">
                <Label>Desktop Type</Label>
                <Select disabled={readOnly} value={item.desktop_type || undefined} onValueChange={(v) => updateLineItem(index, { desktop_type: v || undefined })}>
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    {DESKTOP_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isTFT && (
              <div className="space-y-2">
                <Label>Screen Size</Label>
                <Input value={item.screen_size || ""} onChange={e => updateLineItem(index, { screen_size: e.target.value })} required readOnly={readOnly} placeholder="e.g. 24 inch" />
              </div>
            )}

            {(isRAM || isSSD || isHDD) && (
              <div className="space-y-2">
                <Label>Capacity (GB)</Label>
                {/* We map SSD/HDD capacity to ssd_gb / hdd_gb / ram_gb based on type to keep it simple, or just reuse ram_gb for simplicity. Wait, we have explicit columns. */}
                {isRAM ? (
                  <Input type="number" min="0" value={item.ram_gb || ""} onChange={e => updateLineItem(index, { ram_gb: parseInt(e.target.value) })} required readOnly={readOnly} />
                ) : isSSD ? (
                  <Input type="number" min="0" value={item.ssd_gb || ""} onChange={e => updateLineItem(index, { ssd_gb: parseInt(e.target.value) })} required readOnly={readOnly} />
                ) : (
                  <Input type="number" min="0" value={item.hdd_gb || ""} onChange={e => updateLineItem(index, { hdd_gb: parseInt(e.target.value) })} required readOnly={readOnly} />
                )}
              </div>
            )}

            {isRAM && (
              <div className="space-y-2">
                <Label>RAM Type</Label>
                <Select disabled={readOnly} value={item.ram_type || undefined} onValueChange={(v) => updateLineItem(index, { ram_type: v || undefined })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {RAM_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isSSD && (
              <div className="space-y-2">
                <Label>Storage Type</Label>
                <Select disabled={readOnly} value={item.storage_type || undefined} onValueChange={(v) => updateLineItem(index, { storage_type: v || undefined })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {STORAGE_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isPeripheral && (
              <div className="space-y-2">
                <Label>Peripheral Item</Label>
                <Input value={item.peripheral_item || ""} onChange={e => updateLineItem(index, { peripheral_item: e.target.value })} required readOnly={readOnly} placeholder="e.g. Mouse, Keyboard" />
              </div>
            )}

            {/* Repair / Replacement specific */}
            {isRepair && (
              <div className="space-y-2 md:col-span-4">
                <Label>Defect</Label>
                <Input value={item.defect || ""} onChange={e => updateLineItem(index, { defect: e.target.value })} required readOnly={readOnly} />
              </div>
            )}
            
            {isReplacement && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>Replacement Reason</Label>
                  <Input value={item.replacement_reason || ""} onChange={e => updateLineItem(index, { replacement_reason: e.target.value })} required readOnly={readOnly} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Replaced With</Label>
                  <Input value={item.replaced_with || ""} onChange={e => updateLineItem(index, { replaced_with: e.target.value })} required readOnly={readOnly} />
                </div>
              </>
            )}

            {/* Serial / MIS Numbers */}
            {(isLaptop || isDesktop || isTFT) && (
              <div className="space-y-2 md:col-span-2">
                <Label>MIS Numbers (comma separated)</Label>
                <Input 
                  value={item.mis_numbers?.join(", ") || ""} 
                  onChange={e => updateLineItem(index, { mis_numbers: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} 
                  placeholder="MIS-001, MIS-002"
                  readOnly={readOnly}
                />
              </div>
            )}

            {item.type === "SERIALIZED" ? (
              <div className="space-y-2 md:col-span-2">
                <Label>Serial Numbers (comma separated)</Label>
                <Input 
                  value={item.serial_numbers?.join(", ") || ""} 
                  onChange={e => updateLineItem(index, { serial_numbers: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} 
                  placeholder="SN123, SN124..."
                  readOnly={readOnly}
                />
                <p className="text-xs text-muted-foreground">Qty: {item.serial_numbers?.length || 0}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min="1" value={item.quantity || 1} onChange={e => updateLineItem(index, { quantity: parseInt(e.target.value) })} required readOnly={readOnly} />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Price Per Unit</Label>
              <Input type="number" min="0" step="0.01" value={item.price_per_unit || ""} onChange={e => updateLineItem(index, { price_per_unit: parseFloat(e.target.value) || undefined })} readOnly={readOnly} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
