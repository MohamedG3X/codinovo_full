import React from 'react';

import { useEffect, useState } from 'react';
import { api, setToken } from '../lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ChartMonthly(){
  const [data, setData] = useState([]);
  useEffect(()=>{
    setToken(localStorage.getItem('api_token'));
    (async()=>{
      // naive: fetch last 7 days logs and group by day
      const today = new Date();
      const start = new Date(today); start.setDate(today.getDate()-6);
      const { data: logs } = await api.get(`/api/logs?limit=500`);
      const map = new Map();
      logs.data.forEach(l => {
        const d = new Date(l.createdAt || l.sentAt);
        if(d < start) return;
        const key = d.toISOString().slice(0,10);
        map.set(key, (map.get(key) || 0) + 1);
      });
      const arr = [];
      for(let i=6;i>=0;i--){
        const d = new Date(today); d.setDate(today.getDate()-i);
        const key = d.toISOString().slice(0,10);
        arr.push({ day: key.slice(5), messages: map.get(key) || 0 });
      }
      setData(arr);
    })();
  },[]);
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false}/>
          <Tooltip />
          <Line type="monotone" dataKey="messages" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
