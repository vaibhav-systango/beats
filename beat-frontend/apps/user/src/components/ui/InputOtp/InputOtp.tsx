'use client'

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useRef,
  type ComponentPropsWithoutRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'

import { cn } from '@beat/ui'

interface InputOTPContextValue {
  value: string
  maxLength: number
  activeIndex: number
  slots: Array<{
    char: string
    isActive: boolean
    hasFakeCaret: boolean
  }>
  inputProps: InputHTMLAttributes<HTMLInputElement>
}

const InputOTPContext = createContext<InputOTPContextValue | null>(null)

interface InputOTPProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  maxLength: number
  containerClassName?: string
  children?: ReactNode
}

export const InputOTP = forwardRef<HTMLInputElement, InputOTPProps>(
  (
    {
      value,
      onChange,
      maxLength,
      containerClassName,
      className,
      disabled,
      autoFocus,
      children,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const inputId = useId()
    const digits = value.replace(/\D/g, '').slice(0, maxLength)
    const activeIndex = Math.min(digits.length, maxLength - 1)

    const slots = Array.from({ length: maxLength }, (_, index) => ({
      char: digits[index] ?? '',
      isActive: !disabled && index === activeIndex,
      hasFakeCaret: !disabled && index === activeIndex && digits.length < maxLength,
    }))

    const setRef = (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value.replace(/\D/g, '').slice(0, maxLength))
    }

    const handleContainerClick = () => {
      inputRef.current?.focus()
    }

    return (
      <InputOTPContext.Provider
        value={{
          value: digits,
          maxLength,
          activeIndex,
          slots,
          inputProps: {
            id: inputId,
            value: digits,
            onChange: handleChange,
            disabled,
            autoFocus,
            inputMode: 'numeric',
            autoComplete: 'one-time-code',
            maxLength,
            ...props,
          },
        }}
      >
        <div
          className={cn(
            'relative flex items-center gap-2 has-[:disabled]:opacity-50',
            containerClassName
          )}
          onClick={handleContainerClick}
        >
          <input
            {...props}
            ref={setRef}
            id={inputId}
            type="text"
            value={digits}
            onChange={handleChange}
            disabled={disabled}
            autoFocus={autoFocus}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={maxLength}
            className={cn(
              'absolute inset-0 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed',
              className
            )}
            aria-label="One-time password"
          />
          {children}
        </div>
      </InputOTPContext.Provider>
    )
  }
)

InputOTP.displayName = 'InputOTP'

export const InputOTPGroup = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>(({ className, children, ...props }, ref) => {
  const context = useContext(InputOTPContext)

  return (
    <div ref={ref} className={cn('flex items-center', className)} {...props}>
      {context ? children : null}
    </div>
  )
})

InputOTPGroup.displayName = 'InputOTPGroup'

export const InputOTPSlot = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'> & { index: number }
>(({ index, className, ...props }, ref) => {
  const context = useContext(InputOTPContext)

  if (!context?.slots[index]) {
    return null
  }

  const { char, hasFakeCaret, isActive } = context.slots[index]

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        'relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md',
        isActive && 'z-10 ring-1 ring-ring',
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})

InputOTPSlot.displayName = 'InputOTPSlot'
