import React from 'react';
import { 
    Search, BarChart3, Check, Zap, X, Bell, 
    Settings, LayoutDashboard, Users, Calendar, 
    Database, Activity, ChevronRight
} from 'lucide-react';

export default function PreviewNeonPage() {
    return (
        <div className="flex h-screen bg-[#050505] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden">
            
            {/* SIDEBAR */}
            <div className="w-64 bg-[#0a0a0a] border-r border-slate-800/50 flex flex-col relative z-20">
                {/* Brand Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)] mr-3">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-bold tracking-widest text-lg">RESTART</span>
                </div>

                {/* Nav Links */}
                <div className="flex-1 py-6 px-4 flex flex-col gap-2">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-slate-600 mb-2 px-2">Main System</div>
                    
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30 transition-all group">
                        <LayoutDashboard className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        <span className="text-sm font-medium">Dashboard</span>
                    </button>
                    
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-cyan-400 bg-cyan-950/20 border border-cyan-900/50 transition-all group relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]"></div>
                        <Activity className="w-4 h-4 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        <span className="text-sm font-medium">Consulenze</span>
                    </button>

                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30 transition-all group">
                        <Database className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        <span className="text-sm font-medium">Reportistica</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
                {/* Background Ambient Glows */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[50%] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none"></div>

                {/* TOPBAR */}
                <div className="h-16 flex items-center justify-between px-8 border-b border-slate-800/50 bg-[#0a0a0a]/80 backdrop-blur-md relative z-30">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-white tracking-wide">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Live</span> Data Stream
                        </h1>
                        <div className="h-6 w-px bg-slate-800"></div>
                        <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/80 bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-900/50">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            SYSTEM_ONLINE
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-cyan-400 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Ricerca globale..." 
                                className="w-64 pl-10 pr-4 py-2 bg-[#050505] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600 font-mono"
                            />
                        </div>
                        <button className="w-10 h-10 rounded-lg border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all bg-[#050505]">
                            <Bell className="w-4 h-4" />
                        </button>
                        <button className="w-10 h-10 rounded-lg border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all bg-[#050505]">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-auto p-8 relative z-20">
                    
                    {/* KPI CARDS ROW */}
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/50 transition-all duration-300 shadow-lg">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] group-hover:bg-cyan-500/10 transition-colors"></div>
                            <div className="flex items-center justify-between mb-4 relative">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">Totale Contatti</h3>
                                <div className="w-8 h-8 rounded-lg bg-[#050505] border border-slate-800 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 relative">
                                <span className="text-4xl font-black text-white tracking-tight">1,204</span>
                                <span className="text-xs font-mono text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]">+12%</span>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] group-hover:bg-emerald-500/10 transition-colors"></div>
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-transparent"></div>
                            <div className="flex items-center justify-between mb-4 relative">
                                <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">Vendite Chiuse</h3>
                                <div className="w-8 h-8 rounded-lg bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 relative">
                                <span className="text-4xl font-black text-white tracking-tight">142</span>
                                <span className="text-xs font-mono text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]">Ottimo</span>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-orange-500/50 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] group-hover:bg-orange-500/10 transition-colors"></div>
                            <div className="flex items-center justify-between mb-4 relative">
                                <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest">In Attesa</h3>
                                <div className="w-8 h-8 rounded-lg bg-orange-950/30 border border-orange-900/50 flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-orange-400" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 relative">
                                <span className="text-4xl font-black text-white tracking-tight">38</span>
                                <span className="text-xs font-mono text-slate-500">Da processare</span>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/50 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[50px] group-hover:bg-red-500/10 transition-colors"></div>
                            <div className="flex items-center justify-between mb-4 relative">
                                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest">Miss</h3>
                                <div className="w-8 h-8 rounded-lg bg-red-950/30 border border-red-900/50 flex items-center justify-center">
                                    <X className="w-4 h-4 text-red-400" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 relative">
                                <span className="text-4xl font-black text-white tracking-tight">14</span>
                                <span className="text-xs font-mono text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]">-2%</span>
                            </div>
                        </div>
                    </div>

                    {/* TABLE COMPONENT */}
                    <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900/50 to-transparent">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Database className="w-4 h-4 text-cyan-500" />
                                Database Stream
                            </h2>
                            <button className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                                EXTRACT_DATA <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#050505]/50 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cliente</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contatto</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Azione</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 font-mono text-sm">
                                    {[
                                        { time: "2026-09-24 18:30:00", name: "ROSSI MARIO", phone: "+39 333 1234567", status: "VENDUTO", color: "emerald" },
                                        { time: "2026-09-24 18:15:00", name: "BIANCHI LAURA", phone: "+39 328 9876543", status: "IN_ATTESA", color: "orange" },
                                        { time: "2026-09-24 17:45:00", name: "VERDI LUCA", phone: "+39 347 1122334", status: "MISS", color: "red" },
                                        { time: "2026-09-24 17:00:00", name: "ESPOSITO CIRO", phone: "+39 392 5566778", status: "RECUPERATO", color: "cyan" },
                                        { time: "2026-09-24 16:30:00", name: "ROMANO SARA", phone: "+39 340 9988776", status: "VENDUTO", color: "emerald" }
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4 text-slate-400 text-xs">
                                                {row.time.split(' ')[0]} <span className="text-slate-600">|</span> <span className="text-cyan-500/80">{row.time.split(' ')[1]}</span>
                                            </td>
                                            <td className="px-6 py-4 text-white font-sans font-medium">{row.name}</td>
                                            <td className="px-6 py-4 text-slate-400 text-xs">{row.phone}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-${row.color}-950/30 text-${row.color}-400 border border-${row.color}-900/50 shadow-[0_0_10px_rgba(0,0,0,0)] group-hover:shadow-[0_0_10px_rgba(var(--tw-colors-${row.color}-500),0.2)] transition-all`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-600 hover:text-cyan-400 transition-colors">
                                                    <Settings className="w-4 h-4 ml-auto" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
