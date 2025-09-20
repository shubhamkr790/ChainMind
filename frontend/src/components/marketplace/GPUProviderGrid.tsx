'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GPUProvider, 
  ProviderFilters, 
  PaginatedResponse 
} from '@/types/marketplace'
import GPUProviderCard from '@/components/cards/GPUProviderCard'
import { apiService } from '@/services/api'
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  StarIcon,
  XMarkIcon,
  ChevronDownIcon,
  Bars3BottomLeftIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'
import { Listbox, Transition } from '@headlessui/react'

interface GPUProviderGridProps {
  onProviderSelect?: (provider: GPUProvider) => void
  selectedProviderId?: string
  showFilters?: boolean
  initialFilters?: ProviderFilters
  gridView?: 'grid' | 'list'
}

const sortOptions = [
  { id: 'price', name: 'Price: Low to High', field: 'price', order: 'asc' },
  { id: 'price-desc', name: 'Price: High to Low', field: 'price', order: 'desc' },
  { id: 'rating', name: 'Rating: High to Low', field: 'rating', order: 'desc' },
  { id: 'performance', name: 'Performance: Best First', field: 'performance', order: 'desc' },
  { id: 'newest', name: 'Newest First', field: 'newest', order: 'desc' },
  { id: 'location', name: 'Location', field: 'location', order: 'asc' }
]

const gpuTypes = [
  'RTX 4090', 'RTX 4080', 'RTX 4070', 'RTX 3090', 'RTX 3080', 'RTX 3070',
  'A100', 'A6000', 'A5000', 'A4000', 'V100', 'T4'
]

export default function GPUProviderGrid({
  onProviderSelect,
  selectedProviderId,
  showFilters = true,
  initialFilters = {},
  gridView = 'grid'
}: GPUProviderGridProps) {
  const [providers, setProviders] = useState<GPUProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ProviderFilters>(initialFilters)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [selectedSort, setSelectedSort] = useState(sortOptions[0])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(gridView)

  // Load providers
  const loadProviders = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const appliedFilters: ProviderFilters = {
        ...filters,
        sortBy: selectedSort.field as any,
        sortOrder: selectedSort.order as any
      }

      const response = await apiService.getProviders(appliedFilters, page, pagination.limit)
      
      if (response.success && response.data) {
        setProviders(response.data.data)
        setPagination(response.data.pagination)
      } else {
        setError(response.error?.message || 'Failed to load providers')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load providers')
    } finally {
      setLoading(false)
    }
  }

  // Search providers
  const searchProviders = async (query: string) => {
    if (!query.trim()) {
      return loadProviders(1)
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiService.searchProviders(query, filters)
      
      if (response.success && response.data) {
        setProviders(response.data)
        setPagination(prev => ({ ...prev, page: 1, total: response.data!.length }))
      } else {
        setError(response.error?.message || 'Search failed')
      }
    } catch (err: any) {
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  // Effect to load data
  useEffect(() => {
    if (searchQuery) {
      const debounce = setTimeout(() => {
        searchProviders(searchQuery)
      }, 500)
      return () => clearTimeout(debounce)
    } else {
      loadProviders(pagination.page)
    }
  }, [filters, selectedSort, searchQuery])

  // Filter helpers
  const updateFilter = (key: keyof ProviderFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => 
      filters[key as keyof ProviderFilters] !== undefined && 
      filters[key as keyof ProviderFilters] !== null
    ) || searchQuery.length > 0
  }, [filters, searchQuery])

  // Pagination
  const nextPage = () => {
    if (pagination.hasNext) {
      const newPage = pagination.page + 1
      setPagination(prev => ({ ...prev, page: newPage }))
      loadProviders(newPage)
    }
  }

  const prevPage = () => {
    if (pagination.hasPrev) {
      const newPage = pagination.page - 1
      setPagination(prev => ({ ...prev, page: newPage }))
      loadProviders(newPage)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">⚠️ Error loading providers</div>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => loadProviders()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header with Search and Controls */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Bars3BottomLeftIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Sort */}
            <Listbox value={selectedSort} onChange={setSelectedSort}>
              <div className="relative">
                <Listbox.Button className="relative w-full min-w-[200px] cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-300 sm:text-sm border border-gray-600">
                  <span className="block truncate text-white">{selectedSort.name}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute right-0 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                    {sortOptions.map((option) => (
                      <Listbox.Option
                        key={option.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-4 pr-4 ${
                            active ? 'bg-brand-500 text-white' : 'text-gray-300'
                          }`
                        }
                        value={option}
                      >
                        {({ selected }) => (
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {option.name}
                          </span>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>

            {/* Filter Toggle */}
            {showFilters && (
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilterPanel || hasActiveFilters
                    ? 'bg-brand-500 border-brand-500 text-white' 
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-neon-green text-gray-900 rounded-full w-2 h-2"></span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-400">Active filters:</span>
            {searchQuery && (
              <span className="px-2 py-1 bg-brand-500/20 text-brand-400 rounded-full text-xs flex items-center gap-1">
                Search: "{searchQuery}"
                <XMarkIcon 
                  className="w-3 h-3 cursor-pointer hover:text-white" 
                  onClick={() => setSearchQuery('')}
                />
              </span>
            )}
            {Object.entries(filters).map(([key, value]) => (
              value && (
                <span key={key} className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs flex items-center gap-1">
                  {key}: {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                  <XMarkIcon 
                    className="w-3 h-3 cursor-pointer hover:text-white" 
                    onClick={() => updateFilter(key as keyof ProviderFilters, undefined)}
                  />
                </span>
              )
            ))}
            <button
              onClick={clearFilters}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPinIcon className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Country or region"
                    value={filters.location || ''}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* GPU Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <CpuChipIcon className="w-4 h-4 inline mr-1" />
                    GPU Type
                  </label>
                  <select
                    value={filters.gpuType || ''}
                    onChange={(e) => updateFilter('gpuType', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Any GPU</option>
                    {gpuTypes.map(gpu => (
                      <option key={gpu} value={gpu}>{gpu}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                    Max Hourly Rate
                  </label>
                  <input
                    type="number"
                    placeholder="$ per hour"
                    value={filters.hourlyRate?.max || ''}
                    onChange={(e) => updateFilter('hourlyRate', { 
                      ...filters.hourlyRate, 
                      max: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Verification */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <CheckBadgeIcon className="w-4 h-4 inline mr-1" />
                    Verification
                  </label>
                  <select
                    value={filters.verified?.toString() || ''}
                    onChange={(e) => updateFilter('verified', e.target.value === 'true')}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Any Status</option>
                    <option value="true">Verified Only</option>
                    <option value="false">Unverified Only</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-400 text-sm">
          {loading ? 'Loading...' : `${pagination.total} provider${pagination.total !== 1 ? 's' : ''} found`}
        </div>
        <div className="text-gray-400 text-sm">
          Page {pagination.page} of {pagination.totalPages}
        </div>
      </div>

      {/* Provider Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-4"></div>
              <div className="h-3 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded mb-4"></div>
              <div className="h-20 bg-gray-700 rounded mb-4"></div>
              <div className="h-8 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">🔍 No providers found</div>
          <p className="text-gray-500 mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your filters or search criteria'
              : 'No GPU providers are currently available'
            }
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}
        >
          {providers.map((provider) => (
            <GPUProviderCard
              key={provider.id}
              provider={provider}
              onSelect={onProviderSelect}
              isSelected={provider.id === selectedProviderId}
              showDetailedSpecs={viewMode === 'list'}
            />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {providers.length > 0 && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prevPage}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {[...Array(Math.min(pagination.totalPages, 7))].map((_, i) => {
              const pageNum = i + Math.max(1, pagination.page - 3)
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: pageNum }))
                    loadProviders(pageNum)
                  }}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    pageNum === pagination.page
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={nextPage}
            disabled={!pagination.hasNext}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
