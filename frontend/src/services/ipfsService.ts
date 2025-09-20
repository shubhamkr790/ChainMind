import axios from 'axios'

interface PinataConfig {
  apiKey: string
  secretApiKey: string
  pinataJwtKey: string
}

interface IPFSUploadResponse {
  ipfsHash: string
  pinSize: number
  timestamp: string
  isDuplicate?: boolean
}

interface IPFSFileMetadata {
  name: string
  keyvalues: Record<string, string | number>
}

interface PinListResponse {
  rows: Array<{
    id: string
    ipfs_pin_hash: string
    size: number
    user_id: string
    date_pinned: string
    date_unpinned: string | null
    metadata: {
      name: string
      keyvalues: Record<string, any>
    }
    regions: Array<{
      regionId: string
      currentReplicationCount: number
      desiredReplicationCount: number
    }>
    mime_type: string
    number_of_files: number
  }>
  count: number
}

export class IPFSService {
  private config: PinataConfig
  private baseURL = 'https://api.pinata.cloud'

  constructor() {
    this.config = {
      apiKey: process.env.NEXT_PUBLIC_PINATA_API_KEY || '',
      secretApiKey: process.env.PINATA_SECRET_API_KEY || '',
      pinataJwtKey: process.env.PINATA_JWT_KEY || ''
    }

    if (!this.config.apiKey && !this.config.pinataJwtKey) {
      console.warn('IPFS Service: No Pinata credentials found. File upload will not work.')
    }
  }

  /**
   * Get authorization headers for Pinata API
   */
  private getAuthHeaders() {
    if (this.config.pinataJwtKey) {
      return {
        'Authorization': `Bearer ${this.config.pinataJwtKey}`
      }
    } else if (this.config.apiKey && this.config.secretApiKey) {
      return {
        'pinata_api_key': this.config.apiKey,
        'pinata_secret_api_key': this.config.secretApiKey
      }
    }
    throw new Error('No valid Pinata authentication credentials found')
  }

  /**
   * Test connection to Pinata
   */
  async testAuthentication(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/data/testAuthentication`, {
        headers: this.getAuthHeaders()
      })
      return response.data.message === 'Congratulations! You are communicating with the Pinata API!'
    } catch (error) {
      console.error('IPFS authentication test failed:', error)
      return false
    }
  }

  /**
   * Upload a file to IPFS via Pinata
   */
  async uploadFile(
    file: File, 
    metadata?: IPFSFileMetadata,
    progressCallback?: (progress: number) => void
  ): Promise<IPFSUploadResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Add metadata if provided
      if (metadata) {
        formData.append('pinataMetadata', JSON.stringify(metadata))
      }

      // Add pinning options
      const pinataOptions = {
        cidVersion: 1,
        customPinPolicy: {
          regions: [
            {
              id: 'FRA1',
              desiredReplicationCount: 1
            },
            {
              id: 'NYC1', 
              desiredReplicationCount: 1
            }
          ]
        }
      }
      formData.append('pinataOptions', JSON.stringify(pinataOptions))

      const response = await axios.post(
        `${this.baseURL}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressCallback && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              progressCallback(progress)
            }
          }
        }
      )

      return {
        ipfsHash: response.data.IpfsHash,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
        isDuplicate: response.data.isDuplicate || false
      }
    } catch (error: any) {
      console.error('IPFS file upload failed:', error)
      throw new Error(error.response?.data?.message || 'Failed to upload file to IPFS')
    }
  }

  /**
   * Upload multiple files to IPFS as a directory
   */
  async uploadDirectory(
    files: File[],
    directoryName: string,
    metadata?: IPFSFileMetadata,
    progressCallback?: (progress: number) => void
  ): Promise<IPFSUploadResponse> {
    try {
      const formData = new FormData()
      
      files.forEach((file, index) => {
        // Create directory structure
        const filePath = `${directoryName}/${file.name}`
        formData.append('file', file, filePath)
      })

      // Add metadata
      const directoryMetadata = {
        name: directoryName,
        keyvalues: {
          type: 'directory',
          fileCount: files.length,
          ...metadata?.keyvalues
        }
      }
      formData.append('pinataMetadata', JSON.stringify(directoryMetadata))

      const pinataOptions = {
        cidVersion: 1,
        wrapWithDirectory: true,
        customPinPolicy: {
          regions: [
            { id: 'FRA1', desiredReplicationCount: 1 },
            { id: 'NYC1', desiredReplicationCount: 1 }
          ]
        }
      }
      formData.append('pinataOptions', JSON.stringify(pinataOptions))

      const response = await axios.post(
        `${this.baseURL}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressCallback && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              progressCallback(progress)
            }
          }
        }
      )

      return {
        ipfsHash: response.data.IpfsHash,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
        isDuplicate: response.data.isDuplicate || false
      }
    } catch (error: any) {
      console.error('IPFS directory upload failed:', error)
      throw new Error(error.response?.data?.message || 'Failed to upload directory to IPFS')
    }
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(
    data: any,
    filename: string,
    metadata?: IPFSFileMetadata
  ): Promise<IPFSUploadResponse> {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      const jsonBlob = new Blob([jsonString], { type: 'application/json' })
      const file = new File([jsonBlob], filename, { type: 'application/json' })
      
      return await this.uploadFile(file, metadata)
    } catch (error) {
      console.error('IPFS JSON upload failed:', error)
      throw new Error('Failed to upload JSON to IPFS')
    }
  }

  /**
   * Pin an existing IPFS hash to Pinata
   */
  async pinByHash(
    ipfsHash: string,
    metadata?: IPFSFileMetadata
  ): Promise<{ ipfsHash: string; status: string }> {
    try {
      const pinData: any = {
        hashToPin: ipfsHash,
        pinataOptions: {
          cidVersion: 1
        }
      }

      if (metadata) {
        pinData.pinataMetadata = metadata
      }

      const response = await axios.post(
        `${this.baseURL}/pinning/pinByHash`,
        pinData,
        { headers: this.getAuthHeaders() }
      )

      return {
        ipfsHash: response.data.ipfsHash,
        status: response.data.status
      }
    } catch (error: any) {
      console.error('IPFS pin by hash failed:', error)
      throw new Error(error.response?.data?.message || 'Failed to pin IPFS hash')
    }
  }

  /**
   * Get list of pinned files
   */
  async getPinnedFiles(
    limit = 100,
    offset = 0,
    metadata?: Record<string, string>
  ): Promise<PinListResponse> {
    try {
      const params: any = {
        pageLimit: limit,
        pageOffset: offset,
        status: 'pinned'
      }

      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          params[`metadata[keyvalues][${key}]`] = value
        })
      }

      const response = await axios.get(`${this.baseURL}/data/pinList`, {
        headers: this.getAuthHeaders(),
        params
      })

      return response.data
    } catch (error: any) {
      console.error('Failed to get pinned files:', error)
      throw new Error(error.response?.data?.message || 'Failed to get pinned files')
    }
  }

  /**
   * Unpin a file from IPFS
   */
  async unpinFile(ipfsHash: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseURL}/pinning/unpin/${ipfsHash}`, {
        headers: this.getAuthHeaders()
      })
      return true
    } catch (error: any) {
      console.error('Failed to unpin file:', error)
      throw new Error(error.response?.data?.message || 'Failed to unpin file')
    }
  }

  /**
   * Update metadata for a pinned file
   */
  async updateMetadata(
    ipfsHash: string, 
    metadata: IPFSFileMetadata
  ): Promise<boolean> {
    try {
      await axios.put(
        `${this.baseURL}/pinning/hashMetadata`,
        {
          ipfsPinHash: ipfsHash,
          name: metadata.name,
          keyvalues: metadata.keyvalues
        },
        { headers: this.getAuthHeaders() }
      )
      return true
    } catch (error: any) {
      console.error('Failed to update metadata:', error)
      throw new Error(error.response?.data?.message || 'Failed to update metadata')
    }
  }

  /**
   * Get file content from IPFS
   */
  async getFile(ipfsHash: string): Promise<Response> {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }
      return response
    } catch (error: any) {
      console.error('Failed to get file from IPFS:', error)
      throw new Error('Failed to get file from IPFS')
    }
  }

  /**
   * Get file content as blob
   */
  async getFileBlob(ipfsHash: string): Promise<Blob> {
    const response = await this.getFile(ipfsHash)
    return response.blob()
  }

  /**
   * Get file content as text
   */
  async getFileText(ipfsHash: string): Promise<string> {
    const response = await this.getFile(ipfsHash)
    return response.text()
  }

  /**
   * Get JSON data from IPFS
   */
  async getJSON<T = any>(ipfsHash: string): Promise<T> {
    const response = await this.getFile(ipfsHash)
    return response.json()
  }

  /**
   * Generate IPFS gateway URL
   */
  getGatewayUrl(ipfsHash: string, filename?: string): string {
    const baseUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
    return filename ? `${baseUrl}/${filename}` : baseUrl
  }

  /**
   * Generate IPFS native URL
   */
  getIPFSUrl(ipfsHash: string): string {
    return `ipfs://${ipfsHash}`
  }

  /**
   * Calculate estimated storage cost for a file size
   */
  calculateStorageCost(sizeInBytes: number, durationInDays = 30): number {
    // Pinata pricing: roughly $0.15 per GB per month
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024)
    const monthlyRate = 0.15 // USD per GB per month
    const dailyRate = monthlyRate / 30
    return sizeInGB * dailyRate * durationInDays
  }

  /**
   * Validate file size and type for upload
   */
  validateFile(file: File, maxSizeInMB = 100, allowedTypes?: string[]): boolean {
    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      throw new Error(`File size exceeds ${maxSizeInMB}MB limit`)
    }

    // Check file type if specified
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`)
    }

    return true
  }

  /**
   * Create a shareable link for an IPFS file
   */
  createShareableLink(ipfsHash: string, filename?: string): string {
    return this.getGatewayUrl(ipfsHash, filename)
  }

  /**
   * Batch upload multiple files
   */
  async batchUpload(
    files: File[],
    metadata?: (file: File, index: number) => IPFSFileMetadata,
    progressCallback?: (fileIndex: number, progress: number, totalFiles: number) => void
  ): Promise<IPFSUploadResponse[]> {
    const results: IPFSUploadResponse[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileMetadata = metadata ? metadata(file, i) : undefined

      try {
        const result = await this.uploadFile(file, fileMetadata, (progress) => {
          if (progressCallback) {
            progressCallback(i, progress, files.length)
          }
        })
        results.push(result)
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error)
        throw error
      }
    }

    return results
  }
}

// Create and export singleton instance
export const ipfsService = new IPFSService()

// Export types for use in other files
export type { IPFSUploadResponse, IPFSFileMetadata, PinListResponse }
