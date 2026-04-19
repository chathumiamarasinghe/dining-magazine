import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const vert = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalView;
varying float vEdge;

uniform float uProgress;
uniform vec2 uDimensions;
uniform float uHingeX;

void main() {
  vUv = uv;
  vec3 pos = position;
  float w = uDimensions.x;
  float h = uDimensions.y;

  float curlAngle = uProgress * 3.14159265;
  float radius = mix(3.0, 0.85, uProgress);
  float x = pos.x - uHingeX;
  pos.z = sin(curlAngle) * radius * (x / w);
  pos.x = uHingeX + cos(curlAngle) * x;

  float n = sin(pos.x * 91.0 + pos.y * 73.0 + uProgress * 6.28318);
  pos += normal * n * 0.0045;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vec3 nn = normalize(normalMatrix * normal);
  vNormalView = nn;
  vEdge = abs(nn.x);
  gl_Position = projectionMatrix * mv;
}
`

const frag = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalView;
varying float vEdge;

uniform sampler2D uFront;
uniform sampler2D uBack;
uniform float uProgress;

void main() {
  vec4 cFront = texture2D(uFront, vUv);
  vec4 cBack = texture2D(uBack, vUv) * vec4(0.78, 0.76, 0.82, 1.0);
  vec4 c = gl_FrontFacing ? cFront : cBack;

  float paper = smoothstep(0.55, 0.95, vEdge);
  float mid = smoothstep(0.32, 0.68, uProgress) * (1.0 - smoothstep(0.68, 0.92, uProgress));
  vec3 edgeCol = vec3(0.91, 0.86, 0.78);
  c.rgb = mix(c.rgb, edgeCol, paper * mid * 0.85);

  float rim = smoothstep(0.35, 1.0, 1.0 - abs(vNormalView.z)) * 0.14;
  c.rgb *= 1.0 - rim;
  c.rgb *= 0.92 + 0.08 * abs(vNormalView.z);
  gl_FragColor = c;
}
`

function makeCreamDataTexture() {
  const data = new Uint8Array([245, 238, 228, 255, 238, 230, 218, 255, 238, 230, 218, 255, 245, 238, 228, 255])
  const tex = new THREE.DataTexture(data, 2, 2, THREE.RGBAFormat)
  tex.needsUpdate = true
  tex.colorSpace = THREE.SRGBColorSpace
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearFilter
  return tex
}

export default function PageMesh({ frontTex, backTex, progress, pageW, pageH, hingeRight }) {
  const meshRef = useRef(null)
  const cream = useMemo(() => makeCreamDataTexture(), [])

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uDimensions: { value: new THREE.Vector2(pageW, pageH) },
      uHingeX: { value: hingeRight ? pageW : 0 },
      uFront: { value: cream },
      uBack: { value: cream },
    }),
    [cream, pageW, pageH, hingeRight],
  )

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(pageW, pageH, 50, 50)
    g.translate(pageW / 2, 0, 0)
    return g
  }, [pageW, pageH])

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: vert,
        fragmentShader: frag,
        side: THREE.DoubleSide,
      }),
    [uniforms],
  )

  useLayoutEffect(
    () => () => {
      geom.dispose()
      mat.dispose()
    },
    [geom, mat],
  )

  useFrame(() => {
    const m = meshRef.current?.material
    if (!m || !m.uniforms) return
    m.uniforms.uProgress.value = progress
    m.uniforms.uDimensions.value.set(pageW, pageH)
    m.uniforms.uHingeX.value = hingeRight ? pageW : 0
    m.uniforms.uFront.value = frontTex || cream
    m.uniforms.uBack.value = backTex || cream
  })

  return <mesh ref={meshRef} geometry={geom} material={mat} position={[0, 0, 0.02]} />
}
