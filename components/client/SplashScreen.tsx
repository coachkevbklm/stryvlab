"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const HOLD_MS  = 800
const TOTAL_MS = 300 + HOLD_MS + 500 // fade-in + hold + fade-out

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem("stryvr_splash_seen")) return
    sessionStorage.setItem("stryvr_splash_seen", "1")
    setVisible(true)
    const t = setTimeout(() => setVisible(false), TOTAL_MS)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#0d0d0d",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }}
        >
          {/* Logo — fichier réel, pas de bidouille SVG */}
          <motion.div
            initial={{ opacity: 0, scale: 0.84 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
          >
            <Image
              src="/logo/Logo STRYVR.svg"
              alt="STRYVR"
              width={88}
              height={88}
              priority
            />
          </motion.div>

          {/* Loading bar */}
          <motion.div
            style={{
              marginTop: 36,
              width: 44,
              height: 2,
              borderRadius: 99,
              background: "rgba(255,255,255,0.07)",
              overflow: "hidden",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.2 } }}
          >
            <motion.div
              style={{ height: "100%", background: "#f2f2f2", borderRadius: 99, originX: 0 }}
              initial={{ scaleX: 0 }}
              animate={{
                scaleX: 1,
                transition: { delay: 0.25, duration: (HOLD_MS / 1000) + 0.1, ease: "linear" },
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
