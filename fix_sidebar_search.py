import re

with open("src/components/layout/Sidebar.tsx", "r") as f:
    content = f.read()

# Add a Search button right after the logo header
old_logo = r'<div className="h-16 flex items-center px-4 border-b border-slate-200 shrink-0 justify-between">.*?</div>'
new_logo = """<div className="h-16 flex items-center px-4 border-b border-slate-200 shrink-0 justify-between">
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">G</div>
                            <span className="font-extrabold text-lg text-slate-800 tracking-tight">Giornalone</span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-sm mx-auto">G</div>
                    )}
                    <button onClick={toggleCollapse} className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                    <button onClick={onClose} className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Search Bar Trigger */}
                <div className={cn("p-4 border-b border-slate-200/50", collapsed ? "px-2" : "px-4")}>
                    <button 
                        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                        className={cn(
                            "w-full flex items-center gap-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:border-cyan-300 hover:text-cyan-600 hover:shadow-sm transition-all group",
                            collapsed ? "p-2 justify-center" : "px-3 py-2"
                        )}
                        title="Ricerca Rapida (Cmd+K)"
                    >
                        <Search size={18} className="group-hover:scale-110 transition-transform" />
                        {!collapsed && (
                            <>
                                <span className="flex-1 text-left text-sm font-medium">Cerca...</span>
                                <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">⌘K</span>
                            </>
                        )}
                    </button>
                </div>"""

# To make this robust, I'll just find the exact logo block. Let's see the current logo block first.
