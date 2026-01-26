"use client"

import * as React from "react"
import { Check, ChevronRight } from "lucide-react"
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
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber <= maxCompletedStep
          const isActive = stepNumber === currentStep
          const isPending = stepNumber > currentStep && stepNumber > maxCompletedStep + 1
          const isClickable = (stepNumber <= currentStep || stepNumber <= maxCompletedStep + 1) && onStepClick

          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center flex-1">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(stepNumber)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    isCompleted && !isActive && "bg-primary border-primary text-primary-foreground",
                    isActive && "bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/25",
                    isPending && "bg-muted border-muted-foreground/20 text-muted-foreground",
                    !isCompleted && !isActive && !isPending && "bg-background border-primary/50 text-primary",
                    isClickable && "cursor-pointer hover:scale-105 hover:shadow-md",
                    !isClickable && "cursor-default"
                  )}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Step ${stepNumber}: ${step.label}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
                >
                  {isCompleted && !isActive ? (
                    <Check className="w-5 h-5" strokeWidth={2.5} />
                  ) : (
                    <span className="text-sm font-bold">{stepNumber}</span>
                  )}
                </button>
                <div className="mt-3 text-center">
                  <div
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isActive && "text-primary",
                      isCompleted && !isActive && "text-foreground",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className={cn(
                      "text-xs mt-0.5 transition-colors",
                      isActive ? "text-primary/70" : "text-muted-foreground"
                    )}>
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 flex items-center justify-center px-2">
                  <div
                    className={cn(
                      "h-0.5 w-full transition-colors rounded-full",
                      stepNumber < currentStep || stepNumber <= maxCompletedStep 
                        ? "bg-primary" 
                        : "bg-muted-foreground/20"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              "bg-primary text-primary-foreground font-bold text-sm"
            )}>
              {currentStep}
            </div>
            <div>
              <p className="font-medium text-sm">{steps[currentStep - 1]?.label}</p>
              <p className="text-xs text-muted-foreground">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>
          {currentStep < steps.length && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <span>Next: {steps[currentStep]?.label}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber <= maxCompletedStep
            const isActive = stepNumber === currentStep
            const isClickable = (stepNumber <= currentStep || stepNumber <= maxCompletedStep + 1) && onStepClick

            return (
              <button
                key={stepNumber}
                type="button"
                onClick={() => isClickable && onStepClick(stepNumber)}
                disabled={!isClickable}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  isActive && "w-4 bg-primary",
                  isCompleted && !isActive && "bg-primary",
                  !isCompleted && !isActive && "bg-muted-foreground/30",
                  isClickable && "cursor-pointer"
                )}
                aria-label={`Go to step ${stepNumber}: ${step.label}`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
