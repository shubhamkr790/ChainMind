// Validation utilities for training jobs and providers

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate training job data
 */
export function validateJobData(jobData: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Basic required fields
  if (!jobData.title || typeof jobData.title !== 'string' || jobData.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Job title is required' });
  }

  if (!jobData.description || typeof jobData.description !== 'string' || jobData.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Job description is required' });
  }

  if (!jobData.jobType || !['training', 'inference', 'fine-tuning', 'custom'].includes(jobData.jobType)) {
    errors.push({ field: 'jobType', message: 'Valid job type is required' });
  }

  if (!jobData.framework || !['tensorflow', 'pytorch', 'huggingface', 'custom'].includes(jobData.framework)) {
    errors.push({ field: 'framework', message: 'Valid framework is required' });
  }

  // Requirements validation
  if (!jobData.requirements) {
    errors.push({ field: 'requirements', message: 'Job requirements are required' });
  } else {
    const req = jobData.requirements;
    
    if (!req.gpuType || typeof req.gpuType !== 'string') {
      errors.push({ field: 'requirements.gpuType', message: 'GPU type is required' });
    }

    if (!req.gpuMemory || typeof req.gpuMemory !== 'number' || req.gpuMemory < 1) {
      errors.push({ field: 'requirements.gpuMemory', message: 'Valid GPU memory is required' });
    }

    if (!req.gpuCount || typeof req.gpuCount !== 'number' || req.gpuCount < 1) {
      errors.push({ field: 'requirements.gpuCount', message: 'Valid GPU count is required' });
    }

    if (!req.estimatedDuration || typeof req.estimatedDuration !== 'number' || req.estimatedDuration < 1) {
      errors.push({ field: 'requirements.estimatedDuration', message: 'Valid estimated duration is required' });
    }
  }

  // Dataset validation
  if (!jobData.dataset) {
    errors.push({ field: 'dataset', message: 'Dataset information is required' });
  } else {
    const dataset = jobData.dataset;
    
    if (!dataset.name || typeof dataset.name !== 'string') {
      errors.push({ field: 'dataset.name', message: 'Dataset name is required' });
    }

    if (!dataset.size || typeof dataset.size !== 'number' || dataset.size < 1) {
      errors.push({ field: 'dataset.size', message: 'Valid dataset size is required' });
    }

    if (!dataset.format || typeof dataset.format !== 'string') {
      errors.push({ field: 'dataset.format', message: 'Dataset format is required' });
    }

    if (!dataset.location || typeof dataset.location !== 'string') {
      errors.push({ field: 'dataset.location', message: 'Dataset location is required' });
    }
  }

  // Pricing validation
  if (!jobData.pricing) {
    errors.push({ field: 'pricing', message: 'Pricing information is required' });
  } else {
    const pricing = jobData.pricing;
    
    if (!pricing.budget || typeof pricing.budget !== 'number' || pricing.budget <= 0) {
      errors.push({ field: 'pricing.budget', message: 'Valid budget is required' });
    }

    if (!pricing.maxHourlyRate || typeof pricing.maxHourlyRate !== 'number' || pricing.maxHourlyRate <= 0) {
      errors.push({ field: 'pricing.maxHourlyRate', message: 'Valid maximum hourly rate is required' });
    }
  }

  // Environment validation
  if (!jobData.environment) {
    errors.push({ field: 'environment', message: 'Environment configuration is required' });
  } else {
    const env = jobData.environment;
    
    if (!env.trainingScript || typeof env.trainingScript !== 'string') {
      errors.push({ field: 'environment.trainingScript', message: 'Training script is required' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate provider registration data
 */
export function validateProviderData(providerData: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Basic required fields
  if (!providerData.name || typeof providerData.name !== 'string' || providerData.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Provider name is required' });
  }

  // Location validation
  if (!providerData.location) {
    errors.push({ field: 'location', message: 'Location information is required' });
  } else {
    const location = providerData.location;
    
    if (!location.country || typeof location.country !== 'string') {
      errors.push({ field: 'location.country', message: 'Country is required' });
    }
  }

  // Hardware validation
  if (!providerData.hardware) {
    errors.push({ field: 'hardware', message: 'Hardware information is required' });
  } else {
    const hardware = providerData.hardware;
    
    // GPU validation
    if (!hardware.gpus || !Array.isArray(hardware.gpus) || hardware.gpus.length === 0) {
      errors.push({ field: 'hardware.gpus', message: 'At least one GPU is required' });
    } else {
      hardware.gpus.forEach((gpu: any, index: number) => {
        if (!gpu.model || typeof gpu.model !== 'string') {
          errors.push({ field: `hardware.gpus[${index}].model`, message: 'GPU model is required' });
        }
        if (!gpu.memory || typeof gpu.memory !== 'number' || gpu.memory < 1) {
          errors.push({ field: `hardware.gpus[${index}].memory`, message: 'Valid GPU memory is required' });
        }
        if (!gpu.cores || typeof gpu.cores !== 'number' || gpu.cores < 1) {
          errors.push({ field: `hardware.gpus[${index}].cores`, message: 'Valid GPU cores count is required' });
        }
      });
    }

    // CPU validation
    if (!hardware.cpu) {
      errors.push({ field: 'hardware.cpu', message: 'CPU information is required' });
    } else {
      const cpu = hardware.cpu;
      if (!cpu.model || typeof cpu.model !== 'string') {
        errors.push({ field: 'hardware.cpu.model', message: 'CPU model is required' });
      }
      if (!cpu.cores || typeof cpu.cores !== 'number' || cpu.cores < 1) {
        errors.push({ field: 'hardware.cpu.cores', message: 'Valid CPU cores count is required' });
      }
      if (!cpu.clockSpeed || typeof cpu.clockSpeed !== 'number' || cpu.clockSpeed <= 0) {
        errors.push({ field: 'hardware.cpu.clockSpeed', message: 'Valid CPU clock speed is required' });
      }
    }

    // RAM validation
    if (!hardware.ram) {
      errors.push({ field: 'hardware.ram', message: 'RAM information is required' });
    } else {
      const ram = hardware.ram;
      if (!ram.total || typeof ram.total !== 'number' || ram.total < 1) {
        errors.push({ field: 'hardware.ram.total', message: 'Valid RAM total is required' });
      }
    }

    // Storage validation
    if (!hardware.storage) {
      errors.push({ field: 'hardware.storage', message: 'Storage information is required' });
    } else {
      const storage = hardware.storage;
      if (!storage.total || typeof storage.total !== 'number' || storage.total < 10) {
        errors.push({ field: 'hardware.storage.total', message: 'Minimum 10GB storage is required' });
      }
    }
  }

  // Pricing validation
  if (!providerData.pricing) {
    errors.push({ field: 'pricing', message: 'Pricing information is required' });
  } else {
    const pricing = providerData.pricing;
    
    if (!pricing.hourlyRate || typeof pricing.hourlyRate !== 'number' || pricing.hourlyRate <= 0) {
      errors.push({ field: 'pricing.hourlyRate', message: 'Valid hourly rate is required' });
    }

    if (!pricing.currency || !['USD', 'EUR', 'ETH', 'POL'].includes(pricing.currency)) {
      errors.push({ field: 'pricing.currency', message: 'Valid currency is required' });
    }

    if (!pricing.minimumJobDuration || typeof pricing.minimumJobDuration !== 'number' || pricing.minimumJobDuration < 1) {
      errors.push({ field: 'pricing.minimumJobDuration', message: 'Valid minimum job duration is required' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength?: number): string {
  let sanitized = input.trim().replace(/[<>]/g, '');
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

/**
 * Validate wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate numeric range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
