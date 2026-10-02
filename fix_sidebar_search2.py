import re

with open("src/components/layout/Sidebar.tsx", "r") as f:
    content = f.read()

# I need to add Search icon to import
old_import = 'PanelLeftClose, PanelLeftOpen } from "lucide-react";'
new_import = 'PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";'
content = content.replace(old_import, new_import)

old_logo = r'<button onClick=\{onClose\} className="ml-auto md:hidden p-1\.5 text-slate-400 hover:text-slate-700 rounded-md absolute right-3"><X size=\{20\} \/><\/button>\s*<\/div>'

new_logo = """<button onClick={onClose} className="ml-auto md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-md absolute right-3"><X size={20} /></button>
                </div>
                
                {/* Search Bar Trigger */}
                <div className={cn("border-b border-slate-200/50 bg-[#f8f9fa]", collapsed ? "p-2" : "p-3")}>
                    <button 
                        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                        className={cn(
                            "w-full flex items-center bg-white border border-slate-200 text-slate-400 rounded-lg hover:border-cyan-300 hover:text-cyan-600 hover:shadow-sm shadow-sm transition-all group",
                            collapsed ? "p-2.5 justify-center" : "px-3 py-2 gap-3"
                        )}
                        title="Ricerca Globale (Cmd+K)"
                    >
                        <Search size={18} className="group-hover:scale-110 transition-transform" />
                        {!collapsed && (
                            <>
                                <span className="flex-1 text-left text-sm font-semibold">Cerca...</span>
                                <span className="text-[10px] font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">⌘K</span>
                            </>
                        )}
                    </button>
                </div>"""

content = re.sub(old_logo, new_logo, content)

with open("src/components/layout/Sidebar.tsx", "w") as f:
    f.write(content)

print("Search button added to Sidebar!")
