'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animated?: boolean
  showText?: boolean
  variant?: 'light' | 'dark' | 'gradient'
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
}

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl', 
  xl: 'text-3xl'
}

export default function Logo({ 
  size = 'md', 
  className = '', 
  animated = false,
  showText = false,
  variant = 'light'
}: LogoProps) {
  const logoElement = (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Image */}
      <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
        <Image
          src="/assets/chainmind-logo.png"
          alt="ChainMind"
          fill
          className="object-contain"
          priority={size === 'lg' || size === 'xl'}
        />
      </div>
      
      {/* Optional Text */}
      {showText && (
        <div className="flex flex-col">
          <span 
            className={`font-bold tracking-tight ${textSizeClasses[size]} ${
              variant === 'light' 
                ? 'text-white' 
                : variant === 'dark' 
                  ? 'text-gray-900'
                  : 'bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent'
            }`}
          >
            ChainMind
          </span>
          {(size === 'lg' || size === 'xl') && (
            <span className="text-xs text-gray-400 font-medium tracking-wide">
              Decentralized AI Compute
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (animated) {
    return (
      <motion.div
        whileHover={{ 
          scale: 1.05,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer"
      >
        {logoElement}
      </motion.div>
    )
  }

  return logoElement
}

// Pre-configured variants for common use cases
export function NavLogo({ className = '' }: { className?: string }) {
  return (
    <Logo 
      size="md" 
      showText={true} 
      animated={true} 
      variant="light"
      className={className}
    />
  )
}

export function HeroLogo({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ 
        duration: 1.2, 
        delay: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
    >
      <Logo 
        size="xl" 
        showText={true} 
        variant="gradient"
        animated={true}
      />
    </motion.div>
  )
}

export function FooterLogo({ className = '' }: { className?: string }) {
  return (
    <Logo 
      size="sm" 
      showText={true} 
      variant="light"
      className={className}
    />
  )
}
