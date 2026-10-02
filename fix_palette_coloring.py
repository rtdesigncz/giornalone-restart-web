import re

with open("src/components/ui/CommandPalette.tsx", "r") as f:
    content = f.read()

# 1. Add colorTheme to CommandItem
if "colorTheme?:" not in content:
    content = content.replace('phone?: string;', 'phone?: string;\n    colorTheme?: string;')

# 2. Assign colorTheme in mapping
content = content.replace('group: "Risultati Ricerca",', 'group: "Risultati Ricerca",\n                                colorTheme: r.type,')

# 3. Remove navCommands entirely and replace query check
content = re.sub(r'const navCommands: CommandItem\[\].*?\];', '', content, flags=re.DOTALL)
content = content.replace('const displayCommands = query ? dbResults : navCommands;', 'const displayCommands = dbResults;')


# 4. Modify UI Rendering
old_empty = r'\{displayCommands\.length === 0 \? \(\n\s*<div className="py-12 text-center flex flex-col items-center">\n\s*<Search className="w-10 h-10 text-slate-200 mb-3" />\n\s*<p className="text-slate-500 text-base font-medium">Nessun risultato trovato per "\{query\}"</p>\n\s*<p className="text-slate-400 text-sm mt-1">Prova a cercare per nome, cognome o telefono\.</p>\n\s*</div>\n\s*\) : \('

new_empty = '''{query.trim() === "" ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <Search className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-slate-500 text-base font-medium">Cerca nel Giornalone...</p>
                            <p className="text-slate-400 text-sm mt-1">Digita nome, cognome o numero di telefono</p>
                        </div>
                    ) : displayCommands.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <Search className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-slate-500 text-base font-medium">Nessun risultato trovato per "{query}"</p>
                        </div>
                    ) : ('''

content = re.sub(old_empty, new_empty, content)


# Inject class helpers before return
helpers = '''
    const getThemeClasses = (type: string, isSelected: boolean) => {
        if (type === 'agenda') return isSelected ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border-emerald-600/20" : "bg-emerald-50 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-300 border-emerald-200 shadow-sm";
        if (type === 'consulenze') return isSelected ? "bg-blue-500 text-white shadow-md shadow-blue-500/20 border-blue-600/20" : "bg-blue-50 text-blue-950 hover:bg-blue-100 hover:border-blue-300 border-blue-200 shadow-sm";
        if (type === 'medical' || type === 'waiting') return isSelected ? "bg-purple-500 text-white shadow-md shadow-purple-500/20 border-purple-600/20" : "bg-purple-50 text-purple-950 hover:bg-purple-100 hover:border-purple-300 border-purple-200 shadow-sm";
        return isSelected ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20 border-cyan-600/20" : "bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-200 border-slate-100 shadow-sm";
    };
    const getIconBoxClasses = (type: string, isSelected: boolean) => {
        if (isSelected) return "bg-white/20 text-white";
        if (type === 'agenda') return "bg-emerald-100 text-emerald-600";
        if (type === 'consulenze') return "bg-blue-100 text-blue-600";
        if (type === 'medical' || type === 'waiting') return "bg-purple-100 text-purple-600";
        return "bg-slate-100 text-slate-500";
    };
    const getBadgeClasses = (type: string, isSelected: boolean) => {
        if (isSelected) return "bg-white/20 text-white";
        if (type === 'agenda') return "bg-emerald-200/60 text-emerald-800";
        if (type === 'consulenze') return "bg-blue-200/60 text-blue-800";
        if (type === 'medical' || type === 'waiting') return "bg-purple-200/60 text-purple-800";
        return "bg-slate-100 text-slate-500";
    };

    return ('''

content = content.replace("return (", helpers, 1)

# Modify button rendering
old_btn_start = r'<button\n\s*key=\{command\.id\}\n\s*onClick=\{\(\) => \{ command\.action\(\); setOpen\(false\); \}\}\n\s*onMouseEnter=\{\(\) => setSelectedIndex\(index\)\}\n\s*className=\{cn\(\n\s*"w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all border border-transparent",\n\s*isSelected\n\s*\? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20 border-cyan-600/20"\n\s*: "bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-200 border-slate-100 shadow-sm"\n\s*\)\}\n\s*>'
new_btn_start = r'''<button
                                        key={command.id}
                                        onClick={() => { command.action(); setOpen(false); }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={cn(
                                            "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all border border-transparent",
                                            getThemeClasses(command.colorTheme || "", isSelected)
                                        )}
                                    >'''
content = re.sub(old_btn_start, new_btn_start, content)

# Modify Icon box
old_iconbox = r'<div className=\{cn\("p-2 rounded-lg", isSelected \? "bg-white/20" : "bg-slate-100"\)\}>\n\s*<command\.icon size=\{20\} className=\{cn\(isSelected \? "text-white" : "text-slate-500"\)\} />\n\s*</div>'
new_iconbox = r'''<div className={cn("p-2 rounded-lg", getIconBoxClasses(command.colorTheme || "", isSelected))}>
                                            <command.icon size={20} />
                                        </div>'''
content = re.sub(old_iconbox, new_iconbox, content)

# Modify text color
old_text = r'<span className=\{cn\("font-bold text-base", isSelected \? "text-white" : "text-slate-800"\)\}>\{command\.label\}</span>'
new_text = r'<span className={cn("font-bold text-base", isSelected ? "text-white" : "")}>{command.label}</span>'
content = re.sub(old_text, new_text, content)

# Modify tag badges
old_badges = r'\{command\.phone && \(\n\s*<span className=\{cn\("inline-flex items-center gap-1 px-1\.5 py-0\.5 rounded text-\[10px\] font-bold tracking-wide", isSelected \? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"\)\}>\n\s*<Phone size=\{10\} /> \{command\.phone\}\n\s*</span>\n\s*\)\}\n\s*\{command\.tags\?\.map\(\(t, i\) => \(\n\s*<span key=\{i\} className=\{cn\("inline-flex items-center gap-1 px-1\.5 py-0\.5 rounded text-\[10px\] font-bold tracking-wide", isSelected \? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"\)\}>'
new_badges = r'''{command.phone && (
                                                        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide", getBadgeClasses(command.colorTheme || "", isSelected))}>
                                                            <Phone size={10} /> {command.phone}
                                                        </span>
                                                    )}
                                                    {command.tags?.map((t, i) => (
                                                        <span key={i} className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide", getBadgeClasses(command.colorTheme || "", isSelected))}>'''
content = re.sub(old_badges, new_badges, content)


with open("src/components/ui/CommandPalette.tsx", "w") as f:
    f.write(content)

print("CommandPalette UI colored updated!")
