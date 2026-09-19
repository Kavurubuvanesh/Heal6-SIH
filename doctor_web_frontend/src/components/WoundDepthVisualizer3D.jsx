import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import {
  Layers,
  RotateCw,
  Eye,
  Camera,
  Sliders,
  Sparkles,
  RefreshCw,
  Box,
  Compass,
  Scan,
  ZoomIn,
  ZoomOut,
  Crosshair
} from 'lucide-react'

export default function WoundDepthVisualizer3D({
  meshData = null,
  maxDepthMm = 2.4,
  meanDepthMm = 1.6,
  woundVolumeCm3 = 0.12,
  depthClassification = "Superficial Dermal Ulcer",
  calibrationPxPerCm = 42.0,
  rawImageSrc = null,
  maskImageSrc = null,
  woundAreaCm2 = 2.45,
  hotspot = null,
  onProfileGenerated = null,
  className = ""
}) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const groupRef = useRef(null)
  const meshRef = useRef(null)
  const wireframeRef = useRef(null)
  const pointsRef = useRef(null)
  const clipPlaneRef = useRef(null)
  const animFrameIdRef = useRef(null)

  // Interaction State - default to 'rgb' (Natural Real Patient Photo Mapping)
  const [renderMode, setRenderMode] = useState('surface') // 'surface' | 'wireframe' | 'points'
  const [colorScheme, setColorScheme] = useState('rgb') // 'rgb' (NAT: Real Patient Photo) | 'thermal' (JET) | 'viridis'
  const [depthExaggeration, setDepthExaggeration] = useState(1.5)
  const [sliceDepthMm, setSliceDepthMm] = useState(10.0) // 0 to 10mm
  const [isAutoRotate, setIsAutoRotate] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  
  // Image & Texture State
  const [patientTexture, setPatientTexture] = useState(null)
  const [textureLoaded, setTextureLoaded] = useState(false)
  const [loadedRawImg, setLoadedRawImg] = useState(null)
  const [loadedMaskImg, setLoadedMaskImg] = useState(null)

  // Mouse drag orbit tracking
  const isDraggingRef = useRef(false)
  const prevMousePosRef = useRef({ x: 0, y: 0 })
  const rotationRef = useRef({ x: 0.5, y: -0.6 })
  const targetRotationRef = useRef({ x: 0.5, y: -0.6 })
  const zoomRef = useRef(42)
  const targetZoomRef = useRef(42)

  // Load real patient scan texture whenever rawImageSrc updates
  useEffect(() => {
    if (!rawImageSrc) {
      setPatientTexture(null)
      setTextureLoaded(false)
      setLoadedRawImg(null)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const tex = new THREE.Texture(img)
      tex.wrapS = THREE.ClampToEdgeWrapping
      tex.wrapT = THREE.ClampToEdgeWrapping
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.colorSpace = THREE.SRGBColorSpace
      tex.needsUpdate = true
      setPatientTexture(tex)
      setTextureLoaded(true)
      setLoadedRawImg(img)
    }
    img.onerror = (err) => {
      console.warn('[3D Metrology] Failed to load patient image texture:', err)
      setPatientTexture(null)
      setTextureLoaded(false)
      setLoadedRawImg(null)
    }
    img.src = rawImageSrc
  }, [rawImageSrc])

  // Load mask image if provided
  useEffect(() => {
    if (!maskImageSrc) {
      setLoadedMaskImg(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setLoadedMaskImg(img)
    }
    img.onerror = () => {
      setLoadedMaskImg(null)
    }
    img.src = maskImageSrc
  }, [maskImageSrc])

  // -------------------------------------------------------------
  // 1. Morphology-Aware 3D Wound Topography Generator
  //    Excavates down ONLY inside the real wound boundary on the foot!
  // -------------------------------------------------------------
  const generateMorphologyMesh = useCallback((gridSize = 44, maxD = 2.4) => {
    const isZero = Number(maxD) <= 0.05
    const widthMm = 36.0
    const heightMm = 36.0

    if (isZero) {
      // Intact skin: flat surface everywhere
      const vertices = []
      const uvs = []
      const colors = []
      const faces = []

      for (let r = 0; r < gridSize; r++) {
        const v = r / (gridSize - 1)
        const y = (v - 0.5) * heightMm
        for (let c = 0; c < gridSize; c++) {
          const u = c / (gridSize - 1)
          const x = (u - 0.5) * widthMm
          vertices.push(x, y, 0.0)
          uvs.push(u, 1.0 - v)
          colors.push(0.0)
        }
      }
      for (let r = 0; r < gridSize - 1; r++) {
        for (let c = 0; c < gridSize - 1; c++) {
          const i0 = r * gridSize + c
          const i1 = i0 + 1
          const i2 = (r + 1) * gridSize + c
          const i3 = i2 + 1
          faces.push(i0, i2, i1, i1, i2, i3)
        }
      }

      if (onProfileGenerated) {
        const flatProfile = Array.from({ length: 40 }, (_, i) => ({
          x_mm: Number((i * 0.9).toFixed(1)),
          depth_mm: 0.0
        }))
        onProfileGenerated(flatProfile)
      }

      return {
        grid_size: gridSize,
        width_mm: widthMm,
        height_mm: heightMm,
        vertices,
        uvs,
        colors,
        faces
      }
    }

    // Active ulcer: determine wound presence on grid from mask or raw image
    const offscreen = document.createElement('canvas')
    offscreen.width = gridSize
    offscreen.height = gridSize
    const ctx = offscreen.getContext('2d')

    const woundMask = new Float32Array(gridSize * gridSize)
    let hasValidMask = false

    if (loadedMaskImg && loadedMaskImg.naturalWidth > 0) {
      try {
        ctx.clearRect(0, 0, gridSize, gridSize)
        ctx.drawImage(loadedMaskImg, 0, 0, gridSize, gridSize)
        const pData = ctx.getImageData(0, 0, gridSize, gridSize).data
        let maskCount = 0
        for (let i = 0; i < gridSize * gridSize; i++) {
          const idx = i * 4
          const r = pData[idx]
          const g = pData[idx + 1]
          const b = pData[idx + 2]
          const a = pData[idx + 3]
          // UNet masks have color with opacity
          const isFg = a > 35 && (r > 75 || g > 75 || b > 75) && !(r === g && g === b && r < 45)
          if (isFg) {
            woundMask[i] = 1.0
            maskCount++
          }
        }
        if (maskCount >= 6) {
          hasValidMask = true
        }
      } catch (e) {
        // Fallback
      }
    }

    if (!hasValidMask && loadedRawImg && loadedRawImg.naturalWidth > 0) {
      try {
        ctx.clearRect(0, 0, gridSize, gridSize)
        ctx.drawImage(loadedRawImg, 0, 0, gridSize, gridSize)
        const pData = ctx.getImageData(0, 0, gridSize, gridSize).data

        // Default or detected wound hotspot (for Jay, ulcer is in lower-right region ~0.55, 0.58)
        const hsX = hotspot?.normalized_x ?? 0.55
        const hsY = hotspot?.normalized_y ?? 0.58

        for (let r = 0; r < gridSize; r++) {
          const v = r / (gridSize - 1)
          for (let c = 0; c < gridSize; c++) {
            const u = c / (gridSize - 1)
            const i = r * gridSize + c
            const idx = i * 4
            const red = pData[idx]
            const green = pData[idx + 1]
            const blue = pData[idx + 2]

            // Ulcer erythema index
            const erythema = Math.max(0, red - (green + blue) / 2) / 255.0
            const distToHs = Math.hypot(u - hsX, v - hsY)
            const spatialReach = Math.max(0, 1.0 - distToHs / 0.35)

            if (spatialReach > 0 && (erythema > 0.10 || (red < 70 && green < 70 && blue < 70))) {
              woundMask[i] = spatialReach * (0.6 + erythema * 1.4)
            }
          }
        }
        hasValidMask = true
      } catch (e) {
        // Fallback
      }
    }

    // Fallback if neither mask nor raw image could be sampled:
    // Anchor ulcer crater at realistic patient hotspot
    if (!hasValidMask) {
      const hsX = hotspot?.normalized_x ?? 0.55
      const hsY = hotspot?.normalized_y ?? 0.58
      for (let r = 0; r < gridSize; r++) {
        const v = r / (gridSize - 1)
        for (let c = 0; c < gridSize; c++) {
          const u = c / (gridSize - 1)
          const i = r * gridSize + c
          const d = Math.hypot((u - hsX) * 1.25, (v - hsY) * 0.95)
          if (d < 0.22) {
            woundMask[i] = Math.cos((d / 0.22) * (Math.PI / 2))
          }
        }
      }
    }

    // Distance transform to calculate depth inside wound margin
    const distField = new Float32Array(gridSize * gridSize)
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const i = r * gridSize + c
        if (woundMask[i] <= 0.05) {
          distField[i] = 0.0
          continue
        }
        let minDist = 999.0
        for (let dr = -6; dr <= 6; dr++) {
          const nr = r + dr
          if (nr < 0 || nr >= gridSize) {
            minDist = Math.min(minDist, Math.abs(dr))
            continue
          }
          for (let dc = -6; dc <= 6; dc++) {
            const nc = c + dc
            if (nc < 0 || nc >= gridSize || woundMask[nr * gridSize + nc] <= 0.05) {
              minDist = Math.min(minDist, Math.hypot(dr, dc))
            }
          }
        }
        distField[i] = minDist
      }
    }

    let maxDistVal = 0.001
    for (let i = 0; i < distField.length; i++) {
      if (distField[i] > maxDistVal) maxDistVal = distField[i]
    }

    // Build geometry attributes
    const vertices = []
    const uvs = []
    const colors = []
    const faces = []
    const depthGrid = Array.from({ length: gridSize }, () => new Float32Array(gridSize))

    let deepestR = Math.floor(gridSize * 0.58)
    let deepestC = Math.floor(gridSize * 0.55)
    let maxRecordedDepth = 0.0

    for (let r = 0; r < gridSize; r++) {
      const v = r / (gridSize - 1)
      const y = (v - 0.5) * heightMm

      for (let c = 0; c < gridSize; c++) {
        const u = c / (gridSize - 1)
        const x = (u - 0.5) * widthMm
        const i = r * gridSize + c

        let depth = 0.0
        if (distField[i] > 0) {
          const normDist = Math.min(1.0, distField[i] / maxDistVal)
          // Physiological concave crater bed curvature + granulated tissue roughness
          const microTexture = (Math.sin(c * 1.8) * Math.cos(r * 1.8) * 0.09)
          depth = maxD * Math.pow(normDist, 0.65) * (1.0 + microTexture)
          depth = Math.max(0.0, Math.min(maxD, depth))
        }

        depthGrid[r][c] = depth
        if (depth > maxRecordedDepth) {
          maxRecordedDepth = depth
          deepestR = r
          deepestC = c
        }

        const z = -depth
        vertices.push(x, y, z)
        uvs.push(u, 1.0 - v)

        const normZ = maxD > 0 ? Math.min(1.0, depth / maxD) : 0.0
        colors.push(normZ)
      }
    }

    // Build indexed faces
    for (let r = 0; r < gridSize - 1; r++) {
      for (let c = 0; c < gridSize - 1; c++) {
        const i0 = r * gridSize + c
        const i1 = i0 + 1
        const i2 = (r + 1) * gridSize + c
        const i3 = i2 + 1
        faces.push(i0, i2, i1, i1, i2, i3)
      }
    }

    // Extract true 1D cross-section transect passing through the deepest ulcer point
    if (onProfileGenerated) {
      const transectPoints = []
      for (let c = 0; c < gridSize; c++) {
        const xMm = Number(((c / (gridSize - 1)) * widthMm).toFixed(1))
        const dMm = Number(depthGrid[deepestR][c].toFixed(2))
        transectPoints.push({ x_mm: xMm, depth_mm: dMm })
      }
      onProfileGenerated(transectPoints)
    }

    return {
      grid_size: gridSize,
      width_mm: widthMm,
      height_mm: heightMm,
      vertices,
      uvs,
      colors,
      faces,
      deepestPoint: { r: deepestR, c: deepestC, depth: maxRecordedDepth }
    }
  }, [loadedMaskImg, loadedRawImg, hotspot, onProfileGenerated])

  // -------------------------------------------------------------
  // 2. Colormap Generator: Maps depth (0.0 to 1.0) to RGB
  //    Points outside crater (depth == 0) remain neutral medical carbon slate!
  // -------------------------------------------------------------
  const getElevationColor = (normDepth, scheme) => {
    const t = Math.max(0, Math.min(1, normDepth))

    // Healthy flat tissue / skin outside crater
    if (t <= 0.01) {
      return new THREE.Color(0.08, 0.12, 0.15) // Deep Slate / Medical Carbon baseline
    }

    if (scheme === 'thermal') {
      // JET Thermal Spectrum: Blue -> Cyan -> Yellow -> Red
      let r = 0, g = 0, b = 0
      if (t < 0.25) {
        r = 0
        g = t * 4
        b = 1
      } else if (t < 0.5) {
        r = 0
        g = 1
        b = 1 - (t - 0.25) * 4
      } else if (t < 0.75) {
        r = (t - 0.5) * 4
        g = 1
        b = 0
      } else {
        r = 1
        g = 1 - (t - 0.75) * 4
        b = 0
      }
      return new THREE.Color(r, g, b)
    } else if (scheme === 'rgb') {
      // Natural tissue bed: Granulation beefy red -> slough yellow -> necrotic core
      return new THREE.Color().lerpColors(
        new THREE.Color('#f4a261'),
        new THREE.Color('#881337'),
        t
      )
    } else {
      // Viridis: Purple -> Teal -> Green -> Bright Solar Yellow
      const color = new THREE.Color()
      if (t < 0.33) {
        color.lerpColors(new THREE.Color('#440154'), new THREE.Color('#21918c'), t / 0.33)
      } else if (t < 0.66) {
        color.lerpColors(new THREE.Color('#21918c'), new THREE.Color('#5ec962'), (t - 0.33) / 0.33)
      } else {
        color.lerpColors(new THREE.Color('#5ec962'), new THREE.Color('#fde725'), (t - 0.66) / 0.34)
      }
      return color
    }
  }

  // -------------------------------------------------------------
  // 3. Initialize Three.js Scene and Render Loop
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mountRef.current) return

    const container = mountRef.current
    const width = container.clientWidth || 500
    const height = container.clientHeight || 360

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, -32, 28)
    camera.lookAt(0, 0, -2)
    cameraRef.current = camera

    // WebGL Renderer with Local Clipping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.localClippingEnabled = true
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer

    container.replaceChildren(renderer.domElement)

    // Clipping Plane (Slices horizontally downward across Z)
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), sliceDepthMm)
    clipPlaneRef.current = clipPlane

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
    mainLight.position.set(20, -30, 40)
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6)
    fillLight.position.set(-20, 30, -10)
    scene.add(fillLight)

    const rimLight = new THREE.PointLight(0xaceba7, 1.0, 60)
    rimLight.position.set(0, 0, 15)
    scene.add(rimLight)

    // Master Group containing 3D Objects
    const masterGroup = new THREE.Group()
    scene.add(masterGroup)
    groupRef.current = masterGroup

    // Sub-surface grid reference plane at 0mm (Skin Surface)
    const gridHelper = new THREE.GridHelper(36, 18, 0x14b8a6, 0x223229)
    gridHelper.rotation.x = Math.PI / 2
    gridHelper.position.z = 0.05
    masterGroup.add(gridHelper)

    // 4.0mm Critical Fascial Depth Marker Plane (Transparent Red)
    const bonePlaneGeo = new THREE.PlaneGeometry(36, 36)
    const bonePlaneMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.10,
      side: THREE.DoubleSide,
      wireframe: true
    })
    const bonePlane = new THREE.Mesh(bonePlaneGeo, bonePlaneMat)
    bonePlane.position.z = -4.0 * depthExaggeration
    masterGroup.add(bonePlane)

    // Animation Render Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate)

      // Smooth camera orbit damping
      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.1
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.1
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.1

      if (isAutoRotate && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.006
      }

      if (groupRef.current) {
        groupRef.current.rotation.x = rotationRef.current.x
        groupRef.current.rotation.z = rotationRef.current.y
      }

      if (cameraRef.current) {
        cameraRef.current.position.set(
          0,
          -zoomRef.current * 0.75,
          zoomRef.current * 0.65
        )
        cameraRef.current.lookAt(0, 0, -2)
      }

      renderer.render(scene, camera)
    }
    animate()

    // Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // Wheel zoom
    const handleWheelNative = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const delta = e.deltaY * 0.04
      targetZoomRef.current = Math.max(16, Math.min(75, targetZoomRef.current + delta))
    }
    container.addEventListener('wheel', handleWheelNative, { passive: false })

    return () => {
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('wheel', handleWheelNative)
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
      renderer.dispose()
    }
  }, [])

  // -------------------------------------------------------------
  // 4. Rebuild Mesh Geometry when inputs, exaggeration or color scheme changes
  // -------------------------------------------------------------
  useEffect(() => {
    if (!groupRef.current) return

    const data = meshData && meshData.vertices && meshData.vertices.length > 0
      ? meshData
      : generateMorphologyMesh(44, maxDepthMm)

    const { vertices, faces } = data
    const numVertices = vertices.length / 3

    // Clean existing meshes
    if (meshRef.current) {
      groupRef.current.remove(meshRef.current)
      meshRef.current.geometry.dispose()
      meshRef.current.material.dispose()
      meshRef.current = null
    }
    if (wireframeRef.current) {
      groupRef.current.remove(wireframeRef.current)
      wireframeRef.current.geometry.dispose()
      wireframeRef.current.material.dispose()
      wireframeRef.current = null
    }
    if (pointsRef.current) {
      groupRef.current.remove(pointsRef.current)
      pointsRef.current.geometry.dispose()
      pointsRef.current.material.dispose()
      pointsRef.current = null
    }

    const geometry = new THREE.BufferGeometry()
    const posArray = new Float32Array(vertices.length)
    const colArray = new Float32Array(vertices.length)
    const uvArray = new Float32Array(numVertices * 2)

    const widthMm = data.width_mm || 36.0
    const heightMm = data.height_mm || 36.0

    for (let i = 0; i < numVertices; i++) {
      const idx = i * 3
      const x = vertices[idx]
      const y = vertices[idx + 1]
      const z = vertices[idx + 2] * depthExaggeration

      posArray[idx] = x
      posArray[idx + 1] = y
      posArray[idx + 2] = z

      if (data.uvs && data.uvs.length >= numVertices * 2) {
        uvArray[i * 2] = data.uvs[i * 2]
        uvArray[i * 2 + 1] = data.uvs[i * 2 + 1]
      } else {
        uvArray[i * 2] = Math.max(0, Math.min(1, (x / widthMm) + 0.5))
        uvArray[i * 2 + 1] = Math.max(0, Math.min(1, (y / heightMm) + 0.5))
      }

      const rawNormDepth = data.colors && data.colors.length > i ? data.colors[i] : (Math.abs(z / depthExaggeration) / (maxDepthMm || 1))
      const color = getElevationColor(rawNormDepth, colorScheme)

      colArray[idx] = color.r
      colArray[idx + 1] = color.g
      colArray[idx + 2] = color.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colArray, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2))

    if (faces && faces.length > 0) {
      geometry.setIndex(faces)
    }
    geometry.computeVertexNormals()

    // 1. Surface Mesh: Map Real Patient Photo Scan when NAT (rgb) mode is active and texture exists
    const isPhotoMapping = colorScheme === 'rgb' && Boolean(patientTexture)
    const surfaceMat = new THREE.MeshStandardMaterial({
      map: isPhotoMapping ? patientTexture : null,
      vertexColors: !isPhotoMapping,
      roughness: isPhotoMapping ? 0.40 : 0.35,
      metalness: 0.10,
      side: THREE.DoubleSide,
      clippingPlanes: clipPlaneRef.current ? [clipPlaneRef.current] : []
    })
    const surfaceMesh = new THREE.Mesh(geometry, surfaceMat)
    surfaceMesh.visible = renderMode === 'surface'
    groupRef.current.add(surfaceMesh)
    meshRef.current = surfaceMesh

    // 2. Wireframe Mesh
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: isPhotoMapping ? 0xaceba7 : undefined,
      vertexColors: !isPhotoMapping,
      wireframe: true,
      clippingPlanes: clipPlaneRef.current ? [clipPlaneRef.current] : []
    })
    const wireMesh = new THREE.Mesh(geometry, wireframeMat)
    wireMesh.visible = renderMode === 'wireframe'
    groupRef.current.add(wireMesh)
    wireframeRef.current = wireMesh

    // 3. Point Cloud
    const pointsMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 1.2,
      sizeAttenuation: true,
      clippingPlanes: clipPlaneRef.current ? [clipPlaneRef.current] : []
    })
    const pointsMesh = new THREE.Points(geometry, pointsMat)
    pointsMesh.visible = renderMode === 'points'
    groupRef.current.add(pointsMesh)
    pointsRef.current = pointsMesh

  }, [meshData, maxDepthMm, depthExaggeration, colorScheme, renderMode, patientTexture, generateMorphologyMesh])

  // -------------------------------------------------------------
  // 5. Update Clipping Plane Elevation
  // -------------------------------------------------------------
  useEffect(() => {
    if (clipPlaneRef.current) {
      clipPlaneRef.current.constant = sliceDepthMm * depthExaggeration
    }
  }, [sliceDepthMm, depthExaggeration])

  // -------------------------------------------------------------
  // 6. Interactive Mouse / Touch Handlers
  // -------------------------------------------------------------
  const handleMouseDown = (e) => {
    isDraggingRef.current = true
    prevMousePosRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return
    const deltaX = e.clientX - prevMousePosRef.current.x
    const deltaY = e.clientY - prevMousePosRef.current.y
    prevMousePosRef.current = { x: e.clientX, y: e.clientY }

    targetRotationRef.current.y += deltaX * 0.008
    targetRotationRef.current.x = Math.max(0.1, Math.min(1.4, targetRotationRef.current.x + deltaY * 0.008))
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  const handleResetCamera = () => {
    targetRotationRef.current = { x: 0.5, y: -0.6 }
    targetZoomRef.current = 42
  }

  const handleTopDownView = () => {
    targetRotationRef.current = { x: 0.05, y: 0.0 }
    targetZoomRef.current = 36
  }

  const handleZoomIn = () => {
    targetZoomRef.current = Math.max(16, targetZoomRef.current - 6)
  }

  const handleZoomOut = () => {
    targetZoomRef.current = Math.min(75, targetZoomRef.current + 6)
  }

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col ${className}`}>
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        className="w-full h-[340px] sm:h-[400px] md:h-[460px] lg:h-[480px] cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          isDraggingRef.current = false
        }}
      />

      {/* Top HUD: Spatial Metrology Badge & Real Scan Mapping */}
      {(() => {
        const isZeroDepth = Number(maxDepthMm) <= 0.05
        return (
          <>
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none z-10 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-teal-500/40 text-teal-300 flex items-center gap-1.5 shadow-lg">
                  <Box className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[11px] font-black uppercase tracking-wider font-mono">
                    {isZeroDepth ? '3D Epidermal Surface Metrology' : '3D Crater Metrology'}
                  </span>
                </div>

                {patientTexture && (
                  <div className="px-2.5 py-1 rounded-xl bg-amber-950/80 backdrop-blur-md border border-amber-500/50 text-amber-300 text-[10.5px] font-mono font-bold flex items-center gap-1.5 shadow-md">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Patient Scan Mapped</span>
                  </div>
                )}
              </div>

              {/* Dynamic Risk Tag */}
              <div className={`px-3 py-1 rounded-xl backdrop-blur-md border text-[11px] font-mono font-bold shadow-lg flex items-center gap-1.5 ${
                isZeroDepth
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : maxDepthMm >= 4.0 || depthClassification.includes("Bone")
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                  : 'bg-teal-950/80 border-teal-500/60 text-teal-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isZeroDepth ? 'bg-emerald-400' : maxDepthMm >= 4.0 ? 'bg-rose-500 animate-ping' : 'bg-teal-400'}`} />
                <span>{depthClassification}</span>
              </div>
            </div>

            {/* Bottom Floating Telemetry Overlay Cards */}
            <div className="absolute bottom-16 left-3.5 pointer-events-none z-10 flex flex-col gap-1.5">
              <div className="px-3 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 text-white shadow-xl flex items-center gap-3">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                    {isZeroDepth ? 'Max Surface Depth' : 'Max Crater Depth'}
                  </span>
                  <div className={`text-base font-black font-mono ${isZeroDepth ? 'text-emerald-400' : 'text-[#f43f5e]'}`}>
                    {Number(maxDepthMm).toFixed(1)} mm
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-700" />
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Excavated Volume</span>
                  <div className="text-base font-black font-mono text-teal-400">
                    {Number(woundVolumeCm3).toFixed(2)} cm³
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-700" />
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Mean Depth</span>
                  <div className="text-base font-black font-mono text-amber-400">
                    {Number(meanDepthMm).toFixed(1)} mm
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      })()}

      {/* Interactive Controls Floating Palette (Right Side) */}
      <div className="absolute top-16 right-3.5 flex flex-col gap-2 z-10 pointer-events-auto">
        {/* Render Mode Switcher */}
        <div className="p-1 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex flex-col gap-1 shadow-xl">
          <button
            onClick={() => setRenderMode('surface')}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              renderMode === 'surface'
                ? 'bg-[#0d9488] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Solid Shaded Surface"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRenderMode('wireframe')}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              renderMode === 'wireframe'
                ? 'bg-[#0d9488] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Topographic Wireframe Grid"
          >
            <Scan className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRenderMode('points')}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              renderMode === 'points'
                ? 'bg-[#0d9488] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Point Cloud Topology"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* Colormap Scheme Switcher */}
        <div className="p-1 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex flex-col gap-1 shadow-xl">
          <button
            onClick={() => setColorScheme('viridis')}
            className={`px-2 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer ${
              colorScheme === 'viridis' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
            title="Viridis Elevation Gradient"
          >
            VIR
          </button>
          <button
            onClick={() => setColorScheme('thermal')}
            className={`px-2 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer ${
              colorScheme === 'thermal' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
            title="Thermal Jet Sepsis Spectrum"
          >
            JET
          </button>
          <button
            onClick={() => setColorScheme('rgb')}
            className={`px-2 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer flex flex-col items-center ${
              colorScheme === 'rgb' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
            title="Real Patient Photo Scan Texture"
          >
            <span>NAT</span>
            <span className="text-[7.5px] font-sans opacity-90 uppercase tracking-tighter">Photo</span>
          </button>
        </div>

        {/* Camera Quick Buttons */}
        <div className="p-1 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex flex-col gap-1 shadow-xl">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl text-slate-400 hover:text-white text-xs transition-all cursor-pointer hover:bg-slate-800"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4 text-teal-400" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl text-slate-400 hover:text-white text-xs transition-all cursor-pointer hover:bg-slate-800"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4 text-teal-400" />
          </button>
          <div className="w-full h-px bg-slate-800 my-0.5" />
          <button
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
              isAutoRotate ? 'text-teal-400 bg-teal-950/60' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle 360° Auto-Rotation"
          >
            <RotateCw className={`w-4 h-4 ${isAutoRotate ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleTopDownView}
            className="p-2 rounded-xl text-slate-400 hover:text-white text-xs transition-all cursor-pointer"
            title="Top-Down Orthographic View"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCamera}
            className="p-2 rounded-xl text-slate-400 hover:text-white text-xs transition-all cursor-pointer"
            title="Reset Perspective Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Control Bar: Depth Slicing & Elevation Multiplier */}
      <div className="p-3.5 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3.5 items-center z-10">
        {/* Depth Slicing Plane Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 shrink-0">
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span>Depth Slice Plane:</span>
            <span className="font-mono text-teal-400 font-black">{sliceDepthMm.toFixed(1)} mm</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.2"
            value={sliceDepthMm}
            onChange={(e) => setSliceDepthMm(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
        </div>

        {/* Elevation Exaggeration Multiplier */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <span className="text-xs font-bold text-slate-400">Vertical Relief:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            {[1.0, 1.5, 2.0].map((scale) => (
              <button
                key={scale}
                onClick={() => setDepthExaggeration(scale)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  depthExaggeration === scale
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {scale}x
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Drag to Rotate • Scroll to Zoom
          </span>
        </div>
      </div>
    </div>
  )
}
