'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { handleError } from "@/lib/errorHandler"
import { searchOptions, createOption } from '@/actions/option-actions'
import { OptionType, CategoryFieldGroup } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, Check, Plus, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface OptionComboboxProps {
  type: OptionType
  value: string
  onChange: (value: string) => void
  options?: any[] // Prefetched options to show instantly
  placeholder?: string
  disabled?: boolean
}

export function OptionCombobox({ type, value, onChange, options = [], placeholder, disabled }: OptionComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>(options)
  const [loading, setLoading] = useState(false)
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [newFieldGroup, setNewFieldGroup] = useState<CategoryFieldGroup | ''>('')
  const [creating, setCreating] = useState(false)

  // Hydrate results on mount/prop change
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(options)
    }
  }, [options, query])

  // Debounce search
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      try {
        const res = await searchOptions(type, query)
        setResults(res)
      } catch (err) {
        handleError(err, `Failed to search ${type}`)
      }
      setLoading(false)
    }

    const timer = setTimeout(() => {
      if (open && query.trim().length >= 2) {
        fetchResults()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, type, open])

  const handleCreate = async () => {
    if (!newValue.trim()) return
    setCreating(true)
    try {
      const created = await createOption({ 
        type, 
        value: newValue.trim(),
        field_group: type === 'CATEGORY' ? (newFieldGroup as CategoryFieldGroup) : undefined
      })
      onChange(created.value)
      setCreateDialogOpen(false)
      setOpen(false)
      setQuery('')
      setNewValue('')
      setNewFieldGroup('')
      // Add to local options cache
      if (!options.find(o => o.value === created.value)) {
        options.push(created)
      }
    } catch (err) {
      handleError(err, `Failed to create ${type}`)
    }
    setCreating(false)
  }

  // Find label (actually value is the label here, they match)
  const displayValue = value || ''

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger 
          disabled={disabled}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full justify-between"
        >
          <span className="truncate">{displayValue || placeholder || `Select...`}</span>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={`Search ${type.toLowerCase().replace('_', ' ')}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              results.map((item) => (
                <div
                  key={item.id}
                  className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${value === item.value ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => {
                    onChange(item.value)
                    setOpen(false)
                  }}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {value === item.value && <Check className="h-4 w-4" />}
                  </span>
                  <span>{item.value}</span>
                </div>
              ))
            )}
          </div>
          <div className="border-t p-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-primary"
              onClick={() => {
                setNewValue(query)
                setCreateDialogOpen(true)
                setOpen(false)
              }}
              type="button"
            >
              <Plus className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">
                Add new {query || type.toLowerCase().replace('_', ' ')}
              </span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {type.toLowerCase().replace('_', ' ')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name / Value</Label>
              <Input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Enter value" />
            </div>
            
            {type === 'CATEGORY' && (
              <div className="space-y-2">
                <Label>Field Group</Label>
                <Select value={newFieldGroup} onValueChange={(v: any) => setNewFieldGroup(v)}>
                  <SelectTrigger><SelectValue placeholder="Select fields to show" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPUTE">COMPUTE (Laptop, Server)</SelectItem>
                    <SelectItem value="COMPUTE_DESKTOP">COMPUTE_DESKTOP (Desktop)</SelectItem>
                    <SelectItem value="DISPLAY">DISPLAY (Monitor, TFT)</SelectItem>
                    <SelectItem value="STORAGE_RAM">STORAGE_RAM (RAM Module)</SelectItem>
                    <SelectItem value="STORAGE_DISK">STORAGE_DISK (SSD, HDD)</SelectItem>
                    <SelectItem value="PRINTER">PRINTER</SelectItem>
                    <SelectItem value="PERIPHERAL">PERIPHERAL (Mouse, Keyboard, Dock)</SelectItem>
                    <SelectItem value="OTHER">OTHER (Minimal fields)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  This determines which fields appear in the line item form.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newValue.trim() || (type === 'CATEGORY' && !newFieldGroup)}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
