'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { ChevronDown, Zap, Users, Globe, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import ClientOnly from '../client-only'
import LightweightBackground from '../3d/LightweightBackground'
import { apiService } from '@/services/api'

// Animated Counter Component
function AnimatedCounter({ 
  from = 0, 
  to, 
  duration = 2,
  suffix = "",
  prefix = "",
  className = ""
}) {
  const nodeRef = useRef()
  const isInView = useInView(nodeRef, { once: true })
  const count = useTransform(
    useScroll().scrollYProgress,
    [0, 0.5],
    [from, to]
  )

  return (
    <motion.div
      ref={nodeRef}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration, delay: 0.2 }}
    >
      <motion.span>
        {prefix}
        {isInView && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {to.toLocaleString()}
          </motion.span>
        )}
        {suffix}
      </motion.span>
    </motion.div>
  )
}

// Floating GPU Stats Card
function StatsCard({ icon: Icon, label, value, delay = 0, className = "" }) {
  return (
    <motion.div
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 ${className}`}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay }}
      whileHover={{ 
        scale: 1.05,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        transition: { duration: 0.2 }
      }}
    >
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-white text-xl font-bold">{value}</p>
        </div>
      </div>
    </motion.div>
  )
}

// Gradient Text Component
function GradientText({ children, className = "" }) {
  return (
    <span className={`bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  )
}

// Main Hero Section Component
export default function HeroSection() {
  const containerRef = useRef()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0])
  
  // Handle Start Training Now button
  const handleStartTraining = async () => {
    setIsLoading(true)
    try {
      // Check if backend is available
      const response = await fetch('http://localhost:5000/health')
      if (response.ok) {
        // Navigate to job creation page
        router.push('/jobs/create')
        toast.success('Redirecting to job creation...')
      } else {
        throw new Error('Backend not available')
      }
    } catch (error) {
      console.error('Backend connection error:', error)
      toast.error('Backend server is not running. Please start the ChainMind backend server first.')
      
      // Show instructions to user
      toast(
        'To start the backend server:\n1. Open a terminal\n2. Navigate to the backend folder\n3. Run "npm start"',
        {
          duration: 8000,
          style: {
            background: '#1f2937',
            color: '#fff',
            maxWidth: '500px',
          },
        }
      )
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle Become a Provider button
  const handleBecomeProvider = async () => {
    setIsLoading(true)
    try {
      // Check if backend is available
      const response = await fetch('http://localhost:5000/health')
      if (response.ok) {
        // Navigate to provider registration page
        router.push('/providers/register')
        toast.success('Redirecting to provider registration...')
      } else {
        throw new Error('Backend not available')
      }
    } catch (error) {
      console.error('Backend connection error:', error)
      toast.error('Backend server is not running. Please start the ChainMind backend server first.')
      
      // Show instructions to user
      toast(
        'To start the backend server:\n1. Open a terminal\n2. Navigate to the backend folder\n3. Run "npm start"',
        {
          duration: 8000,
          style: {
            background: '#1f2937',
            color: '#fff',
            maxWidth: '500px',
          },
        }
      )
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <motion.section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      style={{ y, opacity }}
    >
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <ClientOnly fallback={
          <div className="w-full h-full bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-black gradient-animated relative">
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 bg-white/40 rounded-full pulse-glow`}
                  style={{
                    left: `${(i * 11 + 10) % 90}%`,
                    top: `${(i * 17 + 20) % 80}%`,
                    animationDelay: `${i * 0.5}s`
                  }}
                />
              ))}
            </div>
          </div>
        }>
          <LightweightBackground className="w-full h-full" />
        </ClientOnly>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20" />
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 z-5">
        {Array.from({ length: 20 }).map((_, i) => {
          // Use seeded random values based on index for consistency
          const seedX = (i * 37) % 100
          const seedY = (i * 73) % 100
          const seedDuration = 3 + (i % 3)
          const seedDelay = (i % 5) * 0.4
          
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${seedX}%`,
                top: `${seedY}%`,
              }}
              animate={{
                y: [-20, 20],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: seedDuration,
                repeat: Infinity,
                delay: seedDelay
              }}
            />
          )
        })}
      </div>
      
      {/* Main Content */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center px-6 py-3 bg-black/60 backdrop-blur-xl border-2 border-yellow-400/30 rounded-full text-sm text-white mb-8 shadow-2xl relative z-20"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(0, 0, 0, 0.8)", borderColor: "rgba(250, 204, 21, 0.5)" }}
            transition={{ duration: 0.2 }}
            style={{ 
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 30px rgba(250, 204, 21, 0.2)'
            }}
          >
            <Zap className="w-4 h-4 mr-2 text-yellow-400" />
            <span className="font-semibold text-white drop-shadow-lg">Built on Polygon - Ultra-low gas fees</span>
          </motion.div>
          
          {/* Main Heading */}
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            <GradientText>Decentralized</GradientText>
            <br />
            <span className="text-white">GPU Power</span>
            <br />
            <GradientText>for AI Training</GradientText>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            Connect with <strong className="text-white">1,200+</strong> GPU providers worldwide.
            Train your AI models <strong className="text-purple-400">70% cheaper</strong> 
            with <strong className="text-green-400">instant settlements</strong> on Polygon.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            <motion.button
              onClick={handleStartTraining}
              disabled={isLoading}
              className={`px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-2xl shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'
              }`}
              whileHover={!isLoading ? { 
                scale: 1.05, 
                boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.4)" 
              } : {}}
              whileTap={!isLoading ? { scale: 0.95 } : {}}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                'Start Training Now'
              )}
            </motion.button>
            
            <motion.button
              onClick={handleBecomeProvider}
              disabled={isLoading}
              className={`px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all duration-300 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'
              }`}
              whileHover={!isLoading ? { scale: 1.05 } : {}}
              whileTap={!isLoading ? { scale: 0.95 } : {}}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                'Become a Provider'
              )}
            </motion.button>
          </motion.div>
          
          {/* Statistics Grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.4 }}
          >
            <StatsCard
              icon={Users}
              label="Active Providers"
              value="1,247"
              delay={0.1}
            />
            <StatsCard
              icon={Zap}
              label="Jobs Completed"
              value="8,523"
              delay={0.2}
            />
            <StatsCard
              icon={Globe}
              label="Global Network"
              value="47 Countries"
              delay={0.3}
            />
            <StatsCard
              icon={TrendingUp}
              label="Value Processed"
              value="$2.4M"
              delay={0.4}
            />
          </motion.div>
          
          {/* Live Stats */}
          <motion.div
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mx-auto max-w-4xl"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 1.6 }}
            whileHover={{ 
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              scale: 1.02
            }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Live Network Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <AnimatedCounter
                  to={89}
                  suffix=" jobs"
                  className="text-3xl font-bold text-purple-400 block"
                />
                <p className="text-gray-400 mt-2">Currently Training</p>
              </div>
              <div className="text-center">
                <AnimatedCounter
                  to={456}
                  suffix=" GPUs"
                  className="text-3xl font-bold text-green-400 block"
                />
                <p className="text-gray-400 mt-2">Online Now</p>
              </div>
              <div className="text-center">
                <AnimatedCounter
                  to={234}
                  suffix=" TFLOPS"
                  className="text-3xl font-bold text-blue-400 block"
                />
                <p className="text-gray-400 mt-2">Compute Power</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center"
        >
          <p className="text-gray-400 text-sm mb-2">Scroll to explore</p>
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </motion.div>
      </motion.div>
      
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl" />
    </motion.section>
  )
}

export { GradientText, StatsCard, AnimatedCounter }
