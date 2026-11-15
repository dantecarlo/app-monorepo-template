import { createElement, type ReactNode } from 'react'

interface ILinearGradientProps {
  accessibilityLabel?: string
  children?: ReactNode
  colors?: readonly string[]
}

// Renders the gradient as a DOM element that keeps its label and its colors,
// as `data-colors` JSON, so a test can read the stops it was given.
export const LinearGradient = ({
  accessibilityLabel,
  children,
  colors
}: ILinearGradientProps) =>
  createElement(
    'div',
    {
      'aria-label': accessibilityLabel,
      'data-colors': JSON.stringify(colors ?? [])
    },
    children
  )
