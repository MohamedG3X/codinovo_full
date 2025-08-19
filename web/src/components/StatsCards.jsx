import React from 'react';


export default function StatsCards({ stats }){
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 border rounded">
        <div className="text-sm text-gray-500">This Month Messages</div>
        <div className="text-3xl font-semibold">{stats.count || 0}</div>
      </div>
      <div className="p-4 border rounded">
        <div className="text-sm text-gray-500">This Month Cost</div>
        <div className="text-3xl font-semibold">${(stats.cost || 0).toFixed(2)}</div>
      </div>
      <div className="p-4 border rounded">
        <div className="text-sm text-gray-500">Average Cost / Msg</div>
        <div className="text-3xl font-semibold">${stats.count ? (stats.cost / stats.count).toFixed(3) : '0.000'}</div>
      </div>
    </div>
  );
}
