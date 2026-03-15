"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import { listsApi } from "@/lib/api"

export type ListStage = { id: number; name: string; slug: string; color?: string | null }
export type ListSource = { id: number; name: string; slug: string }
export type ListUser = { id: number; name: string; email: string }
export type ListTag = { id: number; name: string }
export type ListCountry = { id: number; name: string; code: string | null }
export type ListState = { id: number; name: string; code: string | null; country_id: number }
export type ListCity = { id: number; name: string; state_id: number }

type ListsState = {
  stages: ListStage[]
  sources: ListSource[]
  users: ListUser[]
  tags: ListTag[]
  callStatuses: { id: number; name: string }[]
  countries: ListCountry[]
  states: ListState[]
  loading: boolean
  loaded: boolean
  /** States filtered by country (or all if no countryId) */
  getStates: (countryId?: number) => ListState[]
  /** Load cities for a state (cached) */
  loadCities: (stateId: number) => Promise<ListCity[]>
  /** Invalidate cache - call after master data changes */
  invalidate: () => void
}

const ListsContext = createContext<ListsState | null>(null)

export function ListsProvider({ children }: { children: ReactNode }) {
  const [stages, setStages] = useState<ListStage[]>([])
  const [sources, setSources] = useState<ListSource[]>([])
  const [users, setUsers] = useState<ListUser[]>([])
  const [tags, setTags] = useState<ListTag[]>([])
  const [callStatuses, setCallStatuses] = useState<ListTag[]>([])
  const [countries, setCountries] = useState<ListCountry[]>([])
  const [states, setStates] = useState<ListState[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const citiesCache = useRef<Map<number, ListCity[]>>(new Map())
  const fetchPromise = useRef<Promise<void> | null>(null)

  const fetchAll = useCallback(async () => {
    if (fetchPromise.current) return fetchPromise.current
    setLoading(true)
    citiesCache.current.clear()
    const p = Promise.all([
      listsApi.leadStages().catch(() => []),
      listsApi.leadSources().catch(() => []),
      listsApi.users().catch(() => []),
      listsApi.tags().catch(() => []),
      listsApi.callStatuses().catch(() => []),
      listsApi.countries().catch(() => []),
      listsApi.states().catch(() => []),
    ]).then(([stg, src, usr, tgs, cst, cnt, sts]) => {
      setStages(stg)
      setSources(src)
      setUsers(usr)
      setTags(tgs)
      setCallStatuses(cst)
      setCountries(cnt)
      setStates(sts)
      setLoaded(true)
    })
    fetchPromise.current = p
    await p
    setLoading(false)
    fetchPromise.current = null
  }, [])

  const getStates = useCallback(
    (countryId?: number): ListState[] =>
      countryId ? states.filter((s) => s.country_id === countryId) : states,
    [states]
  )

  const loadCities = useCallback(async (stateId: number): Promise<ListCity[]> => {
    const cached = citiesCache.current.get(stateId)
    if (cached) return cached
    const cities = await listsApi.cities(stateId).catch(() => [])
    citiesCache.current.set(stateId, cities)
    return cities
  }, [])

  const invalidate = useCallback(() => {
    fetchPromise.current = null
    citiesCache.current.clear()
    setLoaded(false)
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const value: ListsState = {
    stages,
    sources,
    users,
    tags,
    callStatuses,
    countries,
    states,
    loading,
    loaded,
    getStates,
    loadCities,
    invalidate,
  }

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>
}

export function useLists() {
  const ctx = useContext(ListsContext)
  if (!ctx) throw new Error("useLists must be used within ListsProvider")
  return ctx
}

/** Optional hook - returns null if outside provider (e.g. login page) */
export function useListsOptional() {
  return useContext(ListsContext)
}
