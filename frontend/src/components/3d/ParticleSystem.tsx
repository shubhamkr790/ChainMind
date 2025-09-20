'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'

// Neural Network Particles
function NeuralParticles({ count = 200 }) {
  const points = useRef()
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Create clustered distribution (neural network-like)
      const cluster = Math.floor(Math.random() * 5)
      const clusterX = (cluster - 2) * 10
      const clusterY = (Math.random() - 0.5) * 5
      const clusterZ = (Math.random() - 0.5) * 20
      
      positions[i * 3] = clusterX + (Math.random() - 0.5) * 8
      positions[i * 3 + 1] = clusterY + (Math.random() - 0.5) * 8
      positions[i * 3 + 2] = clusterZ + (Math.random() - 0.5) * 15
      
      // Color based on cluster
      const hue = (cluster * 0.2 + 0.5) % 1
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    
    return { positions, colors }
  }, [count])
  
  useFrame((state) => {
    if (points.current && points.current.geometry && points.current.geometry.attributes.position) {
      const positions = points.current.geometry.attributes.position.array
      const time = state.clock.elapsedTime
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        
        // Create wave-like movement
        positions[i3 + 1] += Math.sin(time + i * 0.1) * 0.01
        positions[i3] += Math.cos(time * 0.5 + i * 0.05) * 0.005
        
        // Wrap around boundaries
        if (positions[i3 + 1] > 20) positions[i3 + 1] = -20
        if (positions[i3 + 1] < -20) positions[i3 + 1] = 20
      }
      
      points.current.geometry.attributes.position.needsUpdate = true
      points.current.rotation.y = time * 0.1
    }
  })
  
  return (
    <Points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesPosition.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particlesPosition.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  )
}

// GPU Core Particles
function GPUCoreParticles({ count = 150 }) {
  const points = useRef()
  const { camera } = useThree()
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Create grid-like pattern (GPU cores)
      const gridSize = Math.ceil(Math.sqrt(count))
      const x = (i % gridSize) - gridSize / 2
      const z = Math.floor(i / gridSize) - gridSize / 2
      
      positions[i * 3] = x * 2 + (Math.random() - 0.5) * 0.5
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = z * 2 + (Math.random() - 0.5) * 0.5
      
      // GPU-themed colors (green/blue)
      const intensity = Math.random()
      colors[i * 3] = 0.2 * intensity     // Red
      colors[i * 3 + 1] = 0.8 * intensity // Green  
      colors[i * 3 + 2] = 1.0 * intensity // Blue
      
      sizes[i] = Math.random() * 0.3 + 0.1
    }
    
    return { positions, colors, sizes }
  }, [count])
  
  useFrame((state) => {
    if (points.current && points.current.geometry && points.current.geometry.attributes.position) {
      const positions = points.current.geometry.attributes.position.array
      const time = state.clock.elapsedTime
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        
        // Pulsing effect
        const pulse = Math.sin(time * 2 + i * 0.1) * 0.5 + 1
        positions[i3 + 1] += pulse * 0.01
        
        // Reset position when too high
        if (positions[i3 + 1] > 15) {
          positions[i3 + 1] = -15
        }
      }
      
      points.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  return (
    <Points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesPosition.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particlesPosition.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={particlesPosition.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.2}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  )
}

// Data Stream Particles
function DataStreamParticles({ count = 200 }) {
  const points = useRef()
  
  const particlesData = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Random starting positions
      positions[i * 3] = (Math.random() - 0.5) * 50
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50
      
      // Random velocities
      velocities[i * 3] = (Math.random() - 0.5) * 0.1
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1
      
      // Data stream colors (cyan/purple)
      const colorType = Math.random()
      if (colorType > 0.5) {
        colors[i * 3] = 0.5     // Cyan-ish
        colors[i * 3 + 1] = 1.0
        colors[i * 3 + 2] = 1.0
      } else {
        colors[i * 3] = 0.8     // Purple-ish
        colors[i * 3 + 1] = 0.3
        colors[i * 3 + 2] = 1.0
      }
    }
    
    return { positions, velocities, colors }
  }, [count])
  
  useFrame((state) => {
    if (points.current && points.current.geometry && points.current.geometry.attributes.position) {
      const positions = points.current.geometry.attributes.position.array
      const time = state.clock.elapsedTime
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        
        // Update positions with velocities
        positions[i3] += particlesData.velocities[i3]
        positions[i3 + 1] += particlesData.velocities[i3 + 1]
        positions[i3 + 2] += particlesData.velocities[i3 + 2]
        
        // Add some noise
        positions[i3] += Math.sin(time + i) * 0.01
        positions[i3 + 1] += Math.cos(time * 0.7 + i) * 0.005
        
        // Wrap around boundaries
        if (Math.abs(positions[i3]) > 25) positions[i3] *= -0.9
        if (Math.abs(positions[i3 + 1]) > 15) positions[i3 + 1] *= -0.9
        if (Math.abs(positions[i3 + 2]) > 25) positions[i3 + 2] *= -0.9
      }
      
      points.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  return (
    <Points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particlesData.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

// Background Stars
function BackgroundStars({ count = 500 }) {
  const points = useRef()
  
  const starPositions = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const radius = 100 + Math.random() * 100
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)  
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      // White/blue stars
      const intensity = Math.random() * 0.5 + 0.5
      colors[i * 3] = intensity
      colors[i * 3 + 1] = intensity
      colors[i * 3 + 2] = intensity + Math.random() * 0.3
    }
    
    return { positions, colors }
  }, [count])
  
  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.01
      points.current.rotation.x = state.clock.elapsedTime * 0.005
    }
  })
  
  return (
    <Points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={starPositions.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={starPositions.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation={false}
        depthWrite={false}
      />
    </Points>
  )
}

// Main Particle Scene
function ParticleScene({ preset = 'neural' }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.1} />
      
      {/* Background Stars */}
      <BackgroundStars count={300} />
      
      {/* Main particle systems based on preset */}
      {preset === 'neural' && <NeuralParticles count={200} />}
      {preset === 'gpu' && <GPUCoreParticles count={150} />}
      {preset === 'data' && <DataStreamParticles count={200} />}
      {preset === 'mixed' && (
        <>
          <NeuralParticles count={100} />
          <GPUCoreParticles count={80} />
          <DataStreamParticles count={120} />
        </>
      )}
    </>
  )
}

// Main Component
interface ParticleSystemProps {
  className?: string
  preset?: 'neural' | 'gpu' | 'data' | 'mixed'
  interactive?: boolean
}

export default function ParticleSystem({ 
  className = "", 
  preset = 'mixed',
  interactive = false 
}: ParticleSystemProps) {
  return (
    <motion.div
      className={`w-full h-full ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      <Canvas
        camera={{ position: [0, 5, 20], fov: 75 }}
        style={{ background: 'transparent' }}
        gl={{ 
          antialias: false,
          powerPreference: "high-performance",
          precision: "lowp"
        }}
        dpr={[0.5, 1.5]}
        performance={{ min: 0.5 }}
        frameloop="demand"
      >
        <ParticleScene preset={preset} />
        {interactive && (
          <mesh>
            {/* Add interactive controls if needed */}
          </mesh>
        )}
      </Canvas>
      
      {/* Optional overlay info */}
      <div className="absolute bottom-4 right-4 bg-black/30 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>AI Compute Network Active</span>
        </div>
      </div>
    </motion.div>
  )
}

export { 
  NeuralParticles, 
  GPUCoreParticles, 
  DataStreamParticles, 
  BackgroundStars 
}
