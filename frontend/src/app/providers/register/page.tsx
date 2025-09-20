'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Server, 
  MapPin, 
  DollarSign, 
  Shield, 
  CheckCircle,
  Cpu,
  HardDrive,
  Zap,
  Globe,
  Star,
  Award
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { apiService } from '@/services/api'

export default function RegisterProviderPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: {
      country: '',
      city: '',
      coordinates: { lat: 0, lng: 0 }
    },
    hardware: {
      gpus: [{
        model: '',
        manufacturer: '',
        memory: 8,
        cores: 0,
        clockSpeed: 0,
        powerConsumption: 0,
        isAvailable: true
      }],
      cpu: {
        model: '',
        cores: 8,
        threads: 16,
        clockSpeed: 3.2,
        architecture: 'x86_64'
      },
      ram: {
        total: 32,
        type: 'DDR4',
        speed: 3200
      },
      storage: {
        total: 1000,
        type: 'NVMe' as const,
        readSpeed: 3500,
        writeSpeed: 3000
      },
      network: {
        downloadSpeed: 1000,
        uploadSpeed: 1000,
        latency: 5
      }
    },
    pricing: {
      hourlyRate: 3.50,
      currency: 'USD',
      minimumJobDuration: 30,
      setupFee: 0,
      discounts: []
    }
  })

  const steps = [
    { 
      icon: Server, 
      title: 'Provider Info', 
      description: 'Basic information about you',
      color: 'from-purple-500 to-blue-500'
    },
    { 
      icon: Cpu, 
      title: 'Hardware Specs', 
      description: 'GPU and system specifications',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      icon: MapPin, 
      title: 'Location & Network', 
      description: 'Where your GPUs are located',
      color: 'from-cyan-500 to-green-500'
    },
    { 
      icon: DollarSign, 
      title: 'Pricing Model', 
      description: 'Set your hourly rates',
      color: 'from-green-500 to-yellow-500'
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      toast.success('Provider registration successful!')
      await new Promise(resolve => setTimeout(resolve, 2000))
      router.push('/dashboard/provider')
    } catch (error) {
      toast.error('Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-green-900/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl" />
        
        {/* Enhanced Floating Particles */}
        {Array.from({ length: 20 }).map((_, i) => {
          const seedX = (i * 37) % 100
          const seedY = (i * 73) % 100
          const seedDuration = 5 + (i % 4)
          const seedDelay = (i % 6) * 0.3
          
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-purple-400/20 to-green-400/20 rounded-full"
              style={{
                left: `${seedX}%`,
                top: `${seedY}%`,
              }}
              animate={{
                y: [-30, 30],
                opacity: [0.1, 0.4, 0.1],
                scale: [0.5, 1.2, 0.5]
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

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5 bg-black/30 backdrop-blur-2xl">
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 group"
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 group-hover:text-green-400 transition-colors" />
              <span className="font-medium">Back to Home</span>
            </motion.button>
            
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                Become a GPU Provider
              </h1>
            </motion.div>
            
            <div className="w-32 flex justify-end">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Award className="w-4 h-4 text-yellow-400" />
                <span>Earn $3.5K+/month</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Hero Header */}
          <div className="text-center mb-16">
            <motion.div
              className="inline-flex items-center px-6 py-3 bg-black/40 backdrop-blur-xl border border-green-400/20 rounded-full text-sm text-white mb-8 shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.05, borderColor: "rgba(34, 197, 94, 0.4)" }}
              style={{ boxShadow: '0 0 30px rgba(34, 197, 94, 0.2)' }}
            >
              <Server className="w-4 h-4 mr-2 text-green-400" />
              <span className="font-semibold">Join 1,200+ GPU Providers</span>
            </motion.div>
            
            <motion.h2
              className="text-5xl sm:text-6xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span className="text-white">Share Your</span>
              <br />
              <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                GPU Power
              </span>
            </motion.h2>
            
            <motion.p
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Transform your idle GPUs into a revenue stream. 
              <strong className="text-green-400">Earn $3,500+/month</strong> by providing 
              AI training compute to researchers and companies worldwide.
            </motion.p>

            {/* Quick Stats */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {[
                { icon: Star, label: 'Average Rating', value: '4.9/5', color: 'text-yellow-400' },
                { icon: DollarSign, label: 'Avg. Monthly Earnings', value: '$3,547', color: 'text-green-400' },
                { icon: Globe, label: 'Global Network', value: '47 Countries', color: 'text-blue-400' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-center mb-3">
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Progress Steps */}
          <motion.div
            className="flex justify-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center space-x-6">
              {steps.map((step, index) => (
                <div key={step.title} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-500 ${
                      index <= currentStep 
                        ? `bg-gradient-to-r ${step.color} border-transparent text-white shadow-2xl` 
                        : 'bg-white/5 border-white/20 text-gray-400'
                    }`}>
                      <step.icon className="w-8 h-8" />
                    </div>
                    <div className="mt-3 text-center">
                      <div className={`text-sm font-bold ${
                        index <= currentStep ? 'text-white' : 'text-gray-400'
                      }`}>{step.title}</div>
                      <div className="text-xs text-gray-500 mt-1 max-w-24">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-4 rounded-full transition-all duration-500 ${
                      index < currentStep ? 'bg-gradient-to-r from-green-400 to-cyan-400' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Step 0: Provider Info */}
            {currentStep === 0 && (
              <motion.div
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 mb-8"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center mb-8">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mr-4">
                    <Server className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">Provider Information</h3>
                    <p className="text-gray-400 mt-1">Tell us about your GPU setup</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Provider Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300"
                      placeholder="e.g., TechCorp GPU Farm, AI Researcher Lab"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Description (Optional)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300 h-28 resize-none"
                      placeholder="Describe your setup, experience, and what makes your GPUs special..."
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: Hardware Specs */}
            {currentStep === 1 && (
              <motion.div
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 mb-8"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center mb-8">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mr-4">
                    <Cpu className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">Hardware Specifications</h3>
                    <p className="text-gray-400 mt-1">Tell us about your GPU and system specs</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* GPU Section */}
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                      GPU Configuration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">GPU Model</label>
                        <select
                          value={formData.hardware.gpus[0].model}
                          onChange={(e) => setFormData({
                            ...formData,
                            hardware: {
                              ...formData.hardware,
                              gpus: [{
                                ...formData.hardware.gpus[0],
                                model: e.target.value
                              }]
                            }
                          })}
                          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:bg-white/10 focus:border-blue-400 transition-all duration-300"
                          required
                        >
                          <option value="" className="bg-gray-900">Select GPU Model</option>
                          <option value="RTX 4090" className="bg-gray-900">NVIDIA RTX 4090</option>
                          <option value="RTX 4080" className="bg-gray-900">NVIDIA RTX 4080</option>
                          <option value="RTX 3090" className="bg-gray-900">NVIDIA RTX 3090</option>
                          <option value="A100" className="bg-gray-900">NVIDIA A100</option>
                          <option value="V100" className="bg-gray-900">NVIDIA V100</option>
                          <option value="RTX A6000" className="bg-gray-900">NVIDIA RTX A6000</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">GPU Memory (GB)</label>
                        <input
                          type="number"
                          min="4"
                          max="80"
                          value={formData.hardware.gpus[0].memory}
                          onChange={(e) => setFormData({
                            ...formData,
                            hardware: {
                              ...formData.hardware,
                              gpus: [{
                                ...formData.hardware.gpus[0],
                                memory: parseInt(e.target.value)
                              }]
                            }
                          })}
                          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:bg-white/10 focus:border-blue-400 transition-all duration-300"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* System Specs */}
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <HardDrive className="w-5 h-5 mr-2 text-green-400" />
                      System Specifications
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">CPU Cores</label>
                        <input
                          type="number"
                          min="4"
                          max="128"
                          value={formData.hardware.cpu.cores}
                          onChange={(e) => setFormData({
                            ...formData,
                            hardware: {
                              ...formData.hardware,
                              cpu: {
                                ...formData.hardware.cpu,
                                cores: parseInt(e.target.value)
                              }
                            }
                          })}
                          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:bg-white/10 focus:border-blue-400 transition-all duration-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">RAM (GB)</label>
                        <input
                          type="number"
                          min="8"
                          max="512"
                          value={formData.hardware.ram.total}
                          onChange={(e) => setFormData({
                            ...formData,
                            hardware: {
                              ...formData.hardware,
                              ram: {
                                ...formData.hardware.ram,
                                total: parseInt(e.target.value)
                              }
                            }
                          })}
                          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:bg-white/10 focus:border-blue-400 transition-all duration-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Storage (GB)</label>
                        <input
                          type="number"
                          min="100"
                          max="10000"
                          value={formData.hardware.storage.total}
                          onChange={(e) => setFormData({
                            ...formData,
                            hardware: {
                              ...formData.hardware,
                              storage: {
                                ...formData.hardware.storage,
                                total: parseInt(e.target.value)
                              }
                            }
                          })}
                          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:bg-white/10 focus:border-blue-400 transition-all duration-300"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Location & Network */}
            {currentStep === 2 && (
              <motion.div
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 mb-8"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center mb-8">
                  <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 mr-4">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">Location & Network</h3>
                    <p className="text-gray-400 mt-1">Where your GPUs are located and network specs</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">Country</label>
                      <select
                        value={formData.location.country}
                        onChange={(e) => setFormData({
                          ...formData,
                          location: { ...formData.location, country: e.target.value }
                        })}
                        className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:bg-white/10 focus:border-cyan-400 transition-all duration-300"
                        required
                      >
                        <option value="" className="bg-gray-900">Select Country</option>
                        <option value="US" className="bg-gray-900">United States</option>
                        <option value="CA" className="bg-gray-900">Canada</option>
                        <option value="UK" className="bg-gray-900">United Kingdom</option>
                        <option value="DE" className="bg-gray-900">Germany</option>
                        <option value="JP" className="bg-gray-900">Japan</option>
                        <option value="AU" className="bg-gray-900">Australia</option>
                        <option value="SG" className="bg-gray-900">Singapore</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">City</label>
                      <input
                        type="text"
                        value={formData.location.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          location: { ...formData.location, city: e.target.value }
                        })}
                        className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-cyan-400 transition-all duration-300"
                        placeholder="e.g., New York, London, Tokyo"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-blue-400" />
                      Network Specifications
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Download Speed (Mbps)</label>
                        <input
                          type="number"
                          min="10"
                          max="10000"
                          value={formData.hardware.network.downloadSpeed}
                          onChange={(e) => setFormData({
                            ...formData,
                            hardware: {
                              ...formData.hardware,
                              network: {
                                ...formData.hardware.network,
                                downloadSpeed: parseInt(e.target.value)
                              }
                            }
                          })}
                          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:bg-white/10 focus:border-cyan-400 transition-all duration-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Upload Speed (Mbps)</label>
                        <input
                          type="number"
                          min="10"
                          max="10000"
                          value={formData.hardware.network.uploadSpeed}
                          onChange={(e) => setFormData({
                            ...formData,
                            hardware: {
                              ...formData.hardware,
                              network: {
                                ...formData.hardware.network,
                                uploadSpeed: parseInt(e.target.value)
                              }
                            }
                          })}
                          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:bg-white/10 focus:border-cyan-400 transition-all duration-300"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Pricing Model */}
            {currentStep === 3 && (
              <motion.div
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 mb-8"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center mb-8">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 mr-4">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">Pricing Model</h3>
                    <p className="text-gray-400 mt-1">Set your hourly rates and pricing structure</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Hourly Rate (USD per GPU)
                        <span className="text-xs text-green-400 ml-2">Recommended: $2.50 - $4.00</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number"
                          min="0.50"
                          max="20.00"
                          step="0.10"
                          value={formData.pricing.hourlyRate}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, hourlyRate: parseFloat(e.target.value) }
                          })}
                          className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:bg-white/10 focus:border-green-400 transition-all duration-300"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">Minimum Job Duration (minutes)</label>
                      <input
                        type="number"
                        min="15"
                        max="480"
                        value={formData.pricing.minimumJobDuration}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, minimumJobDuration: parseInt(e.target.value) }
                        })}
                        className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:bg-white/10 focus:border-green-400 transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Setup Fee (USD)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.50"
                        value={formData.pricing.setupFee}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, setupFee: parseFloat(e.target.value) }
                        })}
                        className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:bg-white/10 focus:border-green-400 transition-all duration-300"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">One-time fee for job setup and configuration</p>
                  </div>

                  {/* Earnings Estimate */}
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
                    <div className="flex items-center mb-3">
                      <Star className="w-5 h-5 text-yellow-400 mr-2" />
                      <h4 className="text-lg font-semibold text-white">Estimated Monthly Earnings</h4>
                    </div>
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      ${Math.round(formData.pricing.hourlyRate * 24 * 30 * 0.7).toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-400">
                      Based on 70% utilization rate (16.8 hours/day average)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <motion.button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                  currentStep === 0 
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                    : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
                }`}
                whileHover={currentStep > 0 ? { scale: 1.05 } : {}}
                whileTap={currentStep > 0 ? { scale: 0.95 } : {}}
              >
                Previous Step
              </motion.button>

              {currentStep < steps.length - 1 ? (
                <motion.button
                  type="button"
                  onClick={nextStep}
                  className="px-12 py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-semibold rounded-2xl shadow-2xl shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next Step
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-12 py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-semibold rounded-2xl shadow-2xl shadow-green-500/25 transition-all duration-300 ${
                    isSubmitting 
                      ? 'opacity-70 cursor-not-allowed' 
                      : 'hover:shadow-green-500/40 hover:scale-105'
                  }`}
                  whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Registering...</span>
                    </div>
                  ) : (
                    'Complete Registration'
                  )}
                </motion.button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
