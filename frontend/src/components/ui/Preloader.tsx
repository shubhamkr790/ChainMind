'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap } from 'lucide-react'

interface PreloaderProps {
  onComplete: () => void
  minLoadTime?: number
}

export default function Preloader({ onComplete, minLoadTime = 2000 }: PreloaderProps) {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [loadingText, setLoadingText] = useState('Initializing ChainMind...')

  const loadingSteps = [
    { progress: 0, text: 'Initializing ChainMind...' },
    { progress: 20, text: 'Connecting to Polygon Network...' },
    { progress: 40, text: 'Loading GPU Network...' },
    { progress: 60, text: 'Initializing 3D Visualizations...' },
    { progress: 80, text: 'Preparing AI Compute Interface...' },
    { progress: 100, text: 'Ready to Launch!' }
  ]

  useEffect(() => {
    const startTime = Date.now()
    let currentStepIndex = 0

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const targetProgress = Math.min((elapsed / minLoadTime) * 100, 100)
      
      // Update progress smoothly
      setProgress(prev => {
        const newProgress = Math.min(prev + 1.5, targetProgress)
        
        // Update loading text based on progress thresholds
        if (newProgress >= 20 && currentStepIndex < 1) {
          currentStepIndex = 1
          setLoadingText(loadingSteps[1].text)
        } else if (newProgress >= 40 && currentStepIndex < 2) {
          currentStepIndex = 2
          setLoadingText(loadingSteps[2].text)
        } else if (newProgress >= 60 && currentStepIndex < 3) {
          currentStepIndex = 3
          setLoadingText(loadingSteps[3].text)
        } else if (newProgress >= 80 && currentStepIndex < 4) {
          currentStepIndex = 4
          setLoadingText(loadingSteps[4].text)
        }
        
        return newProgress
      })
      
      // Complete when we've reached 100% and minimum time has passed
      if (elapsed >= minLoadTime && targetProgress >= 100) {
        clearInterval(progressInterval)
        setProgress(100)
        setIsComplete(true)
        setTimeout(() => {
          onComplete()
        }, 500)
      }
    }, 50)

    return () => clearInterval(progressInterval)
  }, [minLoadTime, onComplete])

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-black gradient-animated" />
            
            {/* Floating Particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
                style={{
                  left: `${(i * 13 + 10) % 90}%`,
                  top: `${(i * 17 + 15) % 85}%`,
                }}
                animate={{
                  y: [-10, 10],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 3 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>

          {/* Main Content */}
          <div className="relative z-10 text-center max-w-md mx-auto px-6">
            {/* Logo */}
            <motion.div
              className="mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center justify-center space-x-3 mb-4">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-2xl"
                  animate={{ 
                    rotateY: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotateY: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <Zap className="w-7 h-7 text-white" />
                </motion.div>
              </div>
              
              <motion.h1 
                className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                ChainMind
              </motion.h1>
              
              <motion.p 
                className="text-gray-400 mt-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                Decentralized GPU Power for AI
              </motion.p>
            </motion.div>

            {/* Loading Progress */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              {/* Progress Bar */}
              <div className="relative w-full h-2 bg-gray-800 rounded-full mb-4 overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                  style={{ width: `${progress}%` }}
                  initial={{ width: '0%' }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
                
                {/* Glow effect */}
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-50 blur-sm"
                  style={{ width: `${progress}%` }}
                  initial={{ width: '0%' }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>

              {/* Progress Percentage */}
              <div className="flex justify-between items-center text-sm">
                <motion.span 
                  className="text-gray-300"
                  key={loadingText}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {loadingText}
                </motion.span>
                <span className="text-purple-400 font-mono">
                  {Math.round(progress)}%
                </span>
              </div>
            </motion.div>

            {/* Loading Dots Animation */}
            <motion.div
              className="flex justify-center space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-purple-500 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>

            {/* Powered by Polygon */}
            <motion.div
              className="mt-8 text-xs text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              Powered by Polygon Network
            </motion.div>
          </div>

          {/* Corner Glow Effects */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
