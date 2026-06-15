"use client"

import { useState, useRef, useEffect, useCallback } from "react"

const MIN_WIDTH = 180
const MAX_WIDTH = 420

export function useResizableSidebar(storageKey: string, defaultWidth: number) {
  const [width, setWidth] = useState(defaultWidth)
  const widthRef = useRef(defaultWidth)
  const dragging = useRef(false)

  useEffect(() => {
    const stored = Number(localStorage.getItem(storageKey))
    if (stored >= MIN_WIDTH && stored <= MAX_WIDTH) {
      widthRef.current = stored
      setWidth(stored)
    }
  }, [storageKey])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current) return
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX))
      widthRef.current = next
      setWidth(next)
    }
    function onUp() {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      localStorage.setItem(storageKey, String(widthRef.current))
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [storageKey])

  const startResize = useCallback(() => {
    dragging.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [])

  return { width, startResize }
}
