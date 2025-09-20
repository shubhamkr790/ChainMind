'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'

// Simple animated particles
function SimpleParticles({ count = 100 }) {
  const points = useRef()
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Use seeded pseudo-random values for consistent SSR
      const seedX = ((i * 17) % 100 - 50) / 100 * 20
      const seedY = ((i * 29) % 100 - 50) / 100 * 20
      const seedZ = ((i * 41) % 100 - 50) / 100 * 20
      
      positions[i * 3] = seedX
      positions[i * 3 + 1] = seedY
      positions[i * 3 + 2] = seedZ
      
      const color = new THREE.Color()
      const hue = 0.6 + ((i * 7) % 20) / 100
      color.setHSL(hue, 0.7, 0.6)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    
    return { positions, colors }
  }, [count])
  
  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.1
      points.current.rotation.x = state.clock.elapsedTime * 0.05
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
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  )
}

// Main lightweight scene
function LightweightScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <SimpleParticles count={150} />
    </>
  )
}

interface LightweightBackgroundProps {
  className?: string
}

export default function LightweightBackground({ className = "" }: LightweightBackgroundProps) {
  return (
    <motion.div
      className={`w-full h-full ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ 
          antialias: false,
          powerPreference: "high-performance",
          precision: "lowp"
        }}
        dpr={[0.5, 1]}
        performance={{ min: 0.7 }}
        frameloop="demand"
        style={{ background: 'transparent' }}
      >
        <LightweightScene />
      </Canvas>
    </motion.div>
  )
}
