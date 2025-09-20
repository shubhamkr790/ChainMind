'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tab } from '@headlessui/react'
import {
  CpuChipIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  BoltIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  Cog6ToothIcon,
  TrophyIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  StarIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import {
  StarIcon as StarSolidIcon
} from '@heroicons/react/24/solid'
import { useAuth } from '@/hooks/useAuth'
import { apiService } from '@/services/api'
import { useSocket, useSocketConnection, useProviderSocket } from '@/hooks/useSocket'
import { GPUProvider, TrainingJob, Transaction } from '@/types/marketplace'
import { toast } from 'react-hot-toast'

interface ProviderStats {
  totalEarnings: number
  activeJobs: number
  completedJobs: number
  averageRating: number
  totalRatings: number
  uptime: number
  utilizationRate: number
  earningsThisMonth: number
  jobsThisMonth: number
  reputationLevel: number
  stakeAmount: number
}

interface ProviderDashboardProps {
  initialTab?: number
}

export default function ProviderDashboard({ initialTab = 0 }: ProviderDashboardProps) {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState(initialTab)
  const [isLoading, setIsLoading] = useState(true)
  const [providerData, setProviderData] = useState<GPUProvider | null>(null)
  
  // Data states
  const [activeJobs, setActiveJobs] = useState<TrainingJob[]>([])
  const [jobQueue, setJobQueue] = useState<TrainingJob[]>([])
  const [earnings, setEarnings] = useState<Transaction[]>([])
  const [stats, setStats] = useState<ProviderStats>({
    totalEarnings: 0,
    activeJobs: 0,
    completedJobs: 0,
    averageRating: 0,
    totalRatings: 0,
    uptime: 0,
    utilizationRate: 0,
    earningsThisMonth: 0,
    jobsThisMonth: 0,
    reputationLevel: 1,
    stakeAmount: 0
  })

  // Socket.io hooks
  const { status: socketStatus } = useSocketConnection()
  const { status: providerStatus } = useProviderSocket(providerData?.id || null)

  // Load provider dashboard data
  useEffect(() => {
    if (user) {
      loadProviderData()
    }
  }, [user])

  // Socket.io event handlers
  useSocket('job:assigned', (job: TrainingJob) => {
    if (job.selectedProviderId === providerData?.id) {
      setJobQueue(prev => [...prev, job])
      toast.success(`New job assigned: "${job.name}"`)
    }
  })

  useSocket('job:status_changed', (jobId: string, status: TrainingJob['status']) => {
    setActiveJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status } : job
    ))
    setJobQueue(prev => prev.map(job => 
      job.id === jobId ? { ...job, status } : job
    ))
  })

  useSocket('earnings:updated', (transaction: Transaction) => {
    if (transaction.providerId === providerData?.id) {
      setEarnings(prev => [transaction, ...prev])
      toast.success(`Payment received: ${formatCurrency(transaction.amount)}`)
      loadProviderData() // Refresh stats
    }
  })

  const loadProviderData = async () => {
    try {
      setIsLoading(true)
      const [providerResponse, jobsResponse, earningsResponse, statsResponse] = await Promise.all([
        apiService.getProviderProfile(),
        apiService.getProviderJobs(),
        apiService.getProviderEarnings(),
        apiService.getProviderStats()
      ])

      if (providerResponse.success) setProviderData(providerResponse.data!)
      if (jobsResponse.success) {
        const jobs = jobsResponse.data || []
        setActiveJobs(jobs.filter((j: TrainingJob) => ['running', 'paused'].includes(j.status)))
        setJobQueue(jobs.filter((j: TrainingJob) => ['pending', 'queued'].includes(j.status)))
      }
      if (earningsResponse.success) setEarnings(earningsResponse.data || [])
      if (statsResponse.success) setStats(statsResponse.data || stats)
    } catch (error) {
      console.error('Failed to load provider data:', error)
      toast.error('Failed to load provider data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJobAction = async (jobId: string, action: 'accept' | 'reject' | 'start' | 'pause' | 'complete') => {
    try {
      const response = await apiService.updateProviderJobStatus(jobId, action)
      if (response.success) {
        toast.success(`Job ${action}ed successfully!`)
        await loadProviderData() // Refresh data
      } else {
        throw new Error(response.error?.message || `Failed to ${action} job`)
      }
    } catch (error: any) {
      console.error(`Job ${action} failed:`, error)
      toast.error(error.message || `Failed to ${action} job`)
    }
  }

  const updateProviderSettings = async (settings: Partial<GPUProvider>) => {
    try {
      const response = await apiService.updateProviderSettings(settings)
      if (response.success) {
        setProviderData(prev => prev ? { ...prev, ...settings } : null)
        toast.success('Settings updated successfully!')
      } else {
        throw new Error(response.error?.message || 'Failed to update settings')
      }
    } catch (error: any) {
      console.error('Settings update failed:', error)
      toast.error(error.message || 'Failed to update settings')
    }
  }

  const getStatusColor = (status: GPUProvider['availability']['status']) => {
    switch (status) {
      case 'available': return 'text-green-400 bg-green-400/10'
      case 'busy': return 'text-yellow-400 bg-yellow-400/10'
      case 'maintenance': return 'text-blue-400 bg-blue-400/10'
      case 'offline': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const renderStars = (rating: number, totalRatings: number) => {
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-600'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-400 ml-1">
          {rating.toFixed(1)} ({totalRatings} reviews)
        </span>
      </div>
    )
  }

  const tabs = [
    { name: 'Overview', icon: ChartBarIcon },
    { name: 'Job Queue', icon: ClockIcon },
    { name: 'Active Jobs', icon: PlayIcon },
    { name: 'Earnings', icon: CurrencyDollarIcon },
    { name: 'Settings', icon: Cog6ToothIcon }
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
      {/* Connection Status */}
      {!socketStatus.connected && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/50 text-yellow-400 px-4 py-2">
          <div className="container mx-auto flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="text-sm">
              {socketStatus.connecting ? 'Connecting to real-time updates...' : 'Real-time updates unavailable'}
            </span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Provider Dashboard
            </h1>
            <p className="text-gray-400">
              Manage your GPU resources and track earnings
            </p>
          </div>
          
          {providerData && (
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor(providerStatus || providerData.availability.status)}`}>
                <div className={`w-2 h-2 rounded-full ${
                  (providerStatus || providerData.availability.status) === 'available' ? 'bg-green-400' :
                  (providerStatus || providerData.availability.status) === 'busy' ? 'bg-yellow-400' :
                  (providerStatus || providerData.availability.status) === 'maintenance' ? 'bg-blue-400' :
                  'bg-red-400'
                }`} />
                <span className="font-medium">
                  {(providerStatus || providerData.availability.status).charAt(0).toUpperCase() + 
                   (providerStatus || providerData.availability.status).slice(1)}
                </span>
              </div>
              
              {providerData.verified && (
                <div className="flex items-center gap-1 text-brand-400">
                  <ShieldCheckIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-6 border border-green-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <CurrencyDollarIcon className="w-8 h-8 text-green-400" />
              <span className="text-xs text-green-400 font-medium">TOTAL EARNINGS</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatCurrency(stats.totalEarnings)}
            </div>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              {stats.earningsThisMonth > 0 && (
                <>
                  <ArrowTrendingUpIcon className="w-3 h-3 text-green-400" />
                  {formatCurrency(stats.earningsThisMonth)} this month
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-brand-500/20 to-brand-600/20 rounded-xl p-6 border border-brand-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <CpuChipIcon className="w-8 h-8 text-brand-400" />
              <span className="text-xs text-brand-400 font-medium">ACTIVE JOBS</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.activeJobs}</div>
            <div className="text-sm text-gray-400">
              {jobQueue.length} in queue
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <StarIcon className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">RATING</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-400">
              {stats.totalRatings} reviews
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <BoltIcon className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-blue-400 font-medium">UTILIZATION</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats.utilizationRate}%
            </div>
            <div className="text-sm text-gray-400">
              {stats.uptime}% uptime
            </div>
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
                {/* Provider Summary */}
                {providerData && (
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-white mb-2">{providerData.name}</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                          <span>{providerData.location}</span>
                          <span>•</span>
                          <span>Joined {new Date(providerData.createdAt).toLocaleDateString()}</span>
                        </div>
                        {renderStars(stats.averageRating, stats.totalRatings)}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">Reputation Level</div>
                        <div className="flex items-center gap-2">
                          <TrophyIcon className="w-5 h-5 text-yellow-400" />
                          <span className="font-bold text-white">Level {stats.reputationLevel}</span>
                        </div>
                      </div>
                    </div>

                    {/* GPU Resources */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-white mb-3">GPU Resources</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {providerData.hardware.gpus.map((gpu, index) => (
                          <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-white">{gpu.model}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                gpu.isAvailable 
                                  ? 'text-green-400 bg-green-400/10' 
                                  : 'text-red-400 bg-red-400/10'
                              }`}>
                                {gpu.isAvailable ? 'Available' : 'In Use'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400">
                              {gpu.memory}GB VRAM • {gpu.manufacturer}
                            </div>
                            {gpu.benchmarkScore && (
                              <div className="text-sm text-brand-400 mt-1">
                                Score: {gpu.benchmarkScore}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="text-2xl font-bold text-brand-400">{stats.completedJobs}</div>
                        <div className="text-sm text-gray-400">Jobs Completed</div>
                      </div>
                      <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="text-2xl font-bold text-green-400">
                          {formatCurrency(stats.earningsThisMonth)}
                        </div>
                        <div className="text-sm text-gray-400">This Month</div>
                      </div>
                      <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="text-2xl font-bold text-purple-400">
                          {formatCurrency(stats.stakeAmount)}
                        </div>
                        <div className="text-sm text-gray-400">Staked</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {[...activeJobs.slice(0, 3), ...jobQueue.slice(0, 2)].map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                            {job.status}
                          </div>
                          <div>
                            <div className="font-medium text-white">{job.name}</div>
                            <div className="text-sm text-gray-400">{job.framework} • {job.requireGPUCount} GPU</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">
                            {formatCurrency(job.estimatedCost)}
                          </div>
                          <div className="text-sm text-gray-400">~{job.estimatedDuration}h</div>
                        </div>
                      </div>
                    ))}
                    {[...activeJobs, ...jobQueue].length === 0 && (
                      <div className="text-center py-8">
                        <ClockIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </Tab.Panel>

            {/* Job Queue Tab */}
            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Job Queue ({jobQueue.length})</h2>
                  <span className="text-sm text-gray-400">
                    {socketStatus.connected && (
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Real-time updates
                      </span>
                    )}
                  </span>
                </div>

                <div className="space-y-4">
                  {jobQueue.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">{job.name}</h3>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                              {job.status}
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">{job.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{job.framework}</span>
                            <span>•</span>
                            <span>{job.requireGPUCount} × {job.requireGPUMemory}GB GPU</span>
                            <span>•</span>
                            <span>~{job.estimatedDuration}h</span>
                          </div>
                        </div>
                        
                        <div className="text-right ml-6">
                          <div className="font-bold text-xl text-green-400 mb-1">
                            {formatCurrency(job.estimatedCost)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatCurrency(job.estimatedCost / job.estimatedDuration)}/hr
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                        <div className="text-sm text-gray-400">
                          Submitted: {new Date(job.createdAt).toLocaleString()}
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleJobAction(job.id!, 'reject')}
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleJobAction(job.id!, 'accept')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Accept Job
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {jobQueue.length === 0 && (
                    <div className="text-center py-12">
                      <ClockIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No jobs in queue</h3>
                      <p className="text-gray-400">New jobs will appear here when available</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </Tab.Panel>

            {/* Active Jobs Tab */}
            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Active Jobs ({activeJobs.length})</h2>
                </div>

                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">{job.name}</h3>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                              {job.status}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <div className="text-xs text-gray-400">Framework</div>
                              <div className="font-medium text-white">{job.framework}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Resources</div>
                              <div className="font-medium text-white">{job.requireGPUCount} × {job.requireGPUMemory}GB</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Duration</div>
                              <div className="font-medium text-white">
                                {job.actualDuration ? formatDuration(job.actualDuration) : `~${job.estimatedDuration}h`}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Earnings</div>
                              <div className="font-medium text-green-400">{formatCurrency(job.actualCost || job.estimatedCost)}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar for running jobs */}
                      {job.status === 'running' && job.progress !== undefined && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                            <span>Progress</span>
                            <span>{job.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-brand-500 to-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                        <div className="text-sm text-gray-400">
                          Started: {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Not started'}
                        </div>
                        
                        <div className="flex gap-2">
                          {job.status === 'running' && (
                            <button
                              onClick={() => handleJobAction(job.id!, 'pause')}
                              className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                            >
                              <PauseIcon className="w-4 h-4" />
                            </button>
                          )}
                          {job.status === 'paused' && (
                            <button
                              onClick={() => handleJobAction(job.id!, 'start')}
                              className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                            >
                              <PlayIcon className="w-4 h-4" />
                            </button>
                          )}
                          {job.progress === 100 && job.status === 'running' && (
                            <button
                              onClick={() => handleJobAction(job.id!, 'complete')}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {activeJobs.length === 0 && (
                    <div className="text-center py-12">
                      <PlayIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No active jobs</h3>
                      <p className="text-gray-400">Accepted jobs will appear here</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </Tab.Panel>

            {/* Earnings Tab */}
            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Earnings History</h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                    <DocumentTextIcon className="w-4 h-4" />
                    Export
                  </button>
                </div>

                {/* Earnings Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-2">
                      {formatCurrency(stats.totalEarnings)}
                    </div>
                    <div className="text-gray-400">Total Earned</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-2">
                      {formatCurrency(stats.earningsThisMonth)}
                    </div>
                    <div className="text-gray-400">This Month</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-2">
                      {formatCurrency(stats.totalEarnings / Math.max(stats.completedJobs, 1))}
                    </div>
                    <div className="text-gray-400">Avg per Job</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {earnings.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="bg-gray-800/50 rounded-lg border border-gray-700 p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
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
                          <div className="text-lg font-bold text-green-400">
                            +{formatCurrency(transaction.amount)}
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

                {earnings.length === 0 && (
                  <div className="text-center py-12">
                    <CurrencyDollarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No earnings yet</h3>
                    <p className="text-gray-400">Complete jobs to start earning</p>
                  </div>
                )}
              </motion.div>
            </Tab.Panel>

            {/* Settings Tab */}
            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-white">Provider Settings</h2>
                
                {providerData && (
                  <div className="space-y-6">
                    {/* Basic Settings */}
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <h3 className="font-semibold text-white mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Provider Name</label>
                          <input
                            type="text"
                            defaultValue={providerData.name}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                          <input
                            type="text"
                            defaultValue={providerData.location}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <textarea
                          rows={3}
                          defaultValue={providerData.description}
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    {/* Pricing Settings */}
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <h3 className="font-semibold text-white mb-4">Pricing</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Hourly Rate (USD)</label>
                          <input
                            type="number"
                            defaultValue={providerData.pricing.hourlyRate}
                            step="0.01"
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Duration (minutes)</label>
                          <input
                            type="number"
                            defaultValue={providerData.pricing.minimumJobDuration}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Availability Settings */}
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <h3 className="font-semibold text-white mb-4">Availability</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                          <div>
                            <div className="font-medium text-white">Auto-Accept Jobs</div>
                            <div className="text-sm text-gray-400">Automatically accept jobs that match your criteria</div>
                          </div>
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-brand-500 bg-gray-800 border-gray-600 rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                          <div>
                            <div className="font-medium text-white">Maintenance Mode</div>
                            <div className="text-sm text-gray-400">Temporarily unavailable for new jobs</div>
                          </div>
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-brand-500 bg-gray-800 border-gray-600 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => updateProviderSettings({})}
                      className="px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                    >
                      Save Settings
                    </button>
                  </div>
                )}
              </motion.div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}
