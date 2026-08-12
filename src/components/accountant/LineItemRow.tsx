"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { LineItemPayload } from "@/actions/accounting"
import { TransactionType } from "@prisma/client"
import { EntityCombobox } from "@/components/shared/EntityCombobox"
import { OptionCombobox } from "@/components/shared/OptionCombobox"

type Props = {
  item: LineItemPayload
  index: number
  transactionType: TransactionType
  updateLineItem: (index: number, updates: Partial<LineItemPayload>) => void
  removeLineItem: (index: number) => void
  readOnly?: boolean
  options?: any
}

export function LineItemRow({ item, index, transactionType, updateLineItem, removeLineItem, readOnly, options = {} }: Props) {
  const isRepair = transactionType === "REPAIR"
  const isReplacement = transactionType === "REPLACEMENT"

  const cat = item.category || ""
  const categoryOption = options.categories?.find((c: any) => c.value === cat)
  const fg = categoryOption?.field_group

  const isCompute = fg === "COMPUTE" || fg === "COMPUTE_DESKTOP"
  const isDesktop = fg === "COMPUTE_DESKTOP"
  const isDisplay = fg === "DISPLAY"
  const isRAM = fg === "STORAGE_RAM"
  const isDisk = fg === "STORAGE_DISK"
  const isPrinter = fg === "PRINTER"
  const isPeripheral = fg === "PERIPHERAL"

  // Backward compatibility checks for missing field groups
  const isLaptopCompat = !fg && cat === "Laptop"
  const isDesktopCompat = !fg && cat === "Desktop"
  const isTFTCompat = !fg && cat === "TFT"
  const isRAMCompat = !fg && cat === "RAM"
  const isSSDCompat = !fg && cat === "SSD"
  const isHDDCompat = !fg && cat === "HDD"
  const isPrinterCompat = !fg && cat === "Printer"
  const isPeripheralCompat = !fg && cat === "Peripheral"

  const showMake = isCompute || isDisplay || isRAM || isDisk || isPrinter || isPeripheral || isLaptopCompat || isDesktopCompat || isTFTCompat || isRAMCompat || isSSDCompat || isHDDCompat || isPrinterCompat || isPeripheralCompat
  const showModel = isCompute || isDisplay || isPrinter || isLaptopCompat || isDesktopCompat || isTFTCompat || isPrinterCompat
  const showComputeFields = isCompute || isLaptopCompat || isDesktopCompat
  const showDesktopType = isDesktop || isDesktopCompat
  const showScreenSize = isDisplay || isTFTCompat
  const showStorageFields = isRAM || isDisk || isRAMCompat || isSSDCompat || isHDDCompat
  const showRamType = isRAM || isRAMCompat
  const showStorageType = isDisk || isSSDCompat
  const showPeripheralItem = isPeripheral || isPeripheralCompat
  const showMisNumbers = isCompute || isDisplay || isLaptopCompat || isDesktopCompat || isTFTCompat

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
            <div className="space-y-2">
              <Label>Bundle Name</Label>
              <Input value={item.bundle_name || ""} onChange={e => updateLineItem(index, { bundle_name: e.target.value })} required readOnly={readOnly} />
            </div>
            <div className="space-y-2">
              <Label>Supplier <span className="text-red-500">*</span></Label>
              <EntityCombobox type="supplier" value={item.supplier_id || ""} onChange={(v) => updateLineItem(index, { supplier_id: v })} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="1" value={item.quantity || 1} onChange={e => updateLineItem(index, { quantity: parseInt(e.target.value) })} required readOnly={readOnly} />
            </div>
            <div className="space-y-2">
              <Label>Total Price (per bundle)</Label>
              <Input type="number" min="0" step="0.01" value={item.total_price || 0} onChange={e => updateLineItem(index, { total_price: parseFloat(e.target.value) })} required readOnly={readOnly} />
            </div>
            <div className="space-y-4 md:col-span-4 border rounded-md p-4 bg-muted/20">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Bundle Components</Label>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = Array.isArray(item.bundle_components) ? item.bundle_components : [];
                      updateLineItem(index, {
                        bundle_components: [...current, { category: "", model: "", type: "BULK", quantity: 1 }]
                      })
                    }}
                  >
                    + Add Component
                  </Button>
                )}
              </div>
              
              {(() => {
                let comps: any[] = [];
                if (Array.isArray(item.bundle_components)) comps = item.bundle_components;
                else if (typeof item.bundle_components === 'string') {
                  try { comps = JSON.parse(item.bundle_components) } catch { comps = [] }
                }
                
                return comps.length > 0 ? (
                  <div className="space-y-3 mt-2">
                    {comps.map((comp: any, compIdx: number) => (
                    <div key={compIdx} className="grid grid-cols-12 gap-2 items-end border-b pb-3 border-border/50 last:border-0 last:pb-0">
                      <div className="col-span-3">
                        <Label className="text-xs text-muted-foreground">Category</Label>
                        <Input 
                          placeholder="e.g. RAM" 
                          value={comp.category || ""}
                          onChange={(e) => {
                            const newComps = [...(item.bundle_components as any[])];
                            newComps[compIdx].category = e.target.value;
                            updateLineItem(index, { bundle_components: newComps });
                          }}
                          readOnly={readOnly}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs text-muted-foreground">Model</Label>
                        <Input 
                          placeholder="e.g. 8GB" 
                          value={comp.model || ""}
                          onChange={(e) => {
                            const newComps = [...(item.bundle_components as any[])];
                            newComps[compIdx].model = e.target.value;
                            updateLineItem(index, { bundle_components: newComps });
                          }}
                          readOnly={readOnly}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <Select
                          disabled={readOnly}
                          value={comp.type || "BULK"}
                          onValueChange={(v) => {
                            const newComps = [...(item.bundle_components as any[])];
                            newComps[compIdx].type = v;
                            updateLineItem(index, { bundle_components: newComps });
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BULK">BULK</SelectItem>
                            <SelectItem value="SERIALIZED">SERIALIZED</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs text-muted-foreground">
                          {comp.type === "SERIALIZED" ? "Serial Nums (CSV)" : "Quantity"}
                        </Label>
                        {comp.type === "SERIALIZED" ? (
                          <Input 
                            placeholder="SN1, SN2" 
                            value={comp.serial_numbers ? comp.serial_numbers.join(", ") : ""}
                            onChange={(e) => {
                              const newComps = [...(item.bundle_components as any[])];
                              const raw = e.target.value;
                              newComps[compIdx].serial_numbers = raw ? raw.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
                              updateLineItem(index, { bundle_components: newComps });
                            }}
                            readOnly={readOnly}
                            className="h-8 text-sm"
                          />
                        ) : (
                          <Input 
                            type="number" 
                            min="1" 
                            value={comp.quantity || 1}
                            onChange={(e) => {
                              const newComps = [...(item.bundle_components as any[])];
                              newComps[compIdx].quantity = parseInt(e.target.value) || 1;
                              updateLineItem(index, { bundle_components: newComps });
                            }}
                            readOnly={readOnly}
                            className="h-8 text-sm"
                          />
                        )}
                      </div>
                      {!readOnly && (
                        <div className="col-span-1 flex justify-center pb-0.5">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 h-8 w-8 p-0"
                            onClick={() => {
                              const newComps = [...(item.bundle_components as any[])];
                              newComps.splice(compIdx, 1);
                              updateLineItem(index, { bundle_components: newComps });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic py-2">
                  No components added yet.
                </div>
              );
              })()}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Category</Label>
              <OptionCombobox 
                type="CATEGORY" 
                value={item.category || ""} 
                onChange={(v) => updateLineItem(index, { category: v || undefined })} 
                options={options.categories} 
                disabled={readOnly} 
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier <span className="text-red-500">*</span></Label>
              <EntityCombobox type="supplier" value={item.supplier_id || ""} onChange={(v) => updateLineItem(index, { supplier_id: v })} disabled={readOnly} />
            </div>
            
            {/* Dynamic Fields based on Category */}
            {showMake && (
              <div className="space-y-2">
                <Label>Make (Brand)</Label>
                <OptionCombobox 
                  type="MAKE" 
                  value={item.make || ""} 
                  onChange={(v) => updateLineItem(index, { make: v || undefined })} 
                  options={options.makes} 
                  disabled={readOnly} 
                  placeholder="Select Make"
                />
              </div>
            )}
            
            {showModel && (
              <div className="space-y-2">
                <Label>Model</Label>
                <OptionCombobox 
                  type="MODEL" 
                  value={item.item_model || ""} 
                  onChange={(v) => updateLineItem(index, { item_model: v || undefined })} 
                  options={options.models} 
                  disabled={readOnly} 
                  placeholder="Select Model"
                />
              </div>
            )}

            {showComputeFields && (
              <>
                <div className="space-y-2">
                  <Label>Processor</Label>
                  <OptionCombobox 
                    type="PROCESSOR" 
                    value={item.processor || ""} 
                    onChange={(v) => updateLineItem(index, { processor: v || undefined })} 
                    options={options.processors} 
                    disabled={readOnly} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Generation</Label>
                  <OptionCombobox 
                    type="GENERATION" 
                    value={item.generation || ""} 
                    onChange={(v) => updateLineItem(index, { generation: v || undefined })} 
                    options={options.generations} 
                    disabled={readOnly} 
                  />
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

            {showDesktopType && (
              <div className="space-y-2">
                <Label>Desktop Type</Label>
                <OptionCombobox 
                  type="DESKTOP_TYPE" 
                  value={item.desktop_type || ""} 
                  onChange={(v) => updateLineItem(index, { desktop_type: v || undefined })} 
                  options={options.desktopTypes} 
                  disabled={readOnly} 
                />
              </div>
            )}

            {showScreenSize && (
              <div className="space-y-2">
                <Label>Screen Size</Label>
                <Input value={item.screen_size || ""} onChange={e => updateLineItem(index, { screen_size: e.target.value })} required readOnly={readOnly} placeholder="e.g. 24 inch" />
              </div>
            )}

            {showStorageFields && (
              <div className="space-y-2">
                <Label>Capacity (GB)</Label>
                {/* We map SSD/HDD capacity to ssd_gb / hdd_gb / ram_gb based on type to keep it simple, or just reuse ram_gb for simplicity. Wait, we have explicit columns. */}
                {cat === "RAM" || isRAM ? (
                  <Input type="number" min="0" value={item.ram_gb || ""} onChange={e => updateLineItem(index, { ram_gb: parseInt(e.target.value) })} required readOnly={readOnly} />
                ) : cat === "SSD" || cat === "NVMe" ? (
                  <Input type="number" min="0" value={item.ssd_gb || ""} onChange={e => updateLineItem(index, { ssd_gb: parseInt(e.target.value) })} required readOnly={readOnly} />
                ) : (
                  <Input type="number" min="0" value={item.hdd_gb || ""} onChange={e => updateLineItem(index, { hdd_gb: parseInt(e.target.value) })} required readOnly={readOnly} />
                )}
              </div>
            )}

            {showRamType && (
              <div className="space-y-2">
                <Label>RAM Type</Label>
                <OptionCombobox 
                  type="RAM_TYPE" 
                  value={item.ram_type || ""} 
                  onChange={(v) => updateLineItem(index, { ram_type: v || undefined })} 
                  options={options.ramTypes} 
                  disabled={readOnly} 
                />
              </div>
            )}

            {showStorageType && (
              <div className="space-y-2">
                <Label>Storage Type</Label>
                <OptionCombobox 
                  type="STORAGE_TYPE" 
                  value={item.storage_type || ""} 
                  onChange={(v) => updateLineItem(index, { storage_type: v || undefined })} 
                  options={options.storageTypes} 
                  disabled={readOnly} 
                />
              </div>
            )}

            {showPeripheralItem && (
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
            {showMisNumbers && (
              <div className="space-y-2 md:col-span-2">
                <Label>MIS Numbers (comma separated)</Label>
                <Input 
                  value={item.mis_numbers?.join(",") || ""} 
                  onChange={e => updateLineItem(index, { mis_numbers: e.target.value.split(",") })} 
                  placeholder="MIS-001, MIS-002"
                  readOnly={readOnly}
                />
              </div>
            )}

            {item.type === "SERIALIZED" ? (
              <div className="space-y-2 md:col-span-2">
                <Label>Serial Numbers (comma separated)</Label>
                <Input 
                  value={item.serial_numbers?.join(",") || ""} 
                  onChange={e => {
                    const sns = e.target.value.split(",");
                    const validCount = sns.map(s => s.trim()).filter(Boolean).length;
                    updateLineItem(index, { 
                      serial_numbers: sns, 
                      total_price: (item.price_per_unit || 0) * validCount 
                    });
                  }}
                  placeholder="SN123, SN124..."
                  readOnly={readOnly}
                />
                <p className="text-xs text-muted-foreground">Qty: {item.serial_numbers?.map(s => s.trim()).filter(Boolean).length || 0}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min="1" value={item.quantity || 1} onChange={e => {
                  const qty = parseInt(e.target.value) || 1;
                  updateLineItem(index, { 
                    quantity: qty,
                    total_price: (item.price_per_unit || 0) * qty 
                  });
                }} required readOnly={readOnly} />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Price Per Unit (Rate)</Label>
              <Input type="number" min="0" step="0.01" value={item.price_per_unit || ""} onChange={e => {
                const ppu = parseFloat(e.target.value) || 0;
                const qty = item.type === "SERIALIZED" ? (item.serial_numbers?.map(s => s.trim()).filter(Boolean).length || 0) : (item.quantity || 1);
                updateLineItem(index, { price_per_unit: ppu || undefined, total_price: ppu * qty })
              }} readOnly={readOnly} />
            </div>
            
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input type="number" min="0" step="0.01" value={item.total_price || ""} onChange={e => {
                const total = parseFloat(e.target.value) || 0;
                const qty = item.type === "SERIALIZED" ? (item.serial_numbers?.map(s => s.trim()).filter(Boolean).length || 0) : (item.quantity || 1);
                updateLineItem(index, { total_price: total || undefined, price_per_unit: qty > 0 ? (total / qty) : 0 })
              }} readOnly={readOnly} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
