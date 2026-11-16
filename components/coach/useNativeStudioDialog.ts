'use client'

import { useEffect, useRef, type RefObject } from 'react'

export interface UseNativeStudioDialogOptions {
  lightDismiss?: boolean
}

/**
 * Manages a native modal `<dialog>` lifecycle (`showModal()`, `returnValue` reset on `close`,
 * React 19 StrictMode `close`-event race guard, and pointer-coordinate `closedby="any"`
 * light-dismiss fallback for browsers lacking `HTMLDialogElement.prototype.closedBy`).
 */
export function useNativeStudioDialog(
  dialogRef: RefObject<HTMLDialogElement | null>,
  isOpen: boolean,
  onClose: () => void,
  options?: UseNativeStudioDialogOptions
): void {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const lightDismiss = options?.lightDismiss ?? true

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (!isOpen) {
      if (dialog.open) {
        try {
          dialog.close()
        } catch {
          // Ignore if detached
        }
      }
      return
    }

    if (!dialog.open) {
      try {
        dialog.showModal()
      } catch {
        // Ignore if already open or detached during rapid unmount
      }
    }

    const handleClose = () => {
      // Guard against stale queued 'close' events in React StrictMode remounts
      if (dialog.open) return
      dialog.returnValue = ''
      onCloseRef.current()
    }

    dialog.addEventListener('close', handleClose)

    let removeFallbackListeners: (() => void) | null = null
    if (
      lightDismiss &&
      typeof HTMLDialogElement !== 'undefined' &&
      !('closedBy' in HTMLDialogElement.prototype)
    ) {
      const outside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect()
        return (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
      }
      let pressedOutside = false
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = outside(e)
      }
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && outside(e)) {
          dialog.close()
        }
        pressedOutside = false
      }
      dialog.addEventListener('pointerdown', onPointerDown)
      dialog.addEventListener('pointerup', onPointerUp)
      removeFallbackListeners = () => {
        dialog.removeEventListener('pointerdown', onPointerDown)
        dialog.removeEventListener('pointerup', onPointerUp)
      }
    }

    return () => {
      dialog.removeEventListener('close', handleClose)
      removeFallbackListeners?.()
    }
  }, [dialogRef, isOpen, lightDismiss])
}
