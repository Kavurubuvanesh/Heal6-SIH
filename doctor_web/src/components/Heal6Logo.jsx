import React from 'react'
import logoAsset from '../assets/heal6_logo.png'

export default function Heal6Logo({ className = '', size = 'normal' }) {
  const heightClass =
    size === 'compact'
      ? 'h-10 md:h-12'
      : size === 'sidebar'
      ? 'h-18 md:h-22'
      : size === 'large'
      ? 'h-22 md:h-28'
      : size === 'small'
      ? 'h-11 md:h-12'
      : 'h-14 md:h-16'

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src={logoAsset}
        alt="Heal6 - Diabetic Foot Risk Analysis"
        className={`${heightClass} w-auto max-w-full object-contain drop-shadow-md`}
        loading="eager"
      />
    </div>
  )
}
