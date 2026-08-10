'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { handleError } from "@/lib/errorHandler"
import { searchCustomers, createCustomer } from '@/actions/customer-actions'
import { searchSuppliers, createSupplier } from '@/actions/supplier-actions'
import { SupplierType } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, Check, Plus, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type EntityType = 'customer' | 'supplier'

interface EntityComboboxProps {
  type: EntityType
  supplierType?: SupplierType
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function EntityCombobox({ type, supplierType, value, onChange, placeholder, disabled }: EntityComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedName, setSelectedName] = useState('')
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newExtra, setNewExtra] = useState('') // phone or contact
  const [creating, setCreating] = useState(false)

  // Debounce logic
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      try {
        if (type === 'customer') {
          const res = await searchCustomers(query)
          setResults(res)
        } else {
          const res = await searchSuppliers(query, supplierType)
          setResults(res)
        }
      } catch (err) {
        handleError(err, `Failed to search ${type}s`)
      }
      setLoading(false)
    }

    const timer = setTimeout(() => {
      if (open && query.trim().length >= 2) {
        fetchResults()
      } else if (open && query.trim().length < 2) {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, type, supplierType, open])

  // Initial fetch removed to prevent huge data loads
  useEffect(() => {
    if (open && query === '') {
      setResults([])
    }
  }, [open, query])

  // Fetch selected entity name if value is provided but name is empty (basic hydration if needed, but usually we just set it)
  // For simplicity, we just pass ID. But we need to show the name.
  // Actually, wait, since we only store ID in form, we need to show name.
  // We can look it up in results, or assume the parent passes the name.
  // Let's just find it in results.
  useEffect(() => {
    const found = results.find(r => r.id === value)
    if (found) setSelectedName(found.name)
  }, [value, results])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      let created;
      if (type === 'customer') {
        created = await createCustomer({ name: newName, phone: newExtra })
      } else {
        created = await createSupplier({ name: newName, contact: newExtra, type: supplierType || 'BOTH' })
      }
      onChange(created.id)
      setSelectedName(created.name)
      setCreateDialogOpen(false)
      setOpen(false)
      setQuery('')
      setNewName('')
      setNewExtra('')
    } catch (err) {
      handleError(err, `Failed to create ${type}`)
    }
    setCreating(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger 
          disabled={disabled}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full justify-between"
        >
          {value ? (selectedName || 'Selected') : (placeholder || `Select ${type}...`)}
        </PopoverTrigger>
        <PopoverContent className="w-[350px] md:w-[450px] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={`Search ${type}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : query.trim().length < 2 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Start typing to search (min 2 characters)...
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              results.map((item) => (
                <div
                  key={item.id}
                  className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${value === item.id ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => {
                    onChange(item.id)
                    setSelectedName(item.name)
                    setOpen(false)
                  }}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {value === item.id && <Check className="h-4 w-4" />}
                  </span>
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    {(item.phone || item.contact || item.address) && (
                      <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                        {item.phone || item.contact} {item.address ? `- ${item.address}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t p-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-primary"
              onClick={() => {
                setNewName(query)
                setCreateDialogOpen(true)
                setOpen(false)
              }}
              type="button"
            >
              <Plus className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">
                Add new {type}
              </span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <input type="hidden" name={type === 'customer' ? 'customer_id' : 'supplier_id'} value={value} />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {type === 'customer' ? 'Customer' : 'Supplier'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Company or Individual Name" />
            </div>
            <div className="space-y-2">
              <Label>{type === 'customer' ? 'Phone' : 'Contact Person / Phone'}</Label>
              <Input value={newExtra} onChange={e => setNewExtra(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
