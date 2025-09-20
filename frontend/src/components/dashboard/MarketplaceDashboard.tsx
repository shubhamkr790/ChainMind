'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tab } from '@headlessui/react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CpuChipIcon,
  BoltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  DocumentArrowDownIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/useAuth'
import { apiService } from '@/services/api'
import { TrainingJob, GPUProvider, Transaction } from '@/types/marketplace'
import GPUProviderGrid from '@/components/marketplace/GPUProviderGrid'
import JobSubmissionForm from '@/components/forms/JobSubmissionForm'
import { useSocket, useSocketConnection, useNotifications } from '@/hooks/useSocket'
import { toast } from 'react-hot-toast'

interface DashboardStats {
  totalJobs: number
  activeJobs: number
  completedJobs: number
  totalSpent: number
  averageCost: number
  successRate: number
  timeThisMonth: number
  costsThisMonth: number
}

interface MarketplaceDashboardProps {
  initialTab?: number
}

export default function MarketplaceDashboard({ initialTab = 0 }: MarketplaceDashboardProps) {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState(initialTab)
  const [isLoading, setIsLoading] = useState(true)
  const [showJobForm, setShowJobForm] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<GPUProvider | null>(null)
  
  // Data states
  const [jobs, setJobs] = useState<TrainingJob[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalSpent: 0,
    averageCost: 0,
    successRate: 0,
    timeThisMonth: 0,
    costsThisMonth: 0
  })

  // Load dashboard data
  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const [jobsResponse, transactionsResponse, statsResponse] = await Promise.all([
        apiService.getUserJobs(),
        apiService.getUserTransactions(),
        apiService.getUserStats()
      ])

      if (jobsResponse.success) setJobs(jobsResponse.data || [])
      if (transactionsResponse.success) setTransactions(transactionsResponse.data || [])
      if (statsResponse.success) setStats(statsResponse.data || stats)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJobSubmit = async (jobData: Partial<TrainingJob>) => {
    try {
      const response = await apiService.createJob(jobData)
      if (response.success) {
        setJobs(prev => [response.data!, ...prev])
        setShowJobForm(false)
        setSelectedProvider(null)
        toast.success('Job created successfully!')
        await loadDashboardData() // Refresh stats
      } else {
        throw new Error(response.error?.message || 'Failed to create job')
      }
    } catch (error: any) {
      console.error('Job creation failed:', error)
      toast.error(error.message || 'Failed to create job')
    }
  }

  const handleJobAction = async (jobId: string, action: 'cancel' | 'pause' | 'resume' | 'stop') => {
    try {
      const response = await apiService.updateJobStatus(jobId, action)
      if (response.success) {
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: response.data!.status } : job
        ))
        toast.success(`Job ${action}ed successfully!`)
      } else {
        throw new Error(response.error?.message || `Failed to ${action} job`)
      }
    } catch (error: any) {
      console.error(`Job ${action} failed:`, error)
      toast.error(error.message || `Failed to ${action} job`)
    }
  }

  const getJobStatusColor = (status: TrainingJob['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10'
      case 'running': return 'text-green-400 bg-green-400/10'
      case 'completed': return 'text-blue-400 bg-blue-400/10'
      case 'failed': return 'text-red-400 bg-red-400/10'
      case 'cancelled': return 'text-gray-400 bg-gray-400/10'
      case 'paused': return 'text-orange-400 bg-orange-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getJobStatusIcon = (status: TrainingJob['status']) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />
      case 'running': return <PlayIcon className="w-4 h-4" />
      case 'completed': return <CheckCircleIcon className="w-4 h-4" />
      case 'failed': return <XCircleIcon className="w-4 h-4" />
      case 'cancelled': return <StopIcon className="w-4 h-4" />
      case 'paused': return <PauseIcon className="w-4 h-4" />
      default: return <ClockIcon className="w-4 h-4" />
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const tabs = [
    { name: 'Overview', icon: ChartBarIcon },
    { name: 'My Jobs', icon: CpuChipIcon },
    { name: 'Browse Providers', icon: MagnifyingGlassIcon },
    { name: 'Transactions', icon: CurrencyDollarIcon }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.name || 'User'}
            </h1>
            <p className="text-gray-400">
              Manage your training jobs and explore GPU providers
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowJobForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-purple-500 text-white rounded-lg hover:from-brand-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-5 h-5" />
              New Job
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-brand-500/20 to-brand-600/20 rounded-xl p-6 border border-brand-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <CpuChipIcon className="w-8 h-8 text-brand-400" />
              <span className="text-xs text-brand-400 font-medium">TOTAL JOBS</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.totalJobs}</div>
            <div className="text-sm text-gray-400">
              {stats.activeJobs} active
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-6 border border-green-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <CurrencyDollarIcon className="w-8 h-8 text-green-400" />
              <span className="text-xs text-green-400 font-medium">TOTAL SPENT</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatCurrency(stats.totalSpent)}
            </div>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              {stats.costsThisMonth > 0 && (
                <>
                  <ArrowTrendingUpIcon className="w-3 h-3 text-green-400" />
                  {formatCurrency(stats.costsThisMonth)} this month
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircleIcon className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">SUCCESS RATE</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats.successRate}%
            </div>
            <div className="text-sm text-gray-400">
              {stats.completedJobs} completed
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <ClockIcon className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-blue-400 font-medium">AVG COST</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatCurrency(stats.averageCost)}
            </div>
            <div className="text-sm text-gray-400">per hour</div>
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-800/50 p-1 mb-8">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `w-full rounded-lg py-3 px-4 text-sm font-medium leading-5 transition-all ${
                    selected
                      ? 'bg-brand-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`
                }
              >
                <div className="flex items-center justify-center gap-2">
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </div>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {/* Overview Tab */}
            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Recent Jobs */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Recent Jobs</h2>
                    <button
                      onClick={() => setSelectedTab(1)}
                      className="text-brand-400 hover:text-brand-300 text-sm font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {jobs.slice(0, 5).map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getJobStatusColor(job.status)}`}>
                            {getJobStatusIcon(job.status)}
                            {job.status}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{job.name}</h3>
                            <p className="text-sm text-gray-400">
                              {job.framework} • {job.requireGPUCount} GPU • Created {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">
                            {formatCurrency(job.actualCost || job.estimatedCost)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {job.actualDuration ? formatDuration(job.actualDuration) : `~${job.estimatedDuration}h`}
                          </div>
                        </div>
                      </div>
                    ))}
                    {jobs.length === 0 && (
                      <div className="text-center py-8">
                        <CpuChipIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">No training jobs yet</p>
                        <button
                          onClick={() => setShowJobForm(true)}
                          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                        >
                          Create Your First Job
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowJobForm(true)}
                    className="p-6 bg-gradient-to-br from-brand-500/20 to-brand-600/20 rounded-xl border border-brand-500/30 text-left group hover:from-brand-500/30 hover:to-brand-600/30 transition-all"
                  >
                    <PlusIcon className="w-8 h-8 text-brand-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-white mb-2">New Training Job</h3>
                    <p className="text-gray-400 text-sm">Start a new ML training job with custom configurations</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTab(2)}
                    className="p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-500/30 text-left group hover:from-purple-500/30 hover:to-purple-600/30 transition-all"
                  >
                    <MagnifyingGlassIcon className="w-8 h-8 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-white mb-2">Browse Providers</h3>
                    <p className="text-gray-400 text-sm">Explore available GPU providers and their specifications</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTab(3)}
                    className="p-6 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-500/30 text-left group hover:from-green-500/30 hover:to-green-600/30 transition-all"
                  >
                    <CurrencyDollarIcon className="w-8 h-8 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-white mb-2">View Transactions</h3>
                    <p className="text-gray-400 text-sm">Check your payment history and transaction details</p>
                  </motion.button>
                </div>
              </motion.div>
            </Tab.Panel>

            {/* My Jobs Tab */}
            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">My Training Jobs</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowJobForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      New Job
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {jobs.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getJobStatusColor(job.status)}`}>
                              {getJobStatusIcon(job.status)}
                              {job.status}
                            </div>
                            <h3 className="text-lg font-semibold text-white">{job.name}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {job.status === 'running' && (
                              <>
                                <button
                                  onClick={() => handleJobAction(job.id!, 'pause')}
                                  className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors"
                                  title="Pause Job"
                                >
                                  <PauseIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleJobAction(job.id!, 'stop')}
                                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                  title="Stop Job"
                                >
                                  <StopIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {job.status === 'paused' && (
                              <button
                                onClick={() => handleJobAction(job.id!, 'resume')}
                                className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                                title="Resume Job"
                              >
                                <PlayIcon className="w-4 h-4" />
                              </button>
                            )}
                            {job.status === 'pending' && (
                              <button
                                onClick={() => handleJobAction(job.id!, 'cancel')}
                                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                title="Cancel Job"
                              >
                                <XCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Framework</div>
                            <div className="text-white font-medium capitalize">{job.framework}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Resources</div>
                            <div className="text-white font-medium">{job.requireGPUCount} × {job.requireGPUMemory}GB GPU</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Duration</div>
                            <div className="text-white font-medium">
                              {job.actualDuration ? formatDuration(job.actualDuration) : `~${job.estimatedDuration}h`}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Cost</div>
                            <div className="text-white font-medium">
                              {formatCurrency(job.actualCost || job.estimatedCost)}
                            </div>
                          </div>
                        </div>

                        {job.description && (
                          <p className="text-gray-400 text-sm mb-4">{job.description}</p>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div>
                            Created: {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                          {job.providerName && (
                            <div>
                              Provider: <span className="text-brand-400">{job.providerName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress bar for running jobs */}
                      {job.status === 'running' && job.progress !== undefined && (
                        <div className="px-6 pb-4">
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                            <span>Progress</span>
                            <span>{job.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-brand-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {jobs.length === 0 && (
                  <div className="text-center py-12">
                    <CpuChipIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No training jobs yet</h3>
                    <p className="text-gray-400 mb-6">Create your first training job to get started with ChainMind</p>
                    <button
                      onClick={() => setShowJobForm(true)}
                      className="px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                    >
                      Create First Job
                    </button>
                  </div>
                )}
              </motion.div>
            </Tab.Panel>

            {/* Browse Providers Tab */}
            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GPUProviderGrid
                  onProviderSelect={(provider) => {
                    setSelectedProvider(provider)
                    setShowJobForm(true)
                  }}
                  showFilters={true}
                />
              </motion.div>
            </Tab.Panel>

            {/* Transactions Tab */}
            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Transaction History</h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export
                  </button>
                </div>

                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="bg-gray-800/50 rounded-lg border border-gray-700 p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            transaction.type === 'payment' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            <CurrencyDollarIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{transaction.description}</h3>
                            <p className="text-sm text-gray-400">
                              {new Date(transaction.createdAt).toLocaleDateString()} • {transaction.status}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            transaction.type === 'payment' ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {transaction.type === 'payment' ? '-' : '+'}{formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-sm text-gray-400">{transaction.method}</div>
                        </div>
                      </div>
                      
                      {transaction.jobId && (
                        <div className="text-sm text-gray-400">
                          Job ID: <span className="text-brand-400 font-mono">{transaction.jobId}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {transactions.length === 0 && (
                  <div className="text-center py-12">
                    <CurrencyDollarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No transactions yet</h3>
                    <p className="text-gray-400">Your transaction history will appear here</p>
                  </div>
                )}
              </motion.div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Job Submission Modal */}
      <AnimatePresence>
        {showJobForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowJobForm(false)
              setSelectedProvider(null)
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-900 rounded-xl border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <JobSubmissionForm
                selectedProvider={selectedProvider || undefined}
                onSubmit={handleJobSubmit}
                onCancel={() => {
                  setShowJobForm(false)
                  setSelectedProvider(null)
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
