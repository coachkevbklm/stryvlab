"use client"

import { useEffect, useRef } from "react"
import { type CheckinFlow, type CheckinData, type FlowStep } from "@/lib/client/checkin/flows"
import { type ChatMessage, type InteractiveMetadata } from "@/components/client/ChatBubble"

export interface CheckinFlowHandle {
  handleInteract: (messageId: string, key: string, value: number) => void
  handleSkip: (messageId: string, key: string) => void
}

interface ActiveCheckinFlowProps {
  flow: CheckinFlow
  hasSessionToday: boolean
  clientFirstName?: string | null
  onAddMessage: (msg: ChatMessage) => void
  onUpdateMessage: (id: string, metaPatch: Partial<InteractiveMetadata>) => void
  onComplete: (data: CheckinData, summary: string, flowType: 'morning' | 'evening') => void
  onHandle: (h: CheckinFlowHandle) => void
}

function makeId() {
  return `flow-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function buildInteractiveMessage(step: FlowStep): ChatMessage {
  const meta: InteractiveMetadata = {
    component: step.component,
    key: step.key,
    question: step.question,
    options: step.options,
    min: step.min,
    max: step.max,
    step: step.step,
    unit: step.unit,
    optional: step.optional,
    answered: false,
  }
  return {
    id: makeId(),
    role: 'assistant',
    content: step.question,
    message_type: 'interactive',
    metadata: meta,
    created_at: new Date().toISOString(),
  }
}

export function ActiveCheckinFlow({
  flow,
  hasSessionToday,
  clientFirstName,
  onAddMessage,
  onUpdateMessage,
  onComplete,
  onHandle,
}: ActiveCheckinFlowProps) {
  const collectedRef = useRef<Record<string, number>>({})
  const stepIndexRef = useRef(0)

  function getVisibleSteps(): FlowStep[] {
    const ctx = { ...collectedRef.current, __has_session_today: hasSessionToday ? 1 : 0 }
    return flow.steps.filter(s => !s.condition || s.condition(ctx))
  }

  function addNextStep() {
    const visibleSteps = getVisibleSteps()
    const idx = stepIndexRef.current

    if (idx >= visibleSteps.length) {
      // All steps done — build CheckinData + summary
      const c = collectedRef.current
      const data: CheckinData = {}
      if (c.sleep_hours     !== undefined) data.sleep_hours     = c.sleep_hours
      if (c.sleep_quality   !== undefined) data.sleep_quality   = c.sleep_quality
      if (c.energy_level    !== undefined) data.energy_level    = c.energy_level
      if (c.stress_level    !== undefined) data.stress_level    = c.stress_level
      if (c.weight_kg       !== undefined) data.weight_kg       = c.weight_kg
      if (c.hunger_level    !== undefined) data.hunger_level    = c.hunger_level
      if (c.muscle_soreness !== undefined) data.muscle_soreness = c.muscle_soreness

      const parts: string[] = []
      if (data.sleep_hours    != null) parts.push(`Sommeil: ${data.sleep_hours}h`)
      if (data.sleep_quality  != null) parts.push(`qualité ${data.sleep_quality}/4`)
      if (data.energy_level   != null) parts.push(`énergie ${data.energy_level}/5`)
      if (data.stress_level   != null) parts.push(`stress ${data.stress_level}/5`)
      if (data.weight_kg      != null) parts.push(`poids ${data.weight_kg}kg`)
      if (data.hunger_level   != null) parts.push(`faim ${data.hunger_level}/4`)
      if (data.muscle_soreness != null) parts.push(`courbatures ${data.muscle_soreness}/4`)

      const label = flow.type === 'morning' ? 'matin' : 'soir'
      const summary = `Check-in ${label} — ${parts.join(', ')}`
      onComplete(data, summary, flow.type)
      return
    }

    onAddMessage(buildInteractiveMessage(visibleSteps[idx]))
  }

  // Build the handle once and expose it via onHandle
  const handle: CheckinFlowHandle = {
    handleInteract(messageId, key, value) {
      onUpdateMessage(messageId, { answered: true })
      collectedRef.current[key] = value

      // Display label for user bubble
      const visibleSteps = getVisibleSteps()
      const step = visibleSteps.find(s => s.key === key)
      let display = String(value)
      if (step?.component === 'chips') {
        const opt = step.options?.find(o => o.value === value)
        display = opt ? `${opt.emoji ?? ''} ${opt.label}`.trim() : display
      } else if (step?.unit) {
        display = `${value}${step.unit}`
      }

      onAddMessage({
        id: makeId(),
        role: 'user',
        content: display,
        message_type: 'quick_reply',
        created_at: new Date().toISOString(),
      })

      stepIndexRef.current += 1
      setTimeout(() => addNextStep(), 400)
    },

    handleSkip(messageId, _key) {
      onUpdateMessage(messageId, { answered: true })
      onAddMessage({
        id: makeId(),
        role: 'user',
        content: 'Passer',
        message_type: 'quick_reply',
        created_at: new Date().toISOString(),
      })
      stepIndexRef.current += 1
      setTimeout(() => addNextStep(), 400)
    },
  }

  // Start the flow on mount
  useEffect(() => {
    onHandle(handle)

    const greeting: ChatMessage = {
      id: makeId(),
      role: 'assistant',
      content: clientFirstName
        ? `${clientFirstName}, ${flow.greeting}`
        : flow.greeting,
      message_type: 'text',
      created_at: new Date().toISOString(),
    }
    onAddMessage(greeting)
    setTimeout(() => addNextStep(), 600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update handle reference whenever deps change
  useEffect(() => {
    onHandle(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSessionToday])

  return null
}
