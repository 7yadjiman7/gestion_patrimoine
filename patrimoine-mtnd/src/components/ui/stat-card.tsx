import React from "react"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: number | string
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  description, 
  className 
}: StatCardProps) {
  const trendColor = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
  }

  return (
    <div className={cn(
      "bg-white rounded-xl shadow-sm p-6",
      className
    )}>
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-white">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
        {icon && (
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-lg">{icon}</span>
          </div>
        )}
      </div>
      {trend && (
        <div className={`flex items-center mt-3 text-sm ${trendColor[trend]}`}>
          {trend === 'up' && <ArrowUp className="h-4 w-4 mr-1" />}
          {trend === 'down' && <ArrowDown className="h-4 w-4 mr-1" />}
          <span>5% vs mois dernier</span>
        </div>
      )}
    </div>
  )
}
