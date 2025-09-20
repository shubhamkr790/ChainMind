'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Server, Cpu, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProviderDashboardPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300"
              whileHover={{ x: -5 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </motion.button>
            
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Provider Dashboard
            </h1>
            
            <div className="w-20"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Server className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Provider Dashboard</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Manage your GPU resources, view earnings, and monitor active training jobs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Cpu className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">GPU Resources</h3>
              <p className="text-gray-400 text-sm">Configure and monitor your GPU hardware</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Active Jobs</h3>
              <p className="text-gray-400 text-sm">View and manage your running training jobs</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Server className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Earnings</h3>
              <p className="text-gray-400 text-sm">Track your revenue and payment history</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl"
          >
            <p className="text-yellow-400 font-medium">
              🚧 Provider Dashboard is under construction
            </p>
            <p className="text-gray-400 text-sm mt-2">
              This page is being developed. Check back soon for full provider functionality!
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
