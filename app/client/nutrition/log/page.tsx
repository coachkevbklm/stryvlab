"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { NutritionLogContent } from "./NutritionLogContent"

function NutritionLogPageInner() {
  const router = useRouter()
  return (
    <NutritionLogContent
      onSuccess={() => router.push("/client/nutrition/journal")}
    />
  )
}

export default function NutritionLogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <NutritionLogPageInner />
    </Suspense>
  )
}
