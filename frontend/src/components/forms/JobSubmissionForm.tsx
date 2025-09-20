'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CloudArrowUpIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  ClockIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  PlayIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { GPUProvider, TrainingJob, JobType, Framework } from '@/types/marketplace'
import { useDropzone } from 'react-dropzone'
import { apiService } from '@/services/api'
import { ipfsService } from '@/services/ipfsService'
import FileManager from '@/components/common/FileManager'
import { toast } from 'react-hot-toast'

// Job submission schema
const jobSubmissionSchema = z.object({
  name: z.string().min(1, 'Job name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  jobType: z.enum(['training', 'inference', 'fine-tuning', 'custom']),
  framework: z.enum(['pytorch', 'tensorflow', 'jax', 'custom']),
  maxBudget: z.number().min(0.01, 'Budget must be positive'),
  estimatedDuration: z.number().min(1, 'Duration must be at least 1 hour'),
  requireGPUMemory: z.number().min(1, 'GPU memory requirement needed'),
  requireGPUCount: z.number().min(1, 'At least 1 GPU required').max(8, 'Maximum 8 GPUs'),
  dockerImage: z.string().url('Must be a valid Docker image URL').optional(),
  entryCommand: z.string().min(1, 'Entry command required'),
  environmentVariables: z.record(z.string()).optional(),
  datasets: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    size: z.number(),
    type: z.string()
  })).optional(),
  hyperparameters: z.record(z.any()).optional(),
  outputRequirements: z.object({
    modelFormats: z.array(z.string()).optional(),
    artifacts: z.array(z.string()).optional(),
    metrics: z.array(z.string()).optional()
  }).optional(),
  deadlineDate: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  autoAcceptProviders: z.boolean().default(false),
  requireVerifiedProviders: z.boolean().default(true)
})

type JobSubmissionData = z.infer<typeof jobSubmissionSchema>

interface JobSubmissionFormProps {
  selectedProvider?: GPUProvider
  onSubmit: (job: Partial<TrainingJob>) => void
  onCancel?: () => void
  initialData?: Partial<JobSubmissionData>
}

const jobTypes: Array<{ value: JobType; label: string; description: string }> = [
  { value: 'training', label: 'Model Training', description: 'Train ML models from scratch' },
  { value: 'fine-tuning', label: 'Fine-tuning', description: 'Fine-tune pre-trained models' },
  { value: 'inference', label: 'Inference', description: 'Run inference on trained models' },
  { value: 'custom', label: 'Custom Job', description: 'Custom compute workload' }
]

const frameworks: Array<{ value: Framework; label: string; icon: string }> = [
  { value: 'pytorch', label: 'PyTorch', icon: '🔥' },
  { value: 'tensorflow', label: 'TensorFlow', icon: '🧠' },
  { value: 'jax', label: 'JAX', icon: '⚡' },
  { value: 'custom', label: 'Custom', icon: '🛠️' }
]

const priorityLevels = [
  { value: 'low', label: 'Low Priority', color: 'text-gray-400', multiplier: '0.9x' },
  { value: 'medium', label: 'Medium Priority', color: 'text-blue-400', multiplier: '1.0x' },
  { value: 'high', label: 'High Priority', color: 'text-yellow-400', multiplier: '1.2x' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-400', multiplier: '1.5x' }
]

export default function JobSubmissionForm({
  selectedProvider,
  onSubmit,
  onCancel,
  initialData
}: JobSubmissionFormProps) {
  const [step, setStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [environmentVars, setEnvironmentVars] = useState<Array<{key: string, value: string}>>([])
  const [hyperparams, setHyperparams] = useState<Array<{key: string, value: string, type: string}>>([])
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid }
  } = useForm<JobSubmissionData>({
    resolver: zodResolver(jobSubmissionSchema),
    defaultValues: {
      jobType: 'training',
      framework: 'pytorch',
      requireGPUCount: 1,
      requireGPUMemory: 8,
      priority: 'medium',
      autoAcceptProviders: false,
      requireVerifiedProviders: true,
      ...initialData
    }
  })

  // Watch form values for cost estimation
  const watchedValues = watch(['maxBudget', 'estimatedDuration', 'requireGPUCount', 'priority'])

  // File upload handling
  const handleFilesUploaded = (files: any[]) => {
    setUploadedFiles(files)
  }

  const handleFileRemoved = (ipfsHash: string) => {
    setUploadedFiles(prev => prev.filter(f => f.ipfsHash !== ipfsHash))
  }

  // Environment variables management
  const addEnvironmentVar = () => {
    setEnvironmentVars(prev => [...prev, { key: '', value: '' }])
  }

  const updateEnvironmentVar = (index: number, field: 'key' | 'value', value: string) => {
    setEnvironmentVars(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const removeEnvironmentVar = (index: number) => {
    setEnvironmentVars(prev => prev.filter((_, i) => i !== index))
  }

  // Hyperparameters management
  const addHyperparam = () => {
    setHyperparams(prev => [...prev, { key: '', value: '', type: 'string' }])
  }

  const updateHyperparam = (index: number, field: 'key' | 'value' | 'type', value: string) => {
    setHyperparams(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const removeHyperparam = (index: number) => {
    setHyperparams(prev => prev.filter((_, i) => i !== index))
  }

  // Cost estimation
  const calculateEstimatedCost = () => {
    const values = getValues()
    const baseCost = (selectedProvider?.hourlyRate || 2.5) * values.estimatedDuration * values.requireGPUCount
    const priorityMultipliers = { low: 0.9, medium: 1.0, high: 1.2, urgent: 1.5 }
    const multiplier = priorityMultipliers[values.priority]
    return baseCost * multiplier
  }

  // Form submission
  const onFormSubmit = async (data: JobSubmissionData) => {
    try {
      setIsSubmitting(true)

      // Prepare environment variables and hyperparameters
      const envVars = environmentVars.reduce((acc, { key, value }) => {
        if (key && value) acc[key] = value
        return acc
      }, {} as Record<string, string>)

      const hyperparameters = hyperparams.reduce((acc, { key, value, type }) => {
        if (key && value) {
          let parsedValue: any = value
          try {
            if (type === 'number') parsedValue = Number(value)
            else if (type === 'boolean') parsedValue = value === 'true'
            else if (type === 'json') parsedValue = JSON.parse(value)
          } catch (e) {
            console.warn(`Failed to parse hyperparameter ${key}:`, e)
          }
          acc[key] = parsedValue
        }
        return acc
      }, {} as Record<string, any>)

      // Prepare dataset URLs from uploaded files
      let datasetUrls: Array<{name: string, url: string, size: number, type: string}> = []
      if (uploadedFiles.length > 0) {
        datasetUrls = uploadedFiles.map(file => ({
          name: file.file.name,
          url: ipfsService.getIPFSUrl(file.ipfsHash),
          size: file.file.size,
          type: file.file.type
        }))
      }

      const jobData: Partial<TrainingJob> = {
        ...data,
        environmentVariables: envVars,
        hyperparameters,
        datasets: datasetUrls,
        selectedProviderId: selectedProvider?.id,
        estimatedCost: calculateEstimatedCost(),
        status: 'pending',
        createdAt: new Date()
      }

      await onSubmit(jobData)
      toast.success('Job submitted successfully!')

    } catch (error: any) {
      console.error('Job submission failed:', error)
      toast.error(error.message || 'Failed to submit job')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4))
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  const steps = [
    { id: 1, name: 'Basic Info', description: 'Job details and requirements' },
    { id: 2, name: 'Configuration', description: 'Technical setup and parameters' },
    { id: 3, name: 'Data & Files', description: 'Upload datasets and code' },
    { id: 4, name: 'Review & Submit', description: 'Final review and submission' }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm
                ${step >= s.id 
                  ? 'bg-brand-500 text-white' 
                  : 'bg-gray-700 text-gray-400'
                }
              `}>
                {step > s.id ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  s.id
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-20 h-1 mx-2 ${step > s.id ? 'bg-brand-500' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-1">
            {steps.find(s => s.id === step)?.name}
          </h2>
          <p className="text-gray-400 text-sm">
            {steps.find(s => s.id === step)?.description}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Name *
                </label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="My Training Job"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  )}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Type *
                </label>
                <Controller
                  name="jobType"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {jobTypes.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => field.onChange(type.value)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            field.value === type.value
                              ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                              : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="Describe your training job, objectives, and any special requirements..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                )}
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Framework Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Framework *
              </label>
              <Controller
                name="framework"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-4 gap-3">
                    {frameworks.map(framework => (
                      <button
                        key={framework.value}
                        type="button"
                        onClick={() => field.onChange(framework.value)}
                        className={`p-4 rounded-lg border text-center transition-all ${
                          field.value === framework.value
                            ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                            : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-2xl mb-1">{framework.icon}</div>
                        <div className="font-medium text-sm">{framework.label}</div>
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Resource Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <CpuChipIcon className="w-4 h-4 inline mr-1" />
                  GPU Count *
                </label>
                <Controller
                  name="requireGPUCount"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {[1, 2, 4, 8].map(count => (
                        <option key={count} value={count}>{count} GPU{count > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GPU Memory (GB) *
                </label>
                <Controller
                  name="requireGPUMemory"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {[8, 16, 24, 32, 48, 80].map(memory => (
                        <option key={memory} value={memory}>{memory}GB</option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  Est. Duration (hours) *
                </label>
                <Controller
                  name="estimatedDuration"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="1"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="24"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  )}
                />
                {errors.estimatedDuration && (
                  <p className="text-red-400 text-sm mt-1">{errors.estimatedDuration.message}</p>
                )}
              </div>
            </div>

            {/* Budget and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                  Max Budget *
                </label>
                <Controller
                  name="maxBudget"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="0.01"
                      step="0.01"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="100.00"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  )}
                />
                {errors.maxBudget && (
                  <p className="text-red-400 text-sm mt-1">{errors.maxBudget.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority Level
                </label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {priorityLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label} ({level.multiplier} cost)
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Configuration */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Docker Configuration */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Docker Image (Optional)
                </label>
                <Controller
                  name="dockerImage"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="pytorch/pytorch:2.0.1-cuda11.7-devel"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  )}
                />
                <p className="text-gray-400 text-xs mt-1">
                  Leave empty to use the default image for your selected framework
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Entry Command *
                </label>
                <Controller
                  name="entryCommand"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="python train.py --config config.yaml"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  )}
                />
                {errors.entryCommand && (
                  <p className="text-red-400 text-sm mt-1">{errors.entryCommand.message}</p>
                )}
              </div>
            </div>

            {/* Environment Variables */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">
                  Environment Variables
                </label>
                <button
                  type="button"
                  onClick={addEnvironmentVar}
                  className="flex items-center gap-1 px-3 py-1 bg-brand-500 text-white rounded text-sm hover:bg-brand-600 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Variable
                </button>
              </div>
              
              <div className="space-y-2">
                {environmentVars.map((envVar, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="KEY"
                      value={envVar.key}
                      onChange={(e) => updateEnvironmentVar(index, 'key', e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="value"
                      value={envVar.value}
                      onChange={(e) => updateEnvironmentVar(index, 'value', e.target.value)}
                      className="flex-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeEnvironmentVar(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {environmentVars.length === 0 && (
                  <p className="text-gray-400 text-sm italic">No environment variables defined</p>
                )}
              </div>
            </div>

            {/* Hyperparameters */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">
                  Hyperparameters
                </label>
                <button
                  type="button"
                  onClick={addHyperparam}
                  className="flex items-center gap-1 px-3 py-1 bg-brand-500 text-white rounded text-sm hover:bg-brand-600 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Parameter
                </button>
              </div>
              
              <div className="space-y-2">
                {hyperparams.map((param, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="parameter_name"
                      value={param.key}
                      onChange={(e) => updateHyperparam(index, 'key', e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <select
                      value={param.type}
                      onChange={(e) => updateHyperparam(index, 'type', e.target.value)}
                      className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="json">JSON</option>
                    </select>
                    <input
                      type="text"
                      placeholder="value"
                      value={param.value}
                      onChange={(e) => updateHyperparam(index, 'value', e.target.value)}
                      className="flex-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeHyperparam(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {hyperparams.length === 0 && (
                  <p className="text-gray-400 text-sm italic">No hyperparameters defined</p>
                )}
              </div>
            </div>

            {/* Additional Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                  <h4 className="font-medium text-white">Require Verified Providers</h4>
                  <p className="text-sm text-gray-400">Only allow verified GPU providers to bid on this job</p>
                </div>
                <Controller
                  name="requireVerifiedProviders"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-5 h-5 text-brand-500 bg-gray-800 border-gray-600 rounded focus:ring-brand-500"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                  <h4 className="font-medium text-white">Auto-Accept Best Provider</h4>
                  <p className="text-sm text-gray-400">Automatically accept the best-rated provider within budget</p>
                </div>
                <Controller
                  name="autoAcceptProviders"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-5 h-5 text-brand-500 bg-gray-800 border-gray-600 rounded focus:ring-brand-500"
                    />
                  )}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Data & Files */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Upload Training Data & Code
              </label>
              
              <FileManager
                onFilesUploaded={handleFilesUploaded}
                onFileRemoved={handleFileRemoved}
                maxFiles={10}
                maxSizeInMB={500}
                allowedTypes={[
                  'application/zip',
                  'application/x-tar',
                  'application/gzip',
                  'text/python',
                  'application/json',
                  'text/plain'
                ]}
                allowDirectoryUpload={true}
                showPreview={true}
                enableSharing={false}
              />
            </div>

            {/* Output Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expected Outputs
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Model Formats</label>
                  <input
                    type="text"
                    placeholder="pytorch, onnx, tensorrt"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Artifacts</label>
                  <input
                    type="text"
                    placeholder="logs, checkpoints, plots"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Metrics</label>
                  <input
                    type="text"
                    placeholder="accuracy, loss, f1_score"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Deadline (Optional)
              </label>
              <Controller
                name="deadlineDate"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="datetime-local"
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                )}
              />
            </div>
          </motion.div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Cost Estimation */}
            <div className="bg-gradient-to-br from-brand-500/20 to-purple-500/20 rounded-lg p-6 border border-brand-500/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5" />
                Cost Estimation
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-400">
                    ${calculateEstimatedCost().toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">Total Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    ${((selectedProvider?.hourlyRate || 2.5) * getValues('requireGPUCount')).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">Per Hour</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {getValues('estimatedDuration')}h
                  </div>
                  <div className="text-xs text-gray-400">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {getValues('requireGPUCount')}x
                  </div>
                  <div className="text-xs text-gray-400">GPUs</div>
                </div>
              </div>

              {calculateEstimatedCost() > getValues('maxBudget') && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 text-red-400 rounded-lg border border-red-500/50">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span className="text-sm">
                    Estimated cost exceeds your maximum budget. Consider reducing duration or GPU count.
                  </span>
                </div>
              )}
            </div>

            {/* Job Summary */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Job Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Job Name:</span>
                  <span className="text-white font-medium">{getValues('name')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">{getValues('jobType')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Framework:</span>
                  <span className="text-white capitalize">{getValues('framework')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resources:</span>
                  <span className="text-white">
                    {getValues('requireGPUCount')} GPU × {getValues('requireGPUMemory')}GB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Priority:</span>
                  <span className="text-white capitalize">{getValues('priority')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Files:</span>
                  <span className="text-white">{uploadedFiles.length} uploaded</span>
                </div>
                {selectedProvider && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Selected Provider:</span>
                    <span className="text-brand-400 font-medium">{selectedProvider.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms Acceptance */}
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/50">
              <InformationCircleIcon className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="mb-2">
                  By submitting this job, you agree to our terms of service and understand that:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Payment will be held in escrow until job completion</li>
                  <li>You can cancel the job before it starts for a full refund</li>
                  <li>Partial refunds may apply for incomplete jobs</li>
                  <li>All data transfers are encrypted and secure</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-700">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Previous
              </button>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !isValid || calculateEstimatedCost() > getValues('maxBudget')}
                className="px-8 py-2 bg-gradient-to-r from-brand-500 to-purple-500 text-white rounded-lg hover:from-brand-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4" />
                    Submit Job
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
