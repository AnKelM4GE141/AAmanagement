'use client'

import React, {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react'

export interface SignatureCanvasHandle {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: () => string
  undo: () => void
}

interface SignatureCanvasProps {
  className?: string
  penColor?: string
  penWidth?: number
}

type Point = { x: number; y: number }

const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(
  ({ className = '', penColor = '#000000', penWidth = 3 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDrawingRef = useRef(false)
    const strokesRef = useRef<Point[][]>([])
    const currentStrokeRef = useRef<Point[]>([])

    const redrawAll = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.strokeStyle = penColor
      ctx.lineWidth = penWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      for (const stroke of strokesRef.current) {
        if (stroke.length < 2) continue
        ctx.beginPath()
        ctx.moveTo(stroke[0].x, stroke[0].y)
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y)
        }
        ctx.stroke()
      }
      ctx.restore()
    }, [penColor, penWidth])

    const resizeCanvas = useCallback(() => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      redrawAll()
    }, [redrawAll])

    useEffect(() => {
      resizeCanvas()
      const observer = new ResizeObserver(resizeCanvas)
      if (containerRef.current) {
        observer.observe(containerRef.current)
      }
      return () => observer.disconnect()
    }, [resizeCanvas])

    const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      if ('touches' in e) {
        const touch = e.touches[0]
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
      }
      return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in e) e.preventDefault()
      const point = getPoint(e)
      currentStrokeRef.current = [point]
      isDrawingRef.current = true

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.strokeStyle = penColor
      ctx.lineWidth = penWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(point.x, point.y)
      ctx.restore()
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in e) e.preventDefault()
      if (!isDrawingRef.current) return
      const point = getPoint(e)
      currentStrokeRef.current.push(point)

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.strokeStyle = penColor
      ctx.lineWidth = penWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const stroke = currentStrokeRef.current
      if (stroke.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(stroke[stroke.length - 2].x, stroke[stroke.length - 2].y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }
      ctx.restore()
    }

    const endDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in e) e.preventDefault()
      if (!isDrawingRef.current) return
      isDrawingRef.current = false
      if (currentStrokeRef.current.length > 0) {
        strokesRef.current = [...strokesRef.current, [...currentStrokeRef.current]]
      }
      currentStrokeRef.current = []
    }

    useImperativeHandle(ref, () => ({
      clear: () => {
        strokesRef.current = []
        currentStrokeRef.current = []
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      },
      isEmpty: () => strokesRef.current.length === 0,
      toDataURL: () => {
        return canvasRef.current?.toDataURL('image/png') || ''
      },
      undo: () => {
        strokesRef.current = strokesRef.current.slice(0, -1)
        redrawAll()
      },
    }))

    return (
      <div
        ref={containerRef}
        className={`relative ${className}`}
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
      </div>
    )
  }
)

SignatureCanvas.displayName = 'SignatureCanvas'

export default SignatureCanvas
