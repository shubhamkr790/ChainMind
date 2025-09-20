import { useEffect, useCallback, useRef, useState } from 'react'
import { socketService, SocketEventMap } from '@/services/socketService'
import { TrainingJob, GPUProvider, Transaction } from '@/types/marketplace'

export interface SocketConnectionStatus {
  connected: boolean
  connecting: boolean
  error: string | null
  reconnectAttempts: number
}

/**
 * Hook for managing Socket.io connection status
 */
export function useSocketConnection() {
  const [status, setStatus] = useState<SocketConnectionStatus>({
    connected: false,
    connecting: true,
    error: null,
    reconnectAttempts: 0
  })

  useEffect(() => {
    const handleConnect = () => {
      setStatus(prev => ({
        ...prev,
        connected: true,
        connecting: false,
        error: null
      }))
    }

    const handleDisconnect = (reason: string) => {
      setStatus(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: reason
      }))
    }

    const handleConnectError = (error: any) => {
      const stats = socketService.getConnectionStats()
      setStatus(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error.message || 'Connection failed',
        reconnectAttempts: stats.reconnectAttempts
      }))
    }

    const handleReconnectAttempt = () => {
      setStatus(prev => ({
        ...prev,
        connecting: true,
        error: null
      }))
    }

    socketService.on('connected' as any, handleConnect)
    socketService.on('disconnected' as any, handleDisconnect)
    socketService.on('connect_error' as any, handleConnectError)
    socketService.on('reconnect_attempt' as any, handleReconnectAttempt)

    // Initial status
    setStatus({
      connected: socketService.isSocketConnected(),
      connecting: false,
      error: null,
      reconnectAttempts: 0
    })

    return () => {
      socketService.off('connected' as any, handleConnect)
      socketService.off('disconnected' as any, handleDisconnect)
      socketService.off('connect_error' as any, handleConnectError)
      socketService.off('reconnect_attempt' as any, handleReconnectAttempt)
    }
  }, [])

  const reconnect = useCallback(() => {
    socketService.disconnect()
    socketService.connect()
  }, [])

  return { status, reconnect }
}

/**
 * Hook for listening to Socket.io events with automatic cleanup
 */
export function useSocket<T extends keyof SocketEventMap>(
  event: T,
  handler: SocketEventMap[T],
  deps: any[] = []
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const wrappedHandler = (...args: any[]) => {
      handlerRef.current(...args as Parameters<SocketEventMap[T]>)
    }

    socketService.on(event, wrappedHandler as SocketEventMap[T])

    return () => {
      socketService.off(event, wrappedHandler as SocketEventMap[T])
    }
  }, deps)
}

/**
 * Hook for managing job-specific Socket.io events
 */
export function useJobSocket(jobId: string | null) {
  const [jobStatus, setJobStatus] = useState<TrainingJob['status'] | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    if (!jobId) return

    socketService.subscribeToJob(jobId)

    const handleStatusChange = (id: string, status: TrainingJob['status'], prog?: number) => {
      if (id === jobId) {
        setJobStatus(status)
        if (prog !== undefined) setProgress(prog)
      }
    }

    const handleProgress = (id: string, prog: number, newLogs?: string) => {
      if (id === jobId) {
        setProgress(prog)
        if (newLogs) {
          setLogs(prev => [...prev, newLogs])
        }
      }
    }

    const handleJobCompleted = (job: TrainingJob) => {
      if (job.id === jobId) {
        setJobStatus('completed')
        setProgress(100)
      }
    }

    const handleJobFailed = (id: string, error: string) => {
      if (id === jobId) {
        setJobStatus('failed')
        setLogs(prev => [...prev, `Error: ${error}`])
      }
    }

    socketService.on('job:status_changed', handleStatusChange)
    socketService.on('job:progress', handleProgress)
    socketService.on('job:completed', handleJobCompleted)
    socketService.on('job:failed', handleJobFailed)

    return () => {
      socketService.unsubscribeFromJob(jobId)
      socketService.off('job:status_changed', handleStatusChange)
      socketService.off('job:progress', handleProgress)
      socketService.off('job:completed', handleJobCompleted)
      socketService.off('job:failed', handleJobFailed)
    }
  }, [jobId])

  const requestStatus = useCallback(() => {
    if (jobId) {
      socketService.requestJobStatus(jobId)
    }
  }, [jobId])

  return {
    status: jobStatus,
    progress,
    logs,
    requestStatus
  }
}

/**
 * Hook for managing provider-specific Socket.io events
 */
export function useProviderSocket(providerId: string | null) {
  const [providerStatus, setProviderStatus] = useState<GPUProvider['availability']['status'] | null>(null)

  useEffect(() => {
    if (!providerId) return

    socketService.subscribeToProvider(providerId)

    const handleStatusChange = (id: string, status: GPUProvider['availability']['status']) => {
      if (id === providerId) {
        setProviderStatus(status)
      }
    }

    const handleProviderConnected = (provider: GPUProvider) => {
      if (provider.id === providerId) {
        setProviderStatus(provider.availability.status)
      }
    }

    const handleProviderDisconnected = (id: string) => {
      if (id === providerId) {
        setProviderStatus('offline')
      }
    }

    socketService.on('provider:status_changed', handleStatusChange)
    socketService.on('provider:connected', handleProviderConnected)
    socketService.on('provider:disconnected', handleProviderDisconnected)

    return () => {
      socketService.unsubscribeFromProvider(providerId)
      socketService.off('provider:status_changed', handleStatusChange)
      socketService.off('provider:connected', handleProviderConnected)
      socketService.off('provider:disconnected', handleProviderDisconnected)
    }
  }, [providerId])

  const requestStatus = useCallback(() => {
    if (providerId) {
      socketService.requestProviderStatus(providerId)
    }
  }, [providerId])

  return {
    status: providerStatus,
    requestStatus
  }
}

/**
 * Hook for managing bidding events
 */
export function useBiddingSocket(jobId: string | null) {
  const [bids, setBids] = useState<Array<{
    providerId: string
    amount: number
    timestamp: Date
  }>>([])
  const [acceptedBid, setAcceptedBid] = useState<{
    jobId: string
    providerId: string
  } | null>(null)

  useEffect(() => {
    if (!jobId) return

    const handleBidReceived = (jId: string, providerId: string, amount: number) => {
      if (jId === jobId) {
        setBids(prev => [...prev, {
          providerId,
          amount,
          timestamp: new Date()
        }])
      }
    }

    const handleBidAccepted = (jId: string, providerId: string) => {
      if (jId === jobId) {
        setAcceptedBid({ jobId: jId, providerId })
      }
    }

    const handleBidRejected = (jId: string, providerId: string) => {
      if (jId === jobId) {
        setBids(prev => prev.filter(bid => bid.providerId !== providerId))
      }
    }

    socketService.on('bid:received', handleBidReceived)
    socketService.on('bid:accepted', handleBidAccepted)
    socketService.on('bid:rejected', handleBidRejected)

    return () => {
      socketService.off('bid:received', handleBidReceived)
      socketService.off('bid:accepted', handleBidAccepted)
      socketService.off('bid:rejected', handleBidRejected)
    }
  }, [jobId])

  const acceptBid = useCallback((providerId: string) => {
    if (jobId) {
      socketService.emit('bid:accept', jobId, providerId)
    }
  }, [jobId])

  const rejectBid = useCallback((providerId: string) => {
    if (jobId) {
      socketService.emit('bid:reject', jobId, providerId)
    }
  }, [jobId])

  return {
    bids,
    acceptedBid,
    acceptBid,
    rejectBid
  }
}

/**
 * Hook for managing notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    message: string
    data?: any
    timestamp: Date
  }>>([])

  useSocket('notification', (type, message, data) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      data,
      timestamp: new Date()
    }
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep last 10
  })

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    removeNotification,
    clearAll
  }
}

/**
 * Hook for managing real-time chat
 */
export function useChatSocket(roomId: string | null) {
  const [messages, setMessages] = useState<Array<{
    id: string
    from: string
    message: string
    timestamp: Date
  }>>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!roomId) return

    socketService.joinRoom(roomId)

    const handleMessage = (from: string, message: string, jId?: string) => {
      if (jId === roomId) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          from,
          message,
          timestamp: new Date()
        }])
      }
    }

    const handleTypingStart = (userId: string, jId?: string) => {
      if (jId === roomId) {
        setTypingUsers(prev => new Set([...prev, userId]))
      }
    }

    const handleTypingStop = (userId: string, jId?: string) => {
      if (jId === roomId) {
        setTypingUsers(prev => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      }
    }

    socketService.on('message:received', handleMessage)
    socketService.on('typing:start', handleTypingStart)
    socketService.on('typing:stop', handleTypingStop)

    return () => {
      socketService.leaveRoom(roomId)
      socketService.off('message:received', handleMessage)
      socketService.off('typing:start', handleTypingStart)
      socketService.off('typing:stop', handleTypingStop)
    }
  }, [roomId])

  const sendMessage = useCallback((message: string) => {
    if (roomId && message.trim()) {
      socketService.sendMessage(roomId, message.trim())
    }
  }, [roomId])

  const startTyping = useCallback(() => {
    if (roomId) {
      socketService.startTyping(roomId)
      
      // Auto-stop typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(roomId)
      }, 3000)
    }
  }, [roomId])

  const stopTyping = useCallback(() => {
    if (roomId) {
      socketService.stopTyping(roomId)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [roomId])

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    startTyping,
    stopTyping
  }
}
