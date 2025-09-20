'use client'

import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { Toaster } from 'react-hot-toast'
import { config } from '@/lib/wagmi'

import '@rainbow-me/rainbowkit/styles.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
})

// Custom theme
const chainMindTheme = darkTheme({
  accentColor: '#0ea5e9',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
})

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={chainMindTheme}>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
              },
              success: {
                style: {
                  background: '#065f46',
                  border: '1px solid #10b981',
                },
              },
              error: {
                style: {
                  background: '#7f1d1d',
                  border: '1px solid #ef4444',
                },
              },
            }}
          />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
