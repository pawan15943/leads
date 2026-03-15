"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLists } from "@/contexts/ListsContext"

type LocationSelectProps = {
  countryId?: number | null
  stateId?: number | null
  cityId?: number | null
  onCountryChange?: (id: number | null) => void
  onStateChange?: (id: number | null) => void
  onCityChange?: (id: number | null) => void
  disabled?: boolean
  required?: boolean
}

export function LocationSelect({
  countryId,
  stateId,
  cityId,
  onCountryChange,
  onStateChange,
  onCityChange,
  disabled = false,
  required = false,
}: LocationSelectProps) {
  const { countries, getStates, loadCities } = useLists()
  const states = countryId ? getStates(countryId) : []
  const [cities, setCities] = useState<{ id: number; name: string; state_id: number }[]>([])

  useEffect(() => {
    if (!countryId) {
      onStateChange?.(null)
      onCityChange?.(null)
    }
  }, [countryId])

  useEffect(() => {
    if (stateId) {
      loadCities(stateId).then(setCities).catch(() => setCities([]))
    } else {
      setCities([])
      onCityChange?.(null)
    }
  }, [stateId, loadCities, onCityChange])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label>Country</Label>
        <Select
          value={countryId ? String(countryId) : "none"}
          onValueChange={(v) => onCountryChange?.(v === "none" ? null : Number(v))}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select country</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>State</Label>
        <Select
          value={stateId ? String(stateId) : "none"}
          onValueChange={(v) => onStateChange?.(v === "none" ? null : Number(v))}
          disabled={disabled || !countryId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select state</SelectItem>
            {states.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>
          City
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <Select
          value={cityId ? String(cityId) : "none"}
          onValueChange={(v) => onCityChange?.(v === "none" ? null : Number(v))}
          disabled={disabled || !stateId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select city</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
