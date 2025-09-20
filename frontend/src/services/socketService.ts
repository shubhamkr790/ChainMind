import { io, Socket } from 'socket.io-client'
import { TrainingJob, GPUProvider, Transaction } from '@/types/marketplace'

export interface SocketEvents {
  // Job events
  'job:created': (job: TrainingJob) => void
  'job:updated': (job: TrainingJob) => void
  'job:status_changed': (jobId: string, status: TrainingJob['status'], progress?: number) => void
  'job:progress': (jobId: string, progress: number, logs?: string) => void
  'job:completed': (job: TrainingJob) => void
  'job:failed': (jobId: string, error: string) => void
  
  // Provider events  
  'provider:connected': (provider: GPUProvider) => void
  'provider:disconnected': (providerId: string) => void
  'provider:status_changed': (providerId: string, status: GPUProvider['availability']['status']) => void
  
  // Bidding events
  'bid:received': (jobId: string, providerId: string, amount: number) => void
  'bid:accepted': (jobId: string, providerId: string) => void
  'bid:rejected': (jobId: string, providerId: string) => void
  
  // Transaction events
  'transaction:created': (transaction: Transaction) => void
  'transaction:confirmed': (transactionId: string) => void
  
  // System notifications
  'notification': (type: 'info' | 'success' | 'warning' | 'error', message: string, data?: any) => void
  'system:maintenance': (message: string, duration?: number) => void
  
  // Chat/Communication
  'message:received': (from: string, message: string, jobId?: string) => void
  'typing:start': (userId: string, jobId?: string) => void
  'typing:stop': (userId: string, jobId?: string) => void
}

export type SocketEventMap = {
  [K in keyof SocketEvents]: SocketEvents[K]
}

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private isConnected = false
  private eventHandlers = new Map<string, Set<Function>>()
  
  constructor() {
    this.connect()
  }

  /**
   * Connect to Socket.io server
   */
  connect(): void {
    if (this.socket?.connected) return

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001'
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      auth: {
        token: this.getAuthToken()
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    })

    this.setupEventListeners()
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && !!this.socket?.connected
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  /**
   * Setup Socket.io event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      // Socket.io connected
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connected')
    })

    this.socket.on('disconnect', (reason) => {
      // Socket.io disconnected
      this.isConnected = false
      this.emit('disconnected', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('connection_failed', error)
      }
    })

    // Authentication events
    this.socket.on('authenticated', (user) => {
      // Socket authenticated for user
      this.emit('authenticated', user)
    })

    this.socket.on('unauthorized', (error) => {
      console.error('Socket authentication failed:', error)
      this.emit('unauthorized', error)
    })
  }

  /**
   * Subscribe to a Socket.io event
   */
  on<T extends keyof SocketEventMap>(event: T, handler: SocketEventMap[T]): void {
    if (!this.socket) {
      console.warn('Socket not initialized, queuing event listener')
      setTimeout(() => this.on(event, handler), 1000)
      return
    }

    this.socket.on(event as string, handler as any)
    
    // Track handlers for cleanup
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler as Function)
  }

  /**
   * Unsubscribe from a Socket.io event
   */
  off<T extends keyof SocketEventMap>(event: T, handler?: SocketEventMap[T]): void {
    if (!this.socket) return

    if (handler) {
      this.socket.off(event as string, handler as any)
      
      // Remove from tracked handlers
      const handlers = this.eventHandlers.get(event)
      if (handlers) {
        handlers.delete(handler as Function)
        if (handlers.size === 0) {
          this.eventHandlers.delete(event)
        }
      }
    } else {
      // Remove all handlers for this event
      this.socket.off(event as string)
      this.eventHandlers.delete(event)
    }
  }

  /**
   * Emit a Socket.io event
   */
  emit<T extends string>(event: T, ...args: any[]): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit event:', event)
      return
    }

    this.socket.emit(event, ...args)
  }

  /**
   * Subscribe to job-specific events
   */
  subscribeToJob(jobId: string): void {
    this.emit('job:subscribe', jobId)
    
    // Set up job-specific event handlers
    this.on('job:progress', (id, progress, logs) => {
      if (id === jobId) {
        this.emit(`job:${jobId}:progress`, progress, logs)
      }
    })

    this.on('job:status_changed', (id, status, progress) => {
      if (id === jobId) {
        this.emit(`job:${jobId}:status_changed`, status, progress)
      }
    })
  }

  /**
   * Unsubscribe from job-specific events
   */
  unsubscribeFromJob(jobId: string): void {
    this.emit('job:unsubscribe', jobId)
    
    // Clean up job-specific handlers
    this.off(`job:${jobId}:progress` as any)
    this.off(`job:${jobId}:status_changed` as any)
  }

  /**
   * Subscribe to provider updates
   */
  subscribeToProvider(providerId: string): void {
    this.emit('provider:subscribe', providerId)
  }

  /**
   * Unsubscribe from provider updates
   */
  unsubscribeFromProvider(providerId: string): void {
    this.emit('provider:unsubscribe', providerId)
  }

  /**
   * Join a room for real-time communication
   */
  joinRoom(room: string): void {
    this.emit('room:join', room)
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    this.emit('room:leave', room)
  }

  /**
   * Send a message in a room
   */
  sendMessage(room: string, message: string, type = 'text'): void {
    this.emit('message:send', {
      room,
      message,
      type,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Start typing indicator
   */
  startTyping(room: string): void {
    this.emit('typing:start', room)
  }

  /**
   * Stop typing indicator  
   */
  stopTyping(room: string): void {
    this.emit('typing:stop', room)
  }

  /**
   * Request current status of a job
   */
  requestJobStatus(jobId: string): void {
    this.emit('job:status_request', jobId)
  }

  /**
   * Request current status of a provider
   */
  requestProviderStatus(providerId: string): void {
    this.emit('provider:status_request', providerId)
  }

  /**
   * Send heartbeat to maintain connection
   */
  sendHeartbeat(): void {
    this.emit('heartbeat', { timestamp: Date.now() })
  }

  /**
   * Update user authentication token
   */
  updateAuth(token: string): void {
    if (this.socket) {
      this.socket.auth = { token }
      if (this.socket.connected) {
        // Re-authenticate with new token
        this.emit('authenticate', token)
      }
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    connected: boolean
    reconnectAttempts: number
    socketId?: string
    transport?: string
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id,
      transport: this.socket?.io.engine?.transport?.name
    }
  }

  /**
   * Clean up all event handlers
   */
  cleanup(): void {
    // Remove all tracked event handlers
    for (const [event, handlers] of this.eventHandlers.entries()) {
      for (const handler of handlers) {
        this.socket?.off(event, handler as any)
      }
    }
    this.eventHandlers.clear()
    
    this.disconnect()
  }

  /**
   * Enable debug mode
   */
  enableDebug(): void {
    if (this.socket) {
      this.socket.on('*', (event, ...args) => {
        // Debug: Socket.io event
      })
    }
  }
}

// Create singleton instance
export const socketService = new SocketService()

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    socketService.cleanup()
  })
}

export default socketService
