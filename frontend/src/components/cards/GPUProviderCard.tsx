'use client'

import { motion } from 'framer-motion'
import { GPUProvider } from '@/types/marketplace'
import { 
  MapPinIcon, 
  ComputerDesktopIcon, 
  CpuChipIcon,
  CircleStackIcon,
  WifiIcon,
  StarIcon,
  CheckBadgeIcon,
  ClockIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { 
  StarIcon as StarFilledIcon,
  CheckBadgeIcon as CheckBadgeFilledIcon 
} from '@heroicons/react/24/solid'

interface GPUProviderCardProps {
  provider: GPUProvider
  onSelect?: (provider: GPUProvider) => void
  isSelected?: boolean
  showDetailedSpecs?: boolean
}

export default function GPUProviderCard({ 
  provider, 
  onSelect, 
  isSelected = false,
  showDetailedSpecs = false 
}: GPUProviderCardProps) {
  const getStatusColor = (status: GPUProvider['availability']['status']) => {
    switch (status) {
      case 'available': return 'text-neon-green bg-neon-green/10'
      case 'busy': return 'text-neon-blue bg-neon-blue/10'
      case 'maintenance': return 'text-neon-yellow bg-neon-yellow/10'
      case 'offline': return 'text-gray-400 bg-gray-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusIcon = (status: GPUProvider['availability']['status']) => {
    switch (status) {
      case 'available': return '🟢'
      case 'busy': return '🔵'
      case 'maintenance': return '🟡'
      case 'offline': return '⚪'
      default: return '⚪'
    }
  }

  const getVerificationBadge = (level: string, isVerified: boolean) => {
    if (!isVerified) return null
    
    const badgeColors = {
      basic: 'text-blue-400 bg-blue-400/10',
      advanced: 'text-purple-400 bg-purple-400/10',
      enterprise: 'text-neon-green bg-neon-green/10'
    }
    
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badgeColors[level as keyof typeof badgeColors] || badgeColors.basic}`}>
        <CheckBadgeFilledIcon className="w-3 h-3" />
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: provider.pricing.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const renderRating = (rating: number, totalRatings: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[...Array(fullStars)].map((_, i) => (
            <StarFilledIcon key={i} className="w-4 h-4 text-neon-yellow" />
          ))}
          {hasHalfStar && (
            <div className="relative">
              <StarIcon className="w-4 h-4 text-gray-600" />
              <StarFilledIcon className="w-4 h-4 text-neon-yellow absolute top-0 left-0" style={{clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'}} />
            </div>
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <StarIcon key={i} className="w-4 h-4 text-gray-600" />
          ))}
        </div>
        <span className="text-sm text-gray-400">
          {rating.toFixed(1)} ({totalRatings})
        </span>
      </div>
    )
  }

  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.25, 0, 1]
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.25, 0, 1]
      }
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className={`
        group relative overflow-hidden rounded-xl
        ${isSelected 
          ? 'bg-gradient-to-br from-brand-500/20 via-gray-800 to-gray-900 border-2 border-brand-500' 
          : 'card-hover'
        }
        cursor-pointer
        ${showDetailedSpecs ? 'min-h-[600px]' : 'min-h-[420px]'}
      `}
      onClick={() => onSelect?.(provider)}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-neon-violet/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Status indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(provider.availability.status)}`}>
          <span className="text-xs">{getStatusIcon(provider.availability.status)}</span>
          {provider.availability.status.charAt(0).toUpperCase() + provider.availability.status.slice(1)}
        </div>
      </div>

      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors">
                {provider.name}
              </h3>
              {getVerificationBadge(provider.verification.verificationLevel, provider.verification.isVerified)}
            </div>
            
            <div className="flex items-center gap-1 text-gray-400 text-sm mb-2">
              <MapPinIcon className="w-4 h-4" />
              {provider.location.city && `${provider.location.city}, `}
              {provider.location.country}
            </div>

            {renderRating(provider.performance.averageRating, provider.performance.totalRatings)}
          </div>
        </div>

        {/* Description */}
        {provider.description && (
          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
            {provider.description}
          </p>
        )}

        {/* GPU Information */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CpuChipIcon className="w-5 h-5 text-brand-400" />
            <span className="font-semibold text-white">GPU Configuration</span>
          </div>
          
          <div className="space-y-2">
            {provider.hardware.gpus.slice(0, showDetailedSpecs ? undefined : 2).map((gpu, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">{gpu.model}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    gpu.isAvailable 
                      ? 'text-neon-green bg-neon-green/10' 
                      : 'text-gray-400 bg-gray-400/10'
                  }`}>
                    {gpu.isAvailable ? 'Available' : 'Busy'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{gpu.memory}GB VRAM</span>
                  <span>{gpu.manufacturer}</span>
                  {gpu.benchmarkScore && (
                    <span className="text-brand-400">{gpu.benchmarkScore} score</span>
                  )}
                </div>
              </div>
            ))}
            
            {provider.hardware.gpus.length > 2 && !showDetailedSpecs && (
              <div className="text-center py-2">
                <span className="text-sm text-brand-400">
                  +{provider.hardware.gpus.length - 2} more GPUs
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Hardware Info (Detailed view) */}
        {showDetailedSpecs && (
          <div className="mb-4 space-y-3">
            {/* CPU */}
            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <ComputerDesktopIcon className="w-4 h-4 text-brand-400" />
                <span className="font-medium text-white text-sm">CPU</span>
              </div>
              <div className="text-sm text-gray-300">
                {provider.hardware.cpu.model} - {provider.hardware.cpu.cores} cores @ {provider.hardware.cpu.clockSpeed}GHz
              </div>
            </div>

            {/* RAM */}
            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <CircleStackIcon className="w-4 h-4 text-brand-400" />
                <span className="font-medium text-white text-sm">Memory</span>
              </div>
              <div className="text-sm text-gray-300">
                {provider.hardware.ram.total}GB {provider.hardware.ram.type} @ {provider.hardware.ram.speed}MHz
              </div>
            </div>

            {/* Network */}
            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <WifiIcon className="w-4 h-4 text-brand-400" />
                <span className="font-medium text-white text-sm">Network</span>
              </div>
              <div className="text-sm text-gray-300">
                {provider.hardware.network.downloadSpeed}↓ / {provider.hardware.network.uploadSpeed}↑ Mbps
              </div>
            </div>
          </div>
        )}

        {/* Performance Stats */}
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-brand-400 font-bold text-lg">
                {provider.performance.totalJobsCompleted}
              </div>
              <div className="text-gray-400 text-xs">Jobs Completed</div>
            </div>
            
            <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-neon-green font-bold text-lg">
                {provider.availability.uptimePercentage}%
              </div>
              <div className="text-gray-400 text-xs">Uptime</div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-auto">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-lg border border-gray-600">
            <div>
              <div className="flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-neon-yellow" />
                <span className="font-semibold text-white">Pricing</span>
              </div>
              <div className="text-2xl font-bold text-brand-400 mt-1">
                {formatPrice(provider.pricing.hourlyRate)}<span className="text-sm text-gray-400">/hour</span>
              </div>
              {provider.pricing.minimumJobDuration > 60 && (
                <div className="text-xs text-gray-400 mt-1">
                  Min. {Math.ceil(provider.pricing.minimumJobDuration / 60)}h duration
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-400">Reliability Score</div>
              <div className="text-lg font-bold text-neon-violet">
                {Math.round(provider.performance.reliabilityScore)}
              </div>
            </div>
          </div>

          {/* Discounts */}
          {provider.pricing.discounts.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              💰 Up to {Math.max(...provider.pricing.discounts.map(d => d.discountPercentage))}% discount for longer jobs
            </div>
          )}
        </div>

        {/* Hover effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-transparent to-neon-violet/0 group-hover:from-brand-500/10 group-hover:to-neon-violet/10 transition-all duration-500 pointer-events-none" />
        
        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 left-4 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center"
          >
            <CheckBadgeFilledIcon className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
