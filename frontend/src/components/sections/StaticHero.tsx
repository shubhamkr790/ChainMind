import React from 'react'
import { Zap, Users, Globe, TrendingUp } from 'lucide-react'
import GPUVisualization from '../3d/GPUVisualization'
import ClientOnly from '../client-only'

export default function StaticHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black pt-16">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <ClientOnly fallback={
          <div className="w-full h-full bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-black gradient-animated" />
        }>
          <GPUVisualization
            interactive={false}
            showStats={false}
            className="w-full h-full"
          />
        </ClientOnly>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20" />
      </div>
      
      {/* Static Content */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div>
          {/* Badge */}
          <div className="inline-flex items-center px-6 py-3 bg-black/60 backdrop-blur-xl border-2 border-yellow-400/30 rounded-full text-sm text-white mb-8 shadow-2xl relative z-20 hover:scale-105 transition-all duration-200" style={{ backdropFilter: 'blur(20px)', boxShadow: '0 0 30px rgba(250, 204, 21, 0.2)' }}>
            <Zap className="w-4 h-4 mr-2 text-yellow-400" />
            <span className="font-semibold text-white drop-shadow-lg">Built on Polygon - Ultra-low gas fees</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Decentralized
            </span>
            <br />
            <span className="text-white">GPU Power</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              for AI Training
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect with <strong className="text-white">1,200+</strong> GPU providers worldwide.
            Train your AI models <strong className="text-purple-400">70% cheaper</strong> 
            with <strong className="text-green-400">instant settlements</strong> on Polygon.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-2xl shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105">
              Start Training Now
            </button>
            <button className="px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105">
              Become a Provider
            </button>
          </div>
          
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Active Providers</p>
                  <p className="text-white text-xl font-bold">1,247</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Jobs Completed</p>
                  <p className="text-white text-xl font-bold">8,523</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Global Network</p>
                  <p className="text-white text-xl font-bold">47 Countries</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Value Processed</p>
                  <p className="text-white text-xl font-bold">$2.4M</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Live Stats */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mx-auto max-w-4xl">
            <h3 className="text-2xl font-bold text-white mb-6">Live Network Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 block">89 jobs</div>
                <p className="text-gray-400 mt-2">Currently Training</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 block">456 GPUs</div>
                <p className="text-gray-400 mt-2">Online Now</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 block">234 TFLOPS</div>
                <p className="text-gray-400 mt-2">Compute Power</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
    </section>
  )
}
