import re

with open("src/components/layout/Sidebar.tsx", "r") as f:
    content = f.read()

# Replace the active/inactive logic for the Nav Items
old_nav_item = r'isActive \? "bg-white text-\[\#21b5ba\] shadow-\[0_1px_3px_rgba\(0,0,0,0\.05\)\] ring-1 ring-slate-200" : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"'
new_nav_item = 'isActive ? "bg-cyan-50 text-cyan-700 font-bold border border-cyan-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"'
content = re.sub(old_nav_item, new_nav_item, content)

# Replace the icon styling
old_icon = r'className=\{cn\("transition-transform duration-200 flex-shrink-0", isActive \? "text-\[\#21b5ba\]" : "text-slate-400 group-hover:text-slate-700"\)\} \/>'
new_icon = 'className={cn("transition-transform duration-200 flex-shrink-0", isActive ? "text-cyan-600" : "text-slate-400 group-hover:text-slate-700")} />'
content = re.sub(old_icon, new_icon, content)

# Add the left active bar (using a replace before the closing span or icon)
old_link_inner = r'(<item\.icon size=\{20\} strokeWidth=\{isActive \? 2\.5 : 2\} [^>]+>)'
new_link_inner = '{isActive && !collapsed && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-l-lg"></div>}\n                                \\1'
content = re.sub(old_link_inner, new_link_inner, content)

# Replace the logo area
old_logo = r'<img src="/app-logo\.png" alt="Restart" className="h-10 w-auto object-contain" \/>'
new_logo = """<div className="flex items-center">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mr-3 shadow-[0_2px_10px_rgba(34,211,238,0.3)]">
                                    <span className="text-white font-black text-[12px] leading-none">R</span>
                                </div>
                                <span className="text-slate-900 font-bold tracking-tight text-lg">Restart<span className="text-cyan-600 font-normal ml-1">App</span></span>
                            </div>"""
content = re.sub(old_logo, new_logo, content)

with open("src/components/layout/Sidebar.tsx", "w") as f:
    f.write(content)

print("Sidebar updated!")
