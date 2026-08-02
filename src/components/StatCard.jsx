import React from 'react'

export default function StatCard({ title, value, icon: Icon, color = 'whatsapp', loading = false }) {
  const colorClasses = {
    whatsapp: 'bg-green-50 text-whatsapp',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600'
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? (
              <span className="spinner inline-block"></span>
            ) : (
              value
            )}
          </p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={28} />
          </div>
        )}
      </div>
    </div>
  )
}