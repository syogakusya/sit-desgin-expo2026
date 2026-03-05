"use client"

import { CSSProperties, useEffect, useRef } from "react"

type LensConfig = {
  x: number
  y: number
  radius: number
  refraction?: number
  depth?: number
  dispersion?: number
  frost?: number
  spread?: number
}

type CircularLensEffectProps = {
  width: number
  height: number
  textureSrc: string
  lens: LensConfig
  className?: string
  style?: CSSProperties
  opacity?: number
}

const vertexShaderSource = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const fragmentShaderSource = `
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_centerPx;
uniform float u_radiusPx;
uniform float u_refraction;
uniform float u_depth;
uniform float u_dispersion;
uniform float u_frost;
uniform float u_spreadPx;
uniform float u_opacity;

varying vec2 v_uv;

vec2 sampleUvFromIor(vec2 fragPx, vec2 delta, float radiusPx, float ior, float depthScale) {
  vec2 nxy = delta / max(radiusPx, 0.0001);
  float r2 = min(dot(nxy, nxy), 0.9999);
  float nz = sqrt(1.0 - r2);
  vec3 normal = normalize(vec3(nxy, nz));
  vec3 ray = refract(vec3(0.0, 0.0, -1.0), normal, 1.0 / max(ior, 1.0001));
  float edge = 1.0 - nz;
  float travel = (0.4 + edge * 1.95) * depthScale;
  vec2 offsetPx = ray.xy * radiusPx * travel;
  return (fragPx + offsetPx) / u_resolution;
}

void main() {
  vec2 fragPx = v_uv * u_resolution;
  vec2 delta = fragPx - u_centerPx;
  float distPx = length(delta);
  vec2 dir = distPx > 0.0 ? normalize(delta) : vec2(0.0);
  vec4 baseColor = texture2D(u_texture, v_uv);
  float rNorm = distPx / max(u_radiusPx, 0.0001);
  float spreadNorm = u_spreadPx / max(u_radiusPx, 0.0001);
  float insideMask = 1.0 - smoothstep(1.0, 1.05 + spreadNorm * 0.35, rNorm);
  float coreMask = 1.0 - smoothstep(0.0, 0.8, rNorm);
  float rimMask = 1.0 - smoothstep(0.0, 0.2 + spreadNorm * 0.38, abs(rNorm - 1.0));

  float iorBase = 1.1 + clamp(u_refraction, 0.0, 8.0) * 0.065;
  float depthScale = 0.65 + clamp(u_depth / 16.0, 0.0, 2.6);
  float dispersionScale = clamp(u_dispersion, 0.0, 8.0) * 0.012;
  vec2 uvR = sampleUvFromIor(fragPx, delta, u_radiusPx, iorBase - dispersionScale, depthScale);
  vec2 uvG = sampleUvFromIor(fragPx, delta, u_radiusPx, iorBase, depthScale);
  vec2 uvB = sampleUvFromIor(fragPx, delta, u_radiusPx, iorBase + dispersionScale, depthScale);
  vec3 refractedColor = vec3(
    texture2D(u_texture, uvR).r,
    texture2D(u_texture, uvG).g,
    texture2D(u_texture, uvB).b
  );

  vec2 normalXY = delta / max(u_radiusPx, 0.0001);
  float nLen2 = min(dot(normalXY, normalXY), 1.0);
  float normalZ = sqrt(max(0.0, 1.0 - nLen2));
  float f0 = pow((iorBase - 1.0) / (iorBase + 1.0), 2.0);
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - normalZ, 5.0);
  vec2 reflectUv = v_uv + normalXY * (0.02 + (1.0 - normalZ) * 0.05);
  vec3 reflection = mix(texture2D(u_texture, reflectUv).rgb, vec3(0.96, 0.98, 1.0), 0.52) * fresnel;

  float frost = clamp(u_frost / 26.0, 0.0, 0.42);
  vec2 blurOffset = vec2(max(0.35, u_frost * 0.35)) / u_resolution;
  vec3 frostBlur =
    texture2D(u_texture, uvG).rgb * 0.46 +
    texture2D(u_texture, uvG + vec2(blurOffset.x, 0.0)).rgb * 0.135 +
    texture2D(u_texture, uvG - vec2(blurOffset.x, 0.0)).rgb * 0.135 +
    texture2D(u_texture, uvG + vec2(0.0, blurOffset.y)).rgb * 0.135 +
    texture2D(u_texture, uvG - vec2(0.0, blurOffset.y)).rgb * 0.135;
  vec3 refractedWithFrost = mix(refractedColor, frostBlur, frost * (0.5 + coreMask * 0.5));

  vec2 lightDir = normalize(vec2(-0.58, -0.82));
  float rimSpec = pow(max(dot(dir, lightDir), 0.0), 18.0) * rimMask;
  float rimGlow = rimSpec * (0.1 + clamp(u_depth / 30.0, 0.0, 0.22));

  vec3 lensColor = refractedWithFrost + reflection * insideMask + vec3(rimGlow);
  float lensMix = clamp(insideMask * 0.94 + rimMask * 0.32, 0.0, 1.0);
  vec3 mixed = mix(baseColor.rgb, lensColor, lensMix);
  gl_FragColor = vec4(mixed, baseColor.a * u_opacity);
}
`

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) {
    return null
  }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader)
    if (fragmentShader) gl.deleteShader(fragmentShader)
    return null
  }

  const program = gl.createProgram()
  if (!program) {
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    return null
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  return program
}

export default function CircularLensEffect({
  width,
  height,
  textureSrc,
  lens,
  className,
  style,
  opacity = 1,
}: CircularLensEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width <= 0 || height <= 0) {
      return
    }

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    })
    if (!gl) {
      return
    }

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource)
    if (!program) {
      return
    }

    const positionLocation = gl.getAttribLocation(program, "a_position")
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution")
    const centerLocation = gl.getUniformLocation(program, "u_centerPx")
    const radiusLocation = gl.getUniformLocation(program, "u_radiusPx")
    const refractionLocation = gl.getUniformLocation(program, "u_refraction")
    const depthLocation = gl.getUniformLocation(program, "u_depth")
    const dispersionLocation = gl.getUniformLocation(program, "u_dispersion")
    const frostLocation = gl.getUniformLocation(program, "u_frost")
    const spreadLocation = gl.getUniformLocation(program, "u_spreadPx")
    const opacityLocation = gl.getUniformLocation(program, "u_opacity")
    const textureLocation = gl.getUniformLocation(program, "u_texture")

    const positionBuffer = gl.createBuffer()
    if (!positionBuffer) {
      gl.deleteProgram(program)
      return
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )

    const texture = gl.createTexture()
    if (!texture) {
      gl.deleteBuffer(positionBuffer)
      gl.deleteProgram(program)
      return
    }

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.activeTexture(gl.TEXTURE0)

    gl.useProgram(program)
    gl.uniform1i(textureLocation, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const image = new Image()
    // 変更理由: 静的アセットをR2ドメインへリダイレクトした場合、画像はクロスオリジン取得になります。
    // Canvas/WebGL へ転写するには CORS モードで読み込む必要があるため、src 設定前に anonymous を指定します。
    // （R2 側で Access-Control-Allow-Origin が許可されている前提）
    image.crossOrigin = "anonymous"
    image.decoding = "async"
    image.src = textureSrc

    const sourceCanvas = document.createElement("canvas")
    const sourceCtx = sourceCanvas.getContext("2d")
    if (!sourceCtx) {
      gl.deleteTexture(texture)
      gl.deleteBuffer(positionBuffer)
      gl.deleteProgram(program)
      return
    }

    let isDisposed : boolean = false
    let uploadedWidth : number = 0
    let uploadedHeight : number = 0

    const uploadTexture = (targetWidth: number, targetHeight: number) => {
      if (isDisposed || !image.complete) {
        return
      }
      if (uploadedWidth === targetWidth && uploadedHeight === targetHeight) {
        return
      }
      if (sourceCanvas.width !== targetWidth || sourceCanvas.height !== targetHeight) {
        sourceCanvas.width = targetWidth
        sourceCanvas.height = targetHeight
      }
      try {
        sourceCtx.clearRect(0, 0, targetWidth, targetHeight)
        sourceCtx.drawImage(image, 0, 0, targetWidth, targetHeight)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          sourceCanvas
        )
        uploadedWidth = targetWidth
        uploadedHeight = targetHeight
      } catch (error) {
        // 変更理由: CORS未許可時に `tainted canvas` 例外で描画ループが壊れるのを防ぐため、
        // 失敗時はこのフレームのアップロードを中断し、コンソールへ原因を明示します。
        console.error(
          "CircularLensEffect: failed to upload texture. Check R2 CORS and image cross-origin settings.",
          error
        )
      }
    }

    const render = () => {
      if (isDisposed) {
        return
      }

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const cssWidth = rect.width > 0 ? rect.width : width
      const cssHeight = rect.height > 0 ? rect.height : height
      const renderWidth = Math.max(1, Math.round(cssWidth * dpr))
      const renderHeight = Math.max(1, Math.round(cssHeight * dpr))
      uploadTexture(renderWidth, renderHeight)
      if (uploadedWidth !== renderWidth || uploadedHeight !== renderHeight) return
      const scaleX = renderWidth / width
      const scaleY = renderHeight / height
      const scale = (scaleX + scaleY) / 2

      if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
        canvas.width = renderWidth
        canvas.height = renderHeight
      }

      gl.viewport(0, 0, renderWidth, renderHeight)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

      gl.uniform2f(resolutionLocation, renderWidth, renderHeight)
      gl.uniform2f(centerLocation, lens.x * scaleX, lens.y * scaleY)
      gl.uniform1f(radiusLocation, lens.radius * scale)
      gl.uniform1f(refractionLocation, (lens.refraction ?? 5.6) * scale)
      gl.uniform1f(depthLocation, (lens.depth ?? 6.2) * scale)
      gl.uniform1f(dispersionLocation, (lens.dispersion ?? 1.4) * scale)
      gl.uniform1f(frostLocation, (lens.frost ?? 4.0) * scale)
      gl.uniform1f(spreadLocation, (lens.spread ?? 18.0) * scale)
      gl.uniform1f(opacityLocation, opacity)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    image.onload = () => {
      render()
    }
    if (image.complete) {
      render()
    }

    let resizeRaf: number | null = null

    const handleResize = () => {
      if (resizeRaf !== null) {
        return
      }
      resizeRaf = window.requestAnimationFrame(() => {
        resizeRaf = null
        render()
      })
    }

    window.addEventListener("resize", handleResize)

    return () => {
      isDisposed = true
      if (resizeRaf !== null) {
        window.cancelAnimationFrame(resizeRaf)
      }
      window.removeEventListener("resize", handleResize)
      gl.deleteTexture(texture)
      gl.deleteBuffer(positionBuffer)
      gl.deleteProgram(program)
    }
  }, [
    width,
    height,
    textureSrc,
    lens.x,
    lens.y,
    lens.radius,
    lens.refraction,
    lens.depth,
    lens.dispersion,
    lens.frost,
    lens.spread,
    opacity,
  ])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    />
  )
}
