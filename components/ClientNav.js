'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import BottomNav from './BottomNav'

export default function ClientNav() {
    const pathname = usePathname()
    const [hidden, setHidden] = useState(false)

    // Listen for modal open/close events from any page
    useEffect(() => {
        const hide = () => setHidden(true)
        const show = () => setHidden(false)
        window.addEventListener('nav:hide', hide)
        window.addEventListener('nav:show', show)
        return () => {
            window.removeEventListener('nav:hide', hide)
            window.removeEventListener('nav:show', show)
        }
    }, [])

    // Always hide on onboarding or immersive modes
    if (pathname === '/onboarding' || pathname.startsWith('/workout/') || pathname.startsWith('/template/')) return null

    // Hide when modal is open
    if (hidden) return null

    return <BottomNav />
}
