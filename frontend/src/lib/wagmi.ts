import { http, createConfig } from 'wagmi'
import { polygon, polygonMumbai, polygonAmoy, hardhat } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id'

// Define chains based on environment
const chains = [
  polygon,
  polygonMumbai,
  polygonAmoy, // Added for our deployed contracts
  ...(process.env.NODE_ENV === 'development' ? [hardhat] : [])
] as const

// Singleton pattern to prevent multiple WalletConnect initializations
let _config: ReturnType<typeof createConfig> | null = null

function getConfig() {
  if (_config) {
    return _config
  }

  _config = createConfig({
    chains,
    connectors: [
      injected(),
      coinbaseWallet({
        appName: 'ChainMind',
        appLogoUrl: 'https://chainmind.ai/logo.png',
      }),
      walletConnect({
        projectId,
        metadata: {
          name: 'ChainMind',
          description: 'Decentralized AI Compute Marketplace',
          url: 'https://chainmind.ai',
          icons: ['https://chainmind.ai/logo.png'],
        },
        showQrModal: true, // Ensure QR modal is enabled
      }),
    ],
    transports: {
      [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
      [polygonMumbai.id]: http(process.env.NEXT_PUBLIC_POLYGON_MUMBAI_RPC_URL),
      [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_RPC_URL), // Use our configured Amoy RPC
      [hardhat.id]: http('http://127.0.0.1:8545'),
    },
  })

  return _config
}

export const config = getConfig()

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
