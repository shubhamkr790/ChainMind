'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect } from 'wagmi';
import { motion } from 'framer-motion';
import { Wallet, ChevronDown, User, ExternalLink, Copy, LogOut } from 'lucide-react';
import { useState } from 'react';

const CustomConnectButton = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { disconnect } = useDisconnect();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <motion.button
                    onClick={openConnectModal}
                    className="relative group bg-gradient-to-r from-purple-500 via-purple-600 to-blue-600 hover:from-purple-600 hover:via-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 border border-white/10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                    
                    <div className="relative flex items-center space-x-2">
                      <Wallet className="w-4 h-4" />
                      <span>Connect Wallet</span>
                    </div>
                  </motion.button>
                );
              }

              if (chain.unsupported) {
                return (
                  <motion.button
                    onClick={openChainModal}
                    className="relative group bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg border border-red-400/20"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span>Wrong Network</span>
                    </div>
                  </motion.button>
                );
              }

              return (
                <div className="relative">
                  <motion.div 
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Chain button */}
                    <motion.button
                      onClick={openChainModal}
                      className="relative group bg-black/30 backdrop-blur-xl border border-white/20 hover:border-purple-400/50 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-white/5"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center space-x-2">
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 20,
                              height: 20,
                              borderRadius: 999,
                              overflow: 'hidden',
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 20, height: 20 }}
                              />
                            )}
                          </div>
                        )}
                        <span className="text-white text-sm font-medium hidden sm:block">
                          {chain.name}
                        </span>
                      </div>
                    </motion.button>

                    {/* Account button */}
                    <div className="relative">
                      <motion.button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="relative group bg-gradient-to-r from-purple-500/20 via-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-white/20 hover:border-purple-400/50 px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/5"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-white text-sm font-medium">
                            {account.displayName}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </motion.button>

                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-64 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50"
                          onMouseLeave={() => setIsDropdownOpen(false)}
                        >
                          {/* Account Info */}
                          <div className="p-4 border-b border-white/10">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">
                                  {account.displayName}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {account.displayBalance}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(account.address);
                                setIsDropdownOpen(false);
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-200"
                            >
                              <Copy className="w-4 h-4" />
                              <span className="text-sm">Copy Address</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                window.open(`https://polygonscan.com/address/${account.address}`, '_blank');
                                setIsDropdownOpen(false);
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-200"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="text-sm">View on Explorer</span>
                            </button>

                            <button
                              onClick={() => {
                                openAccountModal();
                                setIsDropdownOpen(false);
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-200"
                            >
                              <User className="w-4 h-4" />
                              <span className="text-sm">Account Details</span>
                            </button>

                            <div className="border-t border-white/10 mt-2 pt-2">
                              <button
                                onClick={() => {
                                  disconnect();
                                  setIsDropdownOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200"
                              >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm">Disconnect</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;
