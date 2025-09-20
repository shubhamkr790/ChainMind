'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import ClientOnly from '@/components/client-only'
import AppWrapper from '@/components/AppWrapper'
import { Zap, Shield, Globe, TrendingUp, Users, Database } from 'lucide-react'

// Import components directly (they'll be preloaded by AppWrapper)
import HeroSection from '@/components/sections/HeroSection'
import NetworkTopology from '@/components/3d/NetworkTopology'
import NetworkStatus from '@/components/NetworkStatus'
import CustomConnectButton from '@/components/CustomConnectButton'
// Feature Section Component
function FeatureSection() {
  const features = [
    {
      icon: '⚡',
      title: "Instant Deploy",
      description: "Sub-3 second GPU matching with neural allocation algorithms.",
      metric: "<3s",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: '🛡️',
      title: "Enterprise Security",
      description: "Zero-trust architecture with on-chain reputation scoring.",
      metric: "99.9%",
      color: "from-emerald-400 to-cyan-500"
    },
    {
      icon: '🌐',
      title: "Global Network",
      description: "1200+ verified providers across 47 countries worldwide.",
      metric: "47+",
      color: "from-blue-400 to-purple-500"
    },
    {
      icon: '💰',
      title: "DeFi Economics",
      description: "70% cost savings with instant crypto settlements.",
      metric: "70%",
      color: "from-purple-400 to-pink-500"
    }
  ]

  return (
    <section className="relative py-24 bg-gray-900">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-blue-900/5" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Why Choose{' '}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              ChainMind
            </span>?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Neural-powered GPU marketplace with DeFi economics
          </p>
        </motion.div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              {/* Icon & Metric */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <span className="text-xl">{feature.icon}</span>
                </div>
                <div className={`text-2xl font-bold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                  {feature.metric}
                </div>
              </div>
              
              {/* Content */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
              
              {/* Hover Glow */}
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl blur opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Network Showcase Section
function NetworkShowcase() {
  return (
    <section className="relative py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Decentralized</span> Network
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore our global GPU network in real-time 3D visualization
          </p>
        </motion.div>
        
        <motion.div
          className="h-[600px] rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-gray-900/50 to-black/50"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <NetworkTopology />
        </motion.div>
      </div>
    </section>
  )
}

function HomePage() {
  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/30 backdrop-blur-2xl border-b border-white/5">
        {/* Background gradient line */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center space-x-3"
            >
              <div className="relative group">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/40 transition-all duration-300">
                  <span className="text-white font-bold text-base">CM</span>
                </div>
              </div>
              
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent text-xl font-bold tracking-tight">
                ChainMind
              </span>
            </motion.div>
            
            {/* Connect Button Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ClientOnly fallback={<div className="w-32 h-10 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl animate-pulse border border-white/10"></div>}>
                <CustomConnectButton />
              </ClientOnly>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen">
        {/* 3D Hero Section */}
        <HeroSection />
        
        {/* Features Section */}
        <FeatureSection />
        
        {/* Network Visualization Section */}
        <NetworkShowcase />
        
        {/* Network Status Dashboard */}
        <section className="relative bg-black">
          <NetworkStatus />
        </section>

      </main>
      
      {/* Footer */}
      <footer className="relative bg-black border-t border-white/5">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/5 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Main Footer Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            {/* Logo and Brand */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">CM</span>
              </div>
              <h3 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">ChainMind</span>
              </h3>
            </div>
            
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
              Democratizing AI with decentralized GPU power on Polygon Network
            </p>
            
            {/* Social Links */}
            <div className="flex items-center justify-center space-x-8 mb-8">
              {[
                { name: 'Twitter', href: '#', icon: '𝕏' },
                { name: 'Discord', href: '#', icon: '💬' },
                { name: 'GitHub', href: '#', icon: '⚡' },
                { name: 'Docs', href: '#', icon: '📖' }
              ].map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  className="group flex flex-col items-center space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -3 }}
                >
                  <div className="w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/10 group-hover:border-purple-400/50 transition-all duration-300">
                    <span className="text-xl">{social.icon}</span>
                  </div>
                  <span className="text-gray-400 text-sm group-hover:text-white transition-colors duration-300">
                    {social.name}
                  </span>
                </motion.a>
              ))}
            </div>
            
            {/* Newsletter Signup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="max-w-md mx-auto mb-8"
            >
              <p className="text-gray-400 text-sm mb-4">Stay updated with network developments</p>
              <div className="flex space-x-3">
                <input 
                  type="email" 
                  placeholder="your@email.com"
                  className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors"
                />
                <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 font-medium">
                  Subscribe
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="border-t border-white/5 pt-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>© 2024 ChainMind</span>
                <span className="hidden md:block text-gray-700">•</span>
                <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
                <span className="hidden md:block text-gray-700">•</span>
                <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Network Online</span>
                </div>
                <div className="h-4 w-px bg-white/10"></div>
                <div className="text-sm text-gray-500">
                  <span className="text-purple-400 font-medium">11</span> Nodes Active
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <AppWrapper>
      <HomePage />
    </AppWrapper>
  )
}
