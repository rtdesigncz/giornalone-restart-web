import re

with open("src/components/layout/Sidebar.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import { useState, useEffect } from "react";',
    'import { useState, useEffect } from "react";\nimport { ThemeToggle } from "./ThemeToggle";'
)

old_buttons = r'''<button onClick=\{toggleCollapse\} className="hidden md:flex w-full items-center justify-center p-2 text-slate-400 hover:text-\[\#21b5ba\] hover:bg-slate-100 rounded-lg transition-all" title=\{collapsed \? "Espandi" : "Riduci"\}>
                        \{collapsed \? <PanelLeftOpen size=\{18\} /> : <PanelLeftClose size=\{18\} />\}
                    </button>'''

new_buttons = '''<ThemeToggle collapsed={collapsed} />
                    <button onClick={toggleCollapse} className="hidden md:flex w-full items-center justify-center p-2 text-slate-400 hover:text-[#21b5ba] hover:bg-slate-100 rounded-lg transition-all" title={collapsed ? "Espandi" : "Riduci"}>
                        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>'''

content = re.sub(old_buttons, new_buttons, content)

with open("src/components/layout/Sidebar.tsx", "w") as f:
    f.write(content)

print("Sidebar patched")
