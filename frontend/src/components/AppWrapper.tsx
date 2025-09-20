'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Preloader from './ui/Preloader'

interface AppWrapperProps {
  children: React.ReactNode
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [preloadComplete, setPreloadComplete] = useState(false)

  useEffect(() => {
    // Start loading resources in the background (non-blocking)
    const loadResources = () => {
      // Preload components asynchronously without blocking
      Promise.all([
        import('../components/3d/NetworkTopology').catch(() => null),
        import('../components/3d/GPUVisualization').catch(() => null),
        import('../components/3d/LightweightBackground').catch(() => null),
        import('../components/sections/HeroSection').catch(() => null),
      ]).then(() => {
        // Components preloaded successfully
      }).catch((error) => {
        console.warn('Some components failed to preload:', error)
      })
      
      // Always complete preloading after a reasonable time
      setTimeout(() => {
        setPreloadComplete(true)
      }, 1000)
    }

    loadResources()
  }, [])

  const handlePreloaderComplete = () => {
    setIsLoading(false)
  }

  return (
    <>
      {/* Preloader */}
      {isLoading && (
        <Preloader 
          onComplete={handlePreloaderComplete}
          minLoadTime={2500}
        />
      )}
      
      {/* Main App Content */}
      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div
            key="app-content"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ 
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
