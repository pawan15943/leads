"use client"

import { ReactNode } from "react"

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
  illustration?: "default" | "search" | "folder" | "users"
}

const illustrations = {
  default: (
    <svg viewBox="0 0 240 180" className="w-full max-w-[220px] h-auto text-muted-foreground" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="empty-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect x="40" y="25" width="160" height="130" rx="12" fill="url(#empty-bg)" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="6 4" />
      <path d="M70 55h100M70 75h80M70 95h60" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="120" cy="125" r="28" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M120 115v20M110 125h20" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 240 180" className="w-full max-w-[220px] h-auto text-muted-foreground" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="95" cy="85" r="50" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" fill="currentColor" fillOpacity="0.06" />
      <path d="M135 125l30 30" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="120" cy="125" r="28" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 240 180" className="w-full max-w-[220px] h-auto text-muted-foreground" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M35 55h45l20-20h85v100H35V55z" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <rect x="55" y="85" width="90" height="10" rx="3" fill="currentColor" fillOpacity="0.2" />
      <rect x="55" y="108" width="70" height="10" rx="3" fill="currentColor" fillOpacity="0.15" />
      <rect x="55" y="131" width="80" height="10" rx="3" fill="currentColor" fillOpacity="0.1" />
      <circle cx="140" cy="140" r="22" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M140 132v16M132 140h16" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 240 180" className="w-full max-w-[220px] h-auto text-muted-foreground" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="95" cy="65" r="30" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" fill="currentColor" fillOpacity="0.08" />
      <circle cx="145" cy="65" r="30" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" fill="currentColor" fillOpacity="0.08" />
      <path d="M50 145c0-25 20-45 45-45s45 20 45 45" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <path d="M145 100c25 0 45 20 45 45" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <circle cx="120" cy="125" r="26" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M120 115v20M110 125h20" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
}

export function EmptyState({ title, description, action, illustration = "default" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="mb-4 flex justify-center [&_svg]:max-h-[100px]">
        {illustrations[illustration]}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-4">{description}</p>
      {action}
    </div>
  )
}
