import { Canvas, useLoader } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { Suspense, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import PageMesh from './PageMesh'

function Scene({ frontSrc, backSrc, backTexOverride, progress, pageW, pageH, hingeRight, prevFlip }) {
  const backUrl = backTexOverride ? frontSrc : backSrc || frontSrc
  const [frontTex, backLoaded] = useLoader(THREE.TextureLoader, [frontSrc, backUrl])
  const backTex = backTexOverride || backLoaded

  useLayoutEffect(() => {
    for (const t of [frontTex, backTex].filter(Boolean)) {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
    }
  }, [frontTex, backTex])

  const camProps = useMemo(
    () =>
      prevFlip
        ? { left: -pageW, right: 0, top: pageH / 2, bottom: -pageH / 2 }
        : { left: 0, right: pageW, top: pageH / 2, bottom: -pageH / 2 },
    [pageW, pageH, prevFlip],
  )

  const groupScale = useMemo(() => {
    if (hingeRight) return [1, 1, 1]
    return prevFlip ? [-1, 1, 1] : [1, 1, 1]
  }, [hingeRight, prevFlip])

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 10]} near={0.1} far={50} {...camProps} />
      <ambientLight intensity={1.12} />
      <directionalLight position={[2, 4, 6]} intensity={0.38} />
      <group scale={groupScale}>
        <PageMesh
          frontTex={frontTex}
          backTex={backTex}
          progress={progress}
          pageW={pageW}
          pageH={pageH}
          hingeRight={Boolean(hingeRight)}
        />
      </group>
    </>
  )
}

export default function FlipEngine({
  active,
  direction,
  hingeRight,
  frontSrc,
  backSrc,
  backTexture,
  progress,
  widthPx,
  heightPx,
  className,
  style,
}) {
  const scale = 0.01
  const pageW = widthPx * scale
  const pageH = heightPx * scale
  const prevFlip = !hingeRight && direction === 'prev'

  if (!active || !frontSrc) return null

  const suspenseKey = `${frontSrc}|${backSrc || ''}|${backTexture?.uuid || 'n'}`

  return (
    <div className={className} style={{ ...style, pointerEvents: 'none' }}>
      <Canvas key={suspenseKey} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene
            frontSrc={frontSrc}
            backSrc={backSrc}
            backTexOverride={backTexture}
            progress={progress}
            pageW={pageW}
            pageH={pageH}
            hingeRight={Boolean(hingeRight)}
            prevFlip={prevFlip}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
