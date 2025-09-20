'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, Zap, DollarSign, Clock, Cpu, Database, Code, Settings, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { apiService } from '@/services/api'

export default function CreateJobPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobType: 'training',
    framework: 'pytorch',
    requirements: {
      gpuType: '',
      gpuMemory: 8,
      gpuCount: 1,
      estimatedDuration: 24,
      maxDuration: 48
    },
    dataset: {
      name: '',
      size: 0,
      format: 'CSV',
      location: ''
    },
    pricing: {
      budget: 100,
      maxHourlyRate: 5,
      currency: 'USD'
    },
    environment: {
      trainingScript: '',
      dependencies: [],
      dockerImage: 'pytorch/pytorch:latest',
      environmentVariables: {}
    }
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps = [
    { icon: Zap, label: 'Details', description: 'Job information' },
    { icon: Cpu, label: 'Hardware', description: 'GPU requirements' },
    { icon: DollarSign, label: 'Pricing', description: 'Budget settings' },
    { icon: CheckCircle, label: 'Deploy', description: 'Review & submit' }
  ]

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Actually submit to the backend API
      const jobData = {
        ...formData,
        pricing: {
          ...formData.pricing,
          paymentType: 'fixed',
          escrowAmount: formData.pricing.budget,
          deposit: formData.pricing.budget * 0.1
        },
        dataset: {
          ...formData.dataset,
          storageType: 'upload'
        },
        environment: {
          ...formData.environment,
          pythonVersion: '3.9',
          dependencies: ['torch', 'torchvision']
        },
        requirements: {
          ...formData.requirements,
          cpuCores: 8,
          ramGB: 32,
          storageGB: 500
        },
        modelConfig: {
          architecture: 'CNN',
          outputFormat: 'pytorch',
          hyperparameters: new Map(),
          metrics: ['accuracy', 'loss'],
          checkpointFrequency: 30
        }
      }
      
      const response = await apiService.createJob(jobData)
      
      if (response.success) {
        toast.success('Training job created successfully!')
        router.push('/')  // Redirect to home page instead
      } else {
        throw new Error(response.error?.message || 'Failed to create job')
      }
    } catch (error) {
      toast.error('Failed to create job. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-blue-900/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        {/* Floating particles */}
        {Array.from({ length: 15 }).map((_, i) => {
          const seedX = (i * 37) % 100
          const seedY = (i * 73) % 100
          const seedDuration = 4 + (i % 3)
          const seedDelay = (i % 5) * 0.4
          
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/10 rounded-full"
              style={{
                left: `${seedX}%`,
                top: `${seedY}%`,
              }}
              animate={{
                y: [-20, 20],
                opacity: [0.1, 0.3, 0.1],
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

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5 bg-black/30 backdrop-blur-2xl">
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 group"
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 group-hover:text-purple-400 transition-colors" />
              <span className="font-medium">Back to Home</span>
            </motion.button>
            
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Create Training Job
              </h1>
            </motion.div>
            
            <div className="w-32 flex justify-end">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Backend Connected</span>
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
              className="inline-flex items-center px-6 py-3 bg-black/40 backdrop-blur-xl border border-purple-400/20 rounded-full text-sm text-white mb-8 shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.05, borderColor: "rgba(168, 85, 247, 0.4)" }}
              style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.2)' }}
            >
              <Zap className="w-4 h-4 mr-2 text-purple-400" />
              <span className="font-semibold">AI Training Made Simple</span>
            </motion.div>
            
            <motion.h2
              className="text-5xl sm:text-6xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Configure
              </span>
              <br />
              <span className="text-white">Your Training Job</span>
            </motion.h2>
            
            <motion.p
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Set up your AI training requirements and get matched with the perfect GPU provider. 
              <strong className="text-purple-400">Deploy in seconds</strong>, 
              <strong className="text-green-400">pay as you go</strong>.
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Progress Indicator */}
            <motion.div
              className="flex justify-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center space-x-4">
                {steps.map((step, index) => (
                  <div key={step.label} className="flex items-center">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 ${
                      index <= currentStep 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 border-purple-400 text-white shadow-lg shadow-purple-500/30' 
                        : 'bg-white/5 border-white/20 text-gray-400'
                    }`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <span className={`ml-3 text-sm font-medium ${
                      index <= currentStep ? 'text-white' : 'text-gray-400'
                    }`}>{step.label}</span>
                    {index < 3 && (
                      <div className="w-8 h-px bg-white/20 mx-4" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Step 0: Job Details */}
            {currentStep === 0 && (
            <motion.div
              className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 hover:bg-white/10 hover:border-white/20 transition-all duration-500"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mr-4">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white group-hover:text-purple-300 transition-colors">
                    Job Configuration
                  </h3>
                  <p className="text-gray-400 mt-1">Define your training job parameters</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Job Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300"
                    placeholder="e.g., Image Classification Model Training"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">AI Framework</label>
                  <select
                    value={formData.framework}
                    onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:bg-white/10 focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300 cursor-pointer"
                  >
                    <option value="pytorch" className="bg-gray-900 text-white">🔥 PyTorch</option>
                    <option value="tensorflow" className="bg-gray-900 text-white">🧠 TensorFlow</option>
                    <option value="huggingface" className="bg-gray-900 text-white">🤗 Hugging Face</option>
                    <option value="custom" className="bg-gray-900 text-white">⚙️ Custom</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-8 space-y-2">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Project Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300 h-28 resize-none"
                  placeholder="Describe your AI training project, dataset requirements, and expected outcomes. Be specific about your model architecture and training objectives..."
                  required
                />
              </div>
            </motion.div>
            )}

            {/* Step 1: GPU Requirements */}
            {currentStep === 1 && (
            <motion.div
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Cpu className="w-6 h-6 mr-3 text-blue-400" />
                GPU Requirements
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">GPU Type</label>
                  <select
                    value={formData.requirements.gpuType}
                    onChange={(e) => setFormData({
                      ...formData,
                      requirements: { ...formData.requirements, gpuType: e.target.value }
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-400 transition-colors"
                    required
                  >
                    <option value="">Select GPU</option>
                    <option value="RTX 4090">RTX 4090</option>
                    <option value="RTX 3090">RTX 3090</option>
                    <option value="A100">A100</option>
                    <option value="V100">V100</option>
                    <option value="RTX A6000">RTX A6000</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">GPU Count</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={formData.requirements.gpuCount}
                    onChange={(e) => setFormData({
                      ...formData,
                      requirements: { ...formData.requirements, gpuCount: parseInt(e.target.value) }
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">GPU Memory (GB)</label>
                  <input
                    type="number"
                    min="4"
                    max="80"
                    value={formData.requirements.gpuMemory}
                    onChange={(e) => setFormData({
                      ...formData,
                      requirements: { ...formData.requirements, gpuMemory: parseInt(e.target.value) }
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
              </div>
            </motion.div>
            )}

            {/* Step 2: Pricing */}
            {currentStep === 2 && (
            <motion.div
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <DollarSign className="w-6 h-6 mr-3 text-green-400" />
                Budget & Pricing
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Total Budget (USD)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.pricing.budget}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, budget: parseFloat(e.target.value) }
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Max Hourly Rate (USD)</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.pricing.maxHourlyRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, maxHourlyRate: parseFloat(e.target.value) }
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
              </div>
            </motion.div>
            )}

            {/* Step 3: Deploy - Review & Submit */}
            {currentStep === 3 && (
            <motion.div
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <CheckCircle className="w-6 h-6 mr-3 text-green-400" />
                Review & Deploy
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="font-semibold text-white mb-2">Job Details</h4>
                  <p className="text-gray-300">Title: {formData.title}</p>
                  <p className="text-gray-300">Framework: {formData.framework}</p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="font-semibold text-white mb-2">Hardware Requirements</h4>
                  <p className="text-gray-300">GPU: {formData.requirements.gpuType} x{formData.requirements.gpuCount}</p>
                  <p className="text-gray-300">Memory: {formData.requirements.gpuMemory}GB</p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="font-semibold text-white mb-2">Pricing</h4>
                  <p className="text-gray-300">Budget: ${formData.pricing.budget}</p>
                  <p className="text-gray-300">Max Hourly Rate: ${formData.pricing.maxHourlyRate}</p>
                </div>
              </div>
            </motion.div>
            )}

            {/* Navigation Buttons */}
            <motion.div
              className="flex justify-between items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  currentStep === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Previous
              </button>
              
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 ${
                    isSubmitting
                      ? 'opacity-70 cursor-not-allowed'
                      : 'shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating Job...</span>
                    </div>
                  ) : (
                    'Deploy Training Job'
                  )}
                </button>
              )}
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
