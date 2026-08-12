'use client'
import { useState } from 'react'
import { EntityCombobox } from './EntityCombobox'
import { SupplierType } from '@prisma/client'

export function EntityComboboxField({ type, supplierType, initialValue }: { type: 'customer' | 'supplier', supplierType?: SupplierType, initialValue?: string }) {
  const [value, setValue] = useState(initialValue || '')
  return <EntityCombobox type={type} supplierType={supplierType} value={value} onChange={setValue} />
}
