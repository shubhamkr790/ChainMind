'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface NetworkStats {
  nodesOnline: number;
  totalNodes: number;
  activeJobs: number;
  networkHealth: number;
  avgProcessingTime: number;
  totalHashrate: number;
}

const NetworkStatus = () => {
  const [stats, setStats] = useState<NetworkStats>({
    nodesOnline: 11,
    totalNodes: 11,
    activeJobs: 23,
    networkHealth: 100,
    avgProcessingTime: 0.8,
    totalHashrate: 450
  });

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeJobs: Math.floor(Math.random() * 5) + 20,
        networkHealth: Math.floor(Math.random() * 5) + 96,
        avgProcessingTime: Math.random() * 0.5 + 0.5,
        totalHashrate: Math.floor(Math.random() * 50) + 425
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Network Nodes',
      value: `${stats.nodesOnline}/${stats.totalNodes}`,
      subtext: 'Online',
      color: 'text-green-400',
      bgGradient: 'from-green-500/20 to-emerald-500/20',
      icon: '🔗'
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs.toString(),
      subtext: 'Processing',
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      icon: '⚡'
    },
    {
      title: 'Network Health',
      value: `${stats.networkHealth}%`,
      subtext: 'Optimal',
      color: stats.networkHealth > 95 ? 'text-green-400' : 'text-yellow-400',
      bgGradient: stats.networkHealth > 95 ? 'from-green-500/20 to-emerald-500/20' : 'from-yellow-500/20 to-orange-500/20',
      icon: '💚'
    },
    {
      title: 'Avg Processing',
      value: `${stats.avgProcessingTime.toFixed(1)}s`,
      subtext: 'Response Time',
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/20 to-pink-500/20',
      icon: '⏱️'
    },
    {
      title: 'Total Hashrate',
      value: `${stats.totalHashrate}`,
      subtext: 'TH/s',
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/20 to-red-500/20',
      icon: '🔥'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-4">
          Network Status
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Real-time monitoring of our distributed GPU network performance and health metrics
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.6, 
              delay: index * 0.1,
              ease: "easeOut" 
            }}
            whileHover={{ 
              scale: 1.05,
              y: -5
            }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} backdrop-blur-xl border border-white/10 p-6 group cursor-pointer`}
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{stat.icon}</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-gray-300 text-sm font-medium">
                  {stat.title}
                </h3>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <p className="text-gray-400 text-xs">
                  {stat.subtext}
                </p>
              </div>

              {/* Progress bar for certain metrics */}
              {(stat.title === 'Network Health' || stat.title === 'Network Nodes') && (
                <div className="mt-4">
                  <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                    <motion.div
                      className={`h-1.5 rounded-full bg-gradient-to-r ${
                        stat.title === 'Network Health' 
                          ? stats.networkHealth > 95 
                            ? 'from-green-400 to-emerald-400' 
                            : 'from-yellow-400 to-orange-400'
                          : 'from-green-400 to-emerald-400'
                      }`}
                      initial={{ width: 0 }}
                      whileInView={{ 
                        width: stat.title === 'Network Health' 
                          ? `${stats.networkHealth}%` 
                          : `${(stats.nodesOnline / stats.totalNodes) * 100}%`
                      }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional network info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
            <span className="text-blue-400 mr-2">📊</span>
            Network Load
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">CPU Usage</span>
              <span className="text-white">67%</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 w-[67%]" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Memory</span>
              <span className="text-white">84%</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 w-[84%]" />
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
            <span className="text-green-400 mr-2">🌐</span>
            Global Reach
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">North America</span>
              <span className="text-green-400">4 nodes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Europe</span>
              <span className="text-green-400">3 nodes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Asia Pacific</span>
              <span className="text-green-400">4 nodes</span>
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
            <span className="text-orange-400 mr-2">⚡</span>
            Performance
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Uptime</span>
              <span className="text-green-400">99.9%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Latency</span>
              <span className="text-blue-400">12ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Throughput</span>
              <span className="text-purple-400">2.4k req/s</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NetworkStatus;
