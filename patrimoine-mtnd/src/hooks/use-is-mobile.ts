// src/hooks/use-is-mobile.ts
import * as React from "react"

export const BREAKPOINTS = {
  MOBILE: 768,    // Below this width is considered mobile
  LARGE: 1024     // Above this width is considered large screen
}

export function useIsMobile() {
  const [windowSize, setWindowSize] = React.useState({
    isMobile: false,
    isLarge: false
  })

  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      setWindowSize({
        isMobile: width < BREAKPOINTS.MOBILE,
        isLarge: width >= BREAKPOINTS.LARGE
      })
    }

    checkDevice()
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  return windowSize
}