'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { Float, Text, Line, Sphere, Box, OrbitControls } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'

// GPU Node Component
function GPUNode({ position, scale = 1, color = '#8b5cf6', isActive = true, label, onHover, onUnhover }) {
  const meshRef = useRef()
  const glowRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current && isActive) {
      meshRef.current.rotation.y += 0.01
      meshRef.current.rotation.x += 0.005
      
      // Pulsing effect
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1
      meshRef.current.scale.setScalar(scale * pulse)
    }
    
    if (glowRef.current && isActive) {
      const glowPulse = Math.sin(state.clock.elapsedTime * 3) * 0.2 + 0.8
      glowRef.current.material.opacity = glowPulse * 0.3
    }
  })
  
  return (
    <group position={position}>
      {/* Glow Effect */}
      <Sphere ref={glowRef} scale={scale * 2}>
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </Sphere>
      
      {/* Main GPU Node */}
      <Box
        ref={meshRef}
        scale={scale}
        onPointerOver={onHover}
        onPointerOut={onUnhover}
      >
        <meshPhongMaterial color={isActive ? color : '#666'} />
      </Box>
      
      {/* Node Label */}
      {label && (
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
          <Text
            position={[0, scale + 1, 0]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {label}
          </Text>
        </Float>
      )}
      
      {/* Particle Ring */}
      {isActive && (
        <group>
          {Array.from({ length: 4 }).map((_, i) => {
            const angle = (i / 4) * Math.PI * 2
            const radius = scale * 3
            return (
              <Sphere
                key={i}
              position={[
                Math.cos(angle + i * 0.1) * radius,
                Math.sin(i * 0.2) * 0.5,
                Math.sin(angle + i * 0.1) * radius
              ]}
                scale={0.1}
              >
                <meshBasicMaterial color={color} />
              </Sphere>
            )
          })}
        </group>
      )}
    </group>
  )
}

// Connection Line Component
function ConnectionLine({ start, end, color = '#4ade80', animated = true }) {
  const lineRef = useRef()
  
  useFrame((state) => {
    if (lineRef.current && animated) {
      // Animate line opacity
      const opacity = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7
      lineRef.current.material.opacity = opacity
    }
  })
  
  return (
    <Line
      ref={lineRef}
      points={[start, end]}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.7}
    />
  )
}

// Data Flow Particles
function DataFlow({ start, end, color = '#60a5fa' }) {
  const particleCount = 5
  const particles = useRef()
  
  const positions = useMemo(() => {
    const pos = []
    for (let i = 0; i < particleCount; i++) {
      const t = i / (particleCount - 1)
      const x = start[0] + (end[0] - start[0]) * t
      const y = start[1] + (end[1] - start[1]) * t
      const z = start[2] + (end[2] - start[2]) * t
      pos.push(x, y, z)
    }
    return new Float32Array(pos)
  }, [start, end])
  
  useFrame((state) => {
    if (particles.current && particles.current.geometry && particles.current.geometry.attributes.position) {
      const positions = particles.current.geometry.attributes.position.array
      const time = state.clock.elapsedTime
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        const progress = (time * 2 + i * 0.5) % 1
        
        positions[i3] = start[0] + (end[0] - start[0]) * progress
        positions[i3 + 1] = start[1] + (end[1] - start[1]) * progress
        positions[i3 + 2] = start[2] + (end[2] - start[2]) * progress
      }
      
      particles.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color={color} />
    </points>
  )
}

// Main Network Scene
function NetworkScene() {
  // Define network nodes - simplified for debugging
  const nodes = useMemo(() => [
    // Central Hub
    { id: 'hub', position: [0, 0, 0], scale: 1.5, color: '#8b5cf6', label: 'ChainMind Hub', isActive: true },
    
    // GPU Provider Nodes - reduced count
    { id: 'provider1', position: [5, 2, 3], scale: 1, color: '#06b6d4', label: 'Provider US-East', isActive: true },
    { id: 'provider2', position: [-4, 1, 4], scale: 1, color: '#06b6d4', label: 'Provider EU-West', isActive: true },
    { id: 'provider3', position: [3, -2, -4], scale: 1, color: '#06b6d4', label: 'Provider Asia-Pacific', isActive: true },
    
    // AI Trainers - reduced count
    { id: 'trainer1', position: [7, -1, 1], scale: 0.8, color: '#10b981', label: 'AI Researcher', isActive: true },
    { id: 'trainer2', position: [-6, -2, 3], scale: 0.8, color: '#10b981', label: 'ML Engineer', isActive: true },
  ], [])
  
  // Define connections - simplified
  const connections = useMemo(() => [
    // Hub connections
    { start: [0, 0, 0], end: [5, 2, 3], color: '#8b5cf6' },
    { start: [0, 0, 0], end: [-4, 1, 4], color: '#8b5cf6' },
    { start: [0, 0, 0], end: [3, -2, -4], color: '#8b5cf6' },
    
    // Trainer to Provider connections
    { start: [7, -1, 1], end: [5, 2, 3], color: '#4ade80' },
    { start: [-6, -2, 3], end: [-4, 1, 4], color: '#4ade80' },
  ], [])
  
  return (
    <>
      {/* Test mesh to verify rendering */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial color="#8b5cf6" />
      </mesh>
      
      {/* Ambient and Point Lights */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} color="#8b5cf6" intensity={0.5} />
      <pointLight position={[-10, -10, -10]} color="#06b6d4" intensity={0.3} />
      
      {/* Network Nodes */}
      {nodes.map((node) => (
        <GPUNode
          key={node.id}
          position={node.position}
          scale={node.scale}
          color={node.color}
          label={node.label}
          isActive={node.isActive}
          onHover={() => {}}
          onUnhover={() => {}}
        />
      ))}
      
      {/* Connection Lines */}
      {connections.map((conn, index) => (
        <ConnectionLine
          key={index}
          start={conn.start}
          end={conn.end}
          color={conn.color}
          animated
        />
      ))}
      
      {/* Data Flow Particles */}
      {connections.slice(0, 3).map((conn, index) => (
        <DataFlow
          key={`flow-${index}`}
          start={conn.start}
          end={conn.end}
          color={conn.color}
        />
      ))}
      
      {/* Background Particles */}
      <group>
        {Array.from({ length: 30 }).map((_, i) => {
          // Use seeded positions for consistency
          const seedX = ((i * 17) % 100 - 50) / 100 * 50
          const seedY = ((i * 29) % 100 - 50) / 100 * 50  
          const seedZ = ((i * 41) % 100 - 50) / 100 * 50
          
          return (
            <Sphere
              key={i}
              position={[seedX, seedY, seedZ]}
              scale={0.02}
            >
              <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
            </Sphere>
          )
        })}
      </group>
      
      {/* Grid Reference */}
      <gridHelper args={[20, 20]} position={[0, -8, 0]} color="#333" />
      
      {/* Camera Controls */}
      <OrbitControls
        enableZoom
        enablePan
        enableRotate
        autoRotate
        autoRotateSpeed={0.5}
        minDistance={10}
        maxDistance={30}
      />
    </>
  )
}

// Main Component
interface NetworkTopologyProps {
  className?: string
  interactive?: boolean
  autoRotate?: boolean
}

export default function NetworkTopology({ 
  className = "", 
  interactive = true, 
  autoRotate = true 
}: NetworkTopologyProps) {
  return (
    <motion.div
      className={`w-full h-full ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <Canvas
        camera={{ position: [15, 10, 15], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ 
          antialias: true,
          powerPreference: "high-performance",
          alpha: true
        }}
        dpr={[1, 2]}
        frameloop="always"
      >
        <NetworkScene />
      </Canvas>
      
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-xl rounded-xl p-4 text-white">
        <h3 className="text-sm font-semibold mb-2">Node Types</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>Central Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded"></div>
            <span>GPU Providers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>AI Trainers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Validators</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export { GPUNode, ConnectionLine, DataFlow }
