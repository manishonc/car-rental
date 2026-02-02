"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface StepperProps {
  currentStep: number
  steps: Array<{ label: string; description?: string }>
  onStepClick?: (step: number) => void
  className?: string
  maxCompletedStep?: number
}

export function Stepper({
  currentStep,
  steps,
  onStepClick,
  className,
  maxCompletedStep = 0
}: StepperProps) {
  const progress = (currentStep / steps.length) * 100

  return (
    <div
      className={cn(
        "stepper-glass p-4 rounded-2xl shadow-sm border border-slate-200/50 inline-flex flex-col items-start shrink-0",
        className
      )}
      role="navigation"
      aria-label="Booking progress"
    >
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        Step {currentStep} of {steps.length}
      </span>
      <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label={`Step ${currentStep} of ${steps.length}: ${steps[currentStep - 1]?.label}`}
        />
      </div>
    </div>
  )
}
