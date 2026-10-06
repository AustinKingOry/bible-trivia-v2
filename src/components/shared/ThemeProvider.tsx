'use client'
import { ThemeProvider as NextThemes, type ThemeProviderProps } from 'next-themes'
export function ThemeProvider(props: ThemeProviderProps) { return <NextThemes {...props} /> }
