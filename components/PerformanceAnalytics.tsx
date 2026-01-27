
import React, { useState, useEffect } from 'react';

export const PerformanceAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'users'>('overview');
  
  // Mock performance data
  const metrics = {
    totalGenerations: 4281,
    activeUsers: 842,
    avgLatency: '3.8s',
    successRate: '99.6%',
    creditsIssued: 125000,
    topModel: 'Gemini 3 Pro',
    peakConcurrent: 45
  };

  const modelMetrics = [
    { name: 'Gemini 3 Pro', usage: 65, latency: '4.5s', status: 'Optimal' },
    { name: 'Gemini 3 Flash', usage: 20, latency: '1.2s', status: 'Fast' },
    { name: 'Veo 3.1 Fast', usage: 10, latency: '12s', status: 'Stable' },
    { name: 'Veo 3.1 Pro', usage: 5, latency: '28s', status: 'Busy' },
  ];

  const logs = [
    { id: 1, event: 'Poster Gen', user: 'user_982', status: 'Success', time: '2s ago' },
    { id: 2, event: 'Video Synth', user: 'bubblesfox', status: 'Success', time: '12s ago' },
    { id: 3, event: 'Auth Token', user: 'system', status: 'Info', time: '1m ago' },
    { id: 4, event: 'Comic Stitch', user: 'user_412', status: 'Failed', time: '2m ago' },
  ];

  const distribution = [
    { label: 'Posters', value: 45, color: 'bg-indigo-500' },
    { label: 'Videos', value: 30, color: 'bg-purple-500' },
    { label: 'Comics', value: 15, color: 'bg-emerald-500' },
    { label: 'Other', value: 10, color: 'bg-zinc-500' },
  ];

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-8">
        <div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight text-white font-cinematic uppercase tracking-widest">Admin Dashboard</h2>
          <p className="text-zinc-400 uppercase text-[10px] font-black tracking-widest">System Performance & Vital Records • bubblesfox@gmail.com</p>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800 shadow-xl">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500'}`}>Overview</button>
          <button onClick={() => setActiveTab('models')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'models' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500'}`}>Models</button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500'}`}>User Base</button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard label="Total Production" value={metrics.totalGenerations.toString()} trend="+12%" icon="🚀" />
            <StatCard label="Avg. Latency" value={metrics.avgLatency} trend="Stable" icon="⏱️" />
            <StatCard label="Success Rate" value={metrics.successRate} trend="High" icon="✅" />
            <StatCard label="Credits Flow" value="125K" trend="+5K" icon="🪙" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-8">Workload Distribution</h3>
                <div className="space-y-6">
                  {distribution.map(d => (
                    <div key={d.label} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-zinc-400">{d.label}</span>
                        <span className="text-white">{d.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full ${d.color} transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.3)]`} style={{ width: `${d.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Real-Time Production Feed</h3>
                <div className="space-y-3">
                   {logs.map(log => (
                     <div key={log.id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center gap-4">
                           <div className={`w-2 h-2 rounded-full ${log.status === 'Success' ? 'bg-green-500' : log.status === 'Failed' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                           <div>
                              <p className="text-xs font-bold text-white uppercase tracking-tight">{log.event}</p>
                              <p className="text-[9px] text-zinc-500 uppercase font-bold">BY: {log.user}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-zinc-600">{log.time}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-[2.5rem] shadow-2xl text-white overflow-hidden relative group">
                 <div className="absolute -right-4 -top-4 text-9xl opacity-10 group-hover:rotate-12 transition-transform duration-700">⚙️</div>
                 <h3 className="text-xl font-cinematic tracking-widest mb-6 uppercase">System Health</h3>
                 <div className="space-y-6 relative z-10">
                    <HealthItem label="Inference Engine" status="Online" color="bg-green-400" />
                    <HealthItem label="Storage Cluster" status="Optimal" color="bg-green-400" />
                    <HealthItem label="Safety Filter V2" status="Active" color="bg-indigo-400" />
                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-[9px] font-black uppercase tracking-widest transition-all mt-4">Flush Cache</button>
                 </div>
              </div>

              <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Device Split</h3>
                 <div className="flex items-center gap-4">
                    <div className="flex-1 text-center">
                       <p className="text-2xl font-cinematic text-white">65%</p>
                       <p className="text-[8px] font-black text-zinc-600 uppercase">Mobile</p>
                    </div>
                    <div className="w-px h-10 bg-zinc-800"></div>
                    <div className="flex-1 text-center">
                       <p className="text-2xl font-cinematic text-white">35%</p>
                       <p className="text-[8px] font-black text-zinc-600 uppercase">Desktop</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
           {modelMetrics.map(m => (
             <div key={m.name} className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-xl group hover:border-indigo-500/50 transition-all">
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h4 className="text-xl font-bold text-white">{m.name}</h4>
                      <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mt-1">Status: <span className="text-green-500">{m.status}</span></p>
                   </div>
                   <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-xl">✨</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-black/40 rounded-2xl">
                      <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Load Share</p>
                      <p className="text-lg font-bold text-indigo-400">{m.usage}%</p>
                   </div>
                   <div className="p-4 bg-black/40 rounded-2xl">
                      <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">P99 Latency</p>
                      <p className="text-lg font-bold text-white">{m.latency}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[3rem] shadow-2xl text-center py-24 opacity-50 animate-in zoom-in-95">
           <div className="text-6xl mb-6">👥</div>
           <h3 className="text-2xl font-bold text-white uppercase tracking-widest font-cinematic">User Analytics Coming Soon</h3>
           <p className="text-zinc-500 max-w-xs mx-auto text-sm mt-2">Extended director profiles and geographical heatmaps are being synthesized.</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, trend, icon }: { label: string, value: string, trend: string, icon: string }) => (
  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-xl flex flex-col justify-between h-32 group hover:border-indigo-500/30 transition-all">
    <div className="flex justify-between items-center mb-2">
      <span className="text-xl">{icon}</span>
      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>{trend}</span>
    </div>
    <div>
      <p className="text-2xl font-cinematic text-white leading-none">{value}</p>
      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">{label}</p>
    </div>
  </div>
);

const HealthItem = ({ label, status, color }: { label: string, status: string, color: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{label}</span>
    <div className="flex items-center gap-2">
       <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
       <span className={`w-2 h-2 rounded-full ${color} animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]`}></span>
    </div>
  </div>
);
