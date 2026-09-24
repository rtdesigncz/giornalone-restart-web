"use client";
import React, { useState } from 'react';
import { 
    Search, BarChart3, Check, Zap, X, Bell, 
    Settings, LayoutDashboard, Users, Calendar, 
    Database, Activity, ChevronRight, Download,
    RefreshCw, Clock, Plus, Filter, MoreHorizontal, ArrowUpRight, TrendingUp
} from 'lucide-react';

export default function PreviewMinimalPage() {
    const [activeTab, setActiveTab] = useState('consulenze');

    return (
        <div className="flex h-screen bg-[#fafafa] text-slate-800 font-sans selection:bg-cyan-100">
            
            {/* SIDEBAR */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col z-20">
                {/* Brand Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mr-3 shadow-[0_2px_10px_rgba(34,211,238,0.3)]">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-900 font-bold tracking-tight text-lg">Restart<span className="text-cyan-600 font-normal ml-1">App</span></span>
                </div>

                {/* Nav Links */}
                <div className="flex-1 py-6 px-4 flex flex-col gap-1.5">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 px-2">Workspace</div>
                    
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative overflow-hidden group ${activeTab === 'dashboard' ? 'bg-cyan-50 text-cyan-700 font-bold border border-cyan-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        {activeTab === 'dashboard' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-l-lg"></div>}
                        <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-cyan-600' : ''}`} />
                        <span className="text-sm">Dashboard</span>
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('agenda')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative overflow-hidden group ${activeTab === 'agenda' ? 'bg-cyan-50 text-cyan-700 font-bold border border-cyan-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        {activeTab === 'agenda' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-l-lg"></div>}
                        <Calendar className={`w-4 h-4 ${activeTab === 'agenda' ? 'text-cyan-600' : ''}`} />
                        <span className="text-sm">Agenda</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('consulenze')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative overflow-hidden group ${activeTab === 'consulenze' ? 'bg-cyan-50 text-cyan-700 font-bold border border-cyan-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        {activeTab === 'consulenze' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-l-lg"></div>}
                        <Activity className={`w-4 h-4 ${activeTab === 'consulenze' ? 'text-cyan-600' : ''}`} />
                        <span className="text-sm">Consulenze (Live)</span>
                    </button>

                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                        <Database className="w-4 h-4" />
                        <span className="text-sm font-medium">Reportistica</span>
                    </button>
                </div>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shadow-sm">
                        RO
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 leading-tight">Roberto</span>
                        <span className="text-[11px] text-cyan-600 font-medium leading-tight mt-0.5">Administrator</span>
                    </div>
                    <Settings className="w-4 h-4 text-slate-400 ml-auto" />
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
                
                {/* TOPBAR */}
                <div className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 z-30">
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                        <span className="hover:text-cyan-600 cursor-pointer transition-colors">Workspace</span>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-900 font-bold capitalize">{activeTab}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-cyan-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Cerca cliente o numero..." 
                                className="w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder-slate-400"
                            />
                        </div>
                        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-cyan-600 transition-colors border border-transparent hover:border-slate-200 relative">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-auto px-8 py-8 relative z-20">
                    
                    {/* --- DASHBOARD VIEW --- */}
                    {activeTab === 'dashboard' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Company Overview</h1>
                                    <p className="text-sm text-slate-500">Andamento generale di Settembre 2026.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none hover:border-slate-300 cursor-pointer shadow-sm">
                                        <option>Ultimi 30 giorni</option>
                                        <option>Questo Mese</option>
                                        <option>Anno Corrente</option>
                                    </select>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm">
                                        <Download className="w-4 h-4" /> Esporta
                                    </button>
                                </div>
                            </div>

                            {/* Dashboard Primary KPIs */}
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-1">Fatturato Stimato</p>
                                            <h3 className="text-3xl font-black text-slate-900">€ 42.500</h3>
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="flex items-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                            <ArrowUpRight className="w-3 h-3 mr-1" /> +18.2%
                                        </span>
                                        <span className="text-slate-400 font-medium">rispetto ad Agosto</span>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-1">Tasso Conversione</p>
                                            <h3 className="text-3xl font-black text-slate-900">68.4%</h3>
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                                        <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '68.4%' }}></div>
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium">Obiettivo mensile: 75%</p>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-1">Nuovi Appuntamenti</p>
                                            <h3 className="text-3xl font-black text-slate-900">142</h3>
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Users className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="flex items-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                            <ArrowUpRight className="w-3 h-3 mr-1" /> +5.4%
                                        </span>
                                        <span className="text-slate-400 font-medium">rispetto ad Agosto</span>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Area Mockup */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-80 flex flex-col">
                                    <h3 className="text-sm font-bold text-slate-800 mb-6">Andamento Vendite vs. Obiettivo</h3>
                                    <div className="flex-1 flex items-end gap-2 justify-between pt-10 border-b border-slate-100 pb-2 relative">
                                        {/* Mockup Chart Bars */}
                                        <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-slate-200"></div>
                                        {[40, 60, 30, 80, 50, 90, 70, 100, 60, 85].map((h, i) => (
                                            <div key={i} className="w-full flex justify-center group relative cursor-pointer z-10">
                                                <div className="w-3/4 bg-cyan-100 rounded-t-sm relative transition-all group-hover:bg-cyan-200" style={{ height: `${h}%` }}>
                                                    <div className="absolute bottom-0 left-0 w-full bg-cyan-500 rounded-t-sm" style={{ height: `${h * 0.7}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase">
                                        <span>1 Set</span><span>5 Set</span><span>10 Set</span><span>15 Set</span><span>20 Set</span><span>Oggi</span>
                                    </div>
                                </div>
                                <div className="col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-800 mb-4">Top Consulenti</h3>
                                    <div className="flex flex-col gap-4">
                                        {[
                                            { name: "Alessia", sales: 45, color: "cyan" },
                                            { name: "Francesco", sales: 38, color: "emerald" },
                                            { name: "Roberto", sales: 29, color: "blue" },
                                            { name: "Sara", sales: 15, color: "orange" },
                                        ].map((c, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full bg-${c.color}-100 text-${c.color}-700 flex items-center justify-center text-xs font-bold`}>
                                                        {c.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">{c.name}</span>
                                                </div>
                                                <span className="font-bold text-slate-900">{c.sales}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- AGENDA VIEW --- */}
                    {activeTab === 'agenda' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Agenda</h1>
                                    <p className="text-sm text-slate-500">Giovedì, 24 Settembre 2026</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                                        <button className="px-3 py-1.5 text-xs font-bold rounded-md bg-white text-cyan-700 shadow-sm">Giorno</button>
                                        <button className="px-3 py-1.5 text-xs font-bold rounded-md text-slate-500 hover:text-slate-700">Settimana</button>
                                        <button className="px-3 py-1.5 text-xs font-bold rounded-md text-slate-500 hover:text-slate-700">Mese</button>
                                    </div>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-bold hover:bg-cyan-700 transition-colors shadow-sm">
                                        <Plus className="w-4 h-4" /> Nuovo Appuntamento
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                {/* Calendar Header */}
                                <div className="flex border-b border-slate-200 bg-slate-50/80">
                                    <div className="w-20 border-r border-slate-200"></div>
                                    <div className="flex-1 px-4 py-3 text-center">
                                        <div className="text-sm font-bold text-slate-800">Alessia</div>
                                        <div className="text-[10px] uppercase font-bold text-emerald-600">Disponibile</div>
                                    </div>
                                    <div className="flex-1 px-4 py-3 text-center border-l border-slate-200">
                                        <div className="text-sm font-bold text-slate-800">Francesco</div>
                                        <div className="text-[10px] uppercase font-bold text-orange-600">Occupato (14-18)</div>
                                    </div>
                                </div>
                                
                                {/* Time Slots */}
                                <div className="flex-1 overflow-y-auto relative bg-slate-50/20">
                                    {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(hour => (
                                        <div key={hour} className="flex border-b border-slate-100 min-h-[80px]">
                                            <div className="w-20 border-r border-slate-200 flex justify-center py-2 relative">
                                                <span className="text-xs font-bold text-slate-400 absolute top-[-8px] bg-white/80 px-1 backdrop-blur-sm">{hour}:00</span>
                                            </div>
                                            <div className="flex-1 relative group hover:bg-cyan-50/30 cursor-crosshair transition-colors border-r border-slate-100">
                                                {/* Mock Event Alessia */}
                                                {hour === 10 && (
                                                    <div className="absolute top-2 left-2 right-2 h-[70px] bg-emerald-50 border-l-4 border-emerald-500 rounded-r-md shadow-sm p-2 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                                                        <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-0.5">Rinnovo Annu.</div>
                                                        <div className="text-sm font-bold text-slate-800">Rossi Mario</div>
                                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> 10:00 - 11:00</div>
                                                    </div>
                                                )}
                                                {hour === 16 && (
                                                    <div className="absolute top-2 left-2 right-2 h-[150px] bg-blue-50 border-l-4 border-blue-500 rounded-r-md shadow-sm p-2 overflow-hidden hover:shadow-md transition-shadow cursor-pointer z-10">
                                                        <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-0.5">Verifica Bisogno</div>
                                                        <div className="text-sm font-bold text-slate-800">Bianchi Laura</div>
                                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> 16:00 - 18:00</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 relative group hover:bg-cyan-50/30 cursor-crosshair transition-colors">
                                                {/* Mock Event Francesco */}
                                                {hour === 11 && (
                                                    <div className="absolute top-[50%] left-2 right-2 h-[70px] bg-purple-50 border-l-4 border-purple-500 rounded-r-md shadow-sm p-2 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                                                        <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wide mb-0.5">Tour Spontaneo</div>
                                                        <div className="text-sm font-bold text-slate-800">Esposito Ciro</div>
                                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> 11:30 - 12:30</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {/* Current Time Indicator */}
                                    <div className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center" style={{ top: '240px' }}>
                                        <div className="w-2 h-2 rounded-full bg-red-500 absolute left-[-4px]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* --- CONSULENZE (LIST) VIEW --- */}
                    {activeTab === 'consulenze' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Panoramica Funnel</h1>
                                    <p className="text-sm text-slate-500">Analisi in tempo reale delle conversioni e degli appuntamenti.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                                        <Filter className="w-4 h-4" /> Filtri Avanzati
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm hover:shadow">
                                        <Download className="w-4 h-4" />
                                        Esporta Report
                                    </button>
                                </div>
                            </div>

                            {/* KPI CARDS ROW */}
                            <div className="grid grid-cols-5 gap-4 mb-8">
                                {/* Totale */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 group-hover:text-slate-700">Totale Lead</h3>
                                        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-slate-900 tracking-tight">1.204</span>
                                    </div>
                                </div>

                                {/* Vendite */}
                                <div className="bg-white border border-emerald-100 rounded-xl p-5 hover:border-emerald-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                                    <div className="flex items-center justify-between mb-3 mt-1">
                                        <h3 className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Vendite Chiuse</h3>
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-slate-900 tracking-tight">142</span>
                                    </div>
                                </div>

                                {/* In Attesa */}
                                <div className="bg-white border border-orange-100 rounded-xl p-5 hover:border-orange-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-orange-400"></div>
                                    <div className="flex items-center justify-between mb-3 mt-1">
                                        <h3 className="text-[11px] font-bold uppercase tracking-wide text-orange-700">In Attesa</h3>
                                        <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                                            <Calendar className="w-3.5 h-3.5 text-orange-500" />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-slate-900 tracking-tight">38</span>
                                    </div>
                                </div>

                                {/* Recuperati (Info) */}
                                <div className="bg-cyan-50/50 border border-cyan-100 rounded-xl p-5 transition-all group shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/5 rounded-full blur-xl"></div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-[11px] font-bold uppercase tracking-wide text-cyan-700">Recuperati</h3>
                                        <div className="w-7 h-7 rounded-lg bg-cyan-100/50 border border-cyan-200 flex items-center justify-center">
                                            <RefreshCw className="w-3.5 h-3.5 text-cyan-600" />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-cyan-900 tracking-tight">15</span>
                                    </div>
                                </div>

                                {/* Miss */}
                                <div className="bg-white border border-red-100 rounded-xl p-5 hover:border-red-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                                    <div className="flex items-center justify-between mb-3 mt-1">
                                        <h3 className="text-[11px] font-bold uppercase tracking-wide text-red-600">Miss</h3>
                                        <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                                            <X className="w-3.5 h-3.5 text-red-500" />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-slate-900 tracking-tight">14</span>
                                    </div>
                                </div>
                            </div>

                            {/* TABLE COMPONENT */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
                                    <h2 className="text-sm font-bold text-slate-800">Ultimi Movimenti</h2>
                                    <button className="text-[11px] font-bold uppercase tracking-wide text-cyan-600 hover:text-cyan-700 flex items-center gap-1 transition-colors bg-cyan-50 px-2 py-1 rounded-md border border-cyan-100">
                                        Gestisci Righe <MoreHorizontal className="w-3 h-3 ml-1" />
                                    </button>
                                </div>
                                
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 bg-white">Data & Ora</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 bg-white">Cliente</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 bg-white">Recapito</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 bg-white text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {[
                                            { time: "24 Set, 18:30", name: "Rossi Mario", phone: "+39 333 1234567", status: "Venduto", type: "success" },
                                            { time: "24 Set, 18:15", name: "Bianchi Laura", phone: "+39 328 9876543", status: "In Attesa", type: "warning" },
                                            { time: "24 Set, 17:45", name: "Verdi Luca", phone: "+39 347 1122334", status: "Miss", type: "error" },
                                            { time: "24 Set, 17:00", name: "Esposito Ciro", phone: "+39 392 5566778", status: "Recuperato", type: "info" },
                                            { time: "24 Set, 16:30", name: "Romano Sara", phone: "+39 340 9988776", status: "Venduto", type: "success" }
                                        ].map((row, i) => {
                                            const badgeStyles = {
                                                success: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                warning: "bg-orange-50 text-orange-700 border-orange-200",
                                                error: "bg-red-50 text-red-700 border-red-200",
                                                info: "bg-cyan-50 text-cyan-700 border-cyan-200"
                                            };
                                            return (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 group cursor-pointer">
                                                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">{row.time}</td>
                                                    <td className="px-6 py-4 text-slate-900 font-bold">{row.name}</td>
                                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{row.phone}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${badgeStyles[row.type as keyof typeof badgeStyles]}`}>
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
