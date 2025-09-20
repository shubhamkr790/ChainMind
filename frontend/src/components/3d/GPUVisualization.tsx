'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  Float, 
  Text, 
  Box, 
  Sphere, 
  OrbitControls, 
  Stars,
  MeshDistortMaterial,
  Environment,
  Sparkles
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import * as THREE from 'three'
import { motion } from 'framer-motion'

// Animated GPU Core Component
function GPUCore({ position = [0, 0, 0], color = '#8B5CF6', ...props }) {
  const meshRef = useRef<THREE.Group>(null)
  const { viewport } = useThree()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1
    }
  })

  return (
    <Float
      speed={1.5}
      rotationIntensity={1}
      floatIntensity={0.5}
      position={position}
      {...props}
    >
      <group ref={meshRef}>
        {/* Main GPU Chip */}
        <Box args={[1.5, 0.2, 1.5]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color={color}
            roughness={0.2}
            metalness={0.8}
            distort={0.1}
            speed={2}
            emissive={color}
            emissiveIntensity={0.2}
          />
        </Box>
        
        {/* Memory Modules */}
        {Array.from({ length: 4 }).map((_, i) => (
          <Box 
            key={i} 
            args={[0.1, 0.3, 0.8]} 
            position={[
              -0.6 + (i % 2) * 1.2, 
              0.2, 
              i < 2 ? -1 : 1
            ]}
          >
            <MeshDistortMaterial
              color="#10B981"
              roughness={0.1}
              metalness={0.9}
              emissive="#10B981"
              emissiveIntensity={0.1}
            />
          </Box>
        ))}
        
        {/* Heat Sinks */}
        {Array.from({ length: 6 }).map((_, i) => (
          <Box 
            key={i} 
            args={[0.05, 0.4, 0.05]} 
            position={[
              -0.5 + (i % 3) * 0.5, 
              0.3, 
              i < 3 ? -0.3 : 0.3
            ]}
          >
            <MeshDistortMaterial
              color="#64748B"
              roughness={0.3}
              metalness={0.7}
            />
          </Box>
        ))}
        
        {/* Power Connectors */}
        <Box args={[0.3, 0.1, 0.2]} position={[0.9, 0.1, 0]}>
          <MeshDistortMaterial
            color="#F59E0B"
            roughness={0.2}
            metalness={0.8}
            emissive="#F59E0B"
            emissiveIntensity={0.3}
          />
        </Box>
      </group>
      
      {/* Particle Effects */}
      <Sparkles
        count={15}
        scale={[2, 2, 2]}
        size={1}
        speed={0.3}
        color="#8B5CF6"
      />
    </Float>
  )
}

// GPU Cluster Visualization
function GPUCluster() {
  const gpuPositions = useMemo(() => {
    const positions = []
    const radius = 4
    const count = 5
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      positions.push([
        Math.cos(angle) * radius,
        Math.sin(i * 0.5) * 2,
        Math.sin(angle) * radius
      ])
    }
    return positions
  }, [])

  return (
    <group>
      {gpuPositions.map((position, index) => (
        <GPUCore
          key={index}
          position={position}
          color={[
            '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', 
            '#06B6D4', '#8B5CF6', '#EC4899', '#84CC16'
          ][index]}
        />
      ))}
      
    </group>
  )
}

// Particle Field representing AI computation
function ComputeParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  const particleCount = 300
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
      
      // Color
      const color = new THREE.Color()
      color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.5 + Math.random() * 0.5)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    
    return { positions, colors }
  }, [])

  useFrame((state) => {
    // Throttle updates to every 3rd frame for better performance
    if (state.clock.elapsedTime % 0.05 < 0.016 && particlesRef.current && particlesRef.current.geometry && particlesRef.current.geometry.attributes.position) {
      const positions = particlesRef.current.geometry.attributes.position.array
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.005
        positions[i3] += Math.cos(state.clock.elapsedTime + i) * 0.003
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  )
}

// Performance Stats Display
function PerformanceStats({ stats = {} }) {
  return (
    <Float
      speed={0.5}
      rotationIntensity={0.2}
      floatIntensity={0.1}
      position={[0, 5, 0]}
    >
      <Text
        fontSize={0.8}
        color="#10B981"
        anchorX="center"
        anchorY="middle"
        position={[0, 1, 0]}
      >
        {stats.activeGPUs || '1,247'} GPUs Active
      </Text>
      <Text
        fontSize={0.5}
        color="#64748B"
        anchorX="center"
        anchorY="middle"
        position={[0, 0.2, 0]}
      >
        Processing {stats.jobsRunning || '89'} AI Training Jobs
      </Text>
      <Text
        fontSize={0.5}
        color="#64748B"
        anchorX="center"
        anchorY="middle"
        position={[0, -0.5, 0]}
      >
        ${stats.valueProcessed || '2.4M'} Value Processed
      </Text>
    </Float>
  )
}

// Main 3D Scene Component
function Scene({ interactive = true, showStats = true, stats = {} }) {
  return (
    <>
      {/* Lighting Setup */}
      <ambientLight intensity={0.2} color="#8B5CF6" />
      <pointLight position={[10, 10, 10]} intensity={1} color="#10B981" />
      <pointLight position={[-10, -10, 5]} intensity={0.5} color="#F59E0B" />
      <spotLight
        position={[0, 20, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.8}
        color="#8B5CF6"
        castShadow
      />
      
      {/* Environment and Background */}
      <Stars
        radius={100}
        depth={50}
        count={1000}
        factor={2}
        saturation={0}
        fade
        speed={0.5}
      />
      <Environment preset="night" />
      
      {/* Main Content */}
      <GPUCluster />
      <ComputeParticles />
      
      {showStats && <PerformanceStats stats={stats} />}
      
      {/* Camera Controls */}
      {interactive && (
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          zoomSpeed={0.6}
          rotateSpeed={0.5}
          autoRotate={true}
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={30}
        />
      )}
      
      {/* Post-processing Effects - Temporarily disabled */}
      {/* <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          width={512}
          height={512}
        />
      </EffectComposer> */}
    </>
  )
}

// Main Component Export
interface GPUVisualizationProps {
  className?: string
  interactive?: boolean
  showStats?: boolean
  stats?: {
    activeGPUs?: string
    jobsRunning?: string
    valueProcessed?: string
  }
  style?: React.CSSProperties
}

export default function GPUVisualization({
  className = "",
  interactive = true,
  showStats = true,
  stats = {},
  style = {},
  ...props
}: GPUVisualizationProps) {
  return (
    <motion.div
      className={`relative w-full h-full ${className}`}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      {...props}
    >
      <Canvas
        camera={{ position: [8, 8, 8], fov: 75 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
        shadows
        frameloop="always"
      >
        <Scene 
          interactive={interactive} 
          showStats={showStats} 
          stats={stats} 
        />
      </Canvas>
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </motion.div>
  )
}

// Additional exports for individual components
export { GPUCore, GPUCluster, ComputeParticles }
