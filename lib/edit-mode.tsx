'use client'

import { useState, useEffect } from 'react'

/**
 * Secret key for enabling edit mode
 * Change this to your own secret value
 */
// Unified edit mode secret token. Activate edit mode via ?edit=admin in URL.
// Backward compatibility: accept legacy 'admin2025' token if already bookmarked.
const EDIT_MODE_SECRET = 'admin'

/**
 * Hook to check if edit mode is enabled
 * Usage: const { isEditMode, editModeParam } = useEditMode()
 * Works client-side only to avoid SSR issues
 */
export function useEditMode() {
  const [isEditMode, setIsEditMode] = useState(false)
  
  useEffect(() => {
    // Only runs on client-side
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
  const editParam = params.get('edit')
  setIsEditMode(editParam === EDIT_MODE_SECRET || editParam === 'admin2025')
    }
  }, [])

  return { isEditMode, editModeParam: EDIT_MODE_SECRET }
}

/**
 * Helper to add edit mode parameter to URL
 * Usage: const url = withEditMode('/knowledge-bases/123')
 */
export function withEditMode(path: string, currentParams?: URLSearchParams): string {
  const url = new URL(path, window.location.origin)
  
  // Preserve existing params
  if (currentParams) {
    currentParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })
  }
  
  // Check if edit mode is active in current URL
  const currentEditParam = new URLSearchParams(window.location.search).get('edit')
  if (currentEditParam === EDIT_MODE_SECRET || currentEditParam === 'admin2025') {
    url.searchParams.set('edit', EDIT_MODE_SECRET)
  }
  
  return url.pathname + url.search
}

/**
 * Helper to get current search params with edit mode preserved
 */
export function useEditModeParams(): URLSearchParams {
  const [params, setParams] = useState(new URLSearchParams())
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setParams(new URLSearchParams(window.location.search))
    }
  }, [])
  
  return params
}
