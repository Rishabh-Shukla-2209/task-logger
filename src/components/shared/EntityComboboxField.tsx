'use client'
import { useState } from 'react'
import { EntityCombobox } from './EntityCombobox'
import { SupplierType } from '@prisma/client'

export function EntityComboboxField({ type, supplierType }: { type: 'customer' | 'supplier', supplierType?: SupplierType }) {
  const [value, setValue] = useState('')
  return <EntityCombobox type={type} supplierType={supplierType} value={value} onChange={setValue} />
}
