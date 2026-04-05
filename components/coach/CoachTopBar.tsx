'use client'

import React from 'react'
import { Menu, Bell } from 'lucide-react'

interface CoachTopBarProps {
  tabs: Array<{ key: string; label: string; Icon: React.ElementType }>
  activeTab: string
  onTabChange: (key: string) => void
  clientName?: string
  clientInitial?: string
}

export default function CoachTopBar({
  tabs,
  activeTab,
  onTabChange,
  clientName,
  clientInitial = 'S',
}: CoachTopBarProps) {
  return (
    <header className="sticky top-0 z-50 h-11 bg-[#343434] flex items-center px-3 gap-1 shrink-0">
      {/* Logo pill */}
      <div className="w-7 h-7 rounded-full bg-[#FEFEFE] flex items-center justify-center mr-2">
        <span className="text-xs font-bold text-[#1A1A1A]">S</span>
      </div>
      <div className="w-px h-4 bg-white/10 mx-2" />

      {/* Nav items — tabs horizontales */}
      <nav className="flex items-center gap-0.5 flex-1">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all font-medium ${
              activeTab === key
                ? 'bg-[#FCF76E] text-[#1A1A1A] font-semibold'
                : 'text-[#FEFEFE] hover:bg-white/10'
            }`}
            title={label}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>

      {/* Actions droite */}
      <div className="flex items-center gap-2 ml-auto">
        <button className="text-white/60 hover:text-white transition-colors p-1">
          <Menu size={16} />
        </button>
        <button className="text-white/60 hover:text-white transition-colors p-1">
          <Bell size={16} />
        </button>
        <div className="w-7 h-7 rounded-full bg-[#D8D7CE] overflow-hidden shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
            {clientInitial}
          </div>
        </div>
      </div>
    </header>
  )
}
