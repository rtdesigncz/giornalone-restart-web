import re

with open("src/components/ui/CommandPalette.tsx", "r") as f:
    content = f.read()

# Add tags to CommandItem
old_type = r'type CommandItem = \{.*?group: string;\n\};'
new_type = '''type CommandItem = {
    id: string;
    label: string;
    subtitle?: string;
    icon: any;
    action: () => void;
    group: string;
    tags?: { label: string, icon?: any }[];
    phone?: string;
};'''
content = re.sub(old_type, new_type, content, flags=re.DOTALL)

# Add imports for icons
if 'import { MapPin' not in content:
    content = content.replace('Activity, Phone\n} from "lucide-react";', 'Activity, Phone, MapPin, Clock, Tag, User\n} from "lucide-react";')


# Update the mapping logic
old_map = r'const mapped: CommandItem\[\] = data\.results\.map\(\(r: any\) => \{.*?\n\s*return \{.*?action\n\s*\};\n\s*\}\);'

new_map = '''const mapped: CommandItem[] = data.results.map((r: any) => {
                            let icon = Users;
                            let action = () => {};
                            let tags: { label: string, icon?: any }[] = [];
                            
                            if (r.type === 'agenda') {
                                icon = Calendar;
                                action = () => router.push(`/agenda?section=${encodeURIComponent(r.raw.section)}&date=${r.raw.entry_date}&highlight=${r.id}`);
                                
                                const dateStr = r.raw.entry_date ? new Date(r.raw.entry_date).toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
                                tags.push({ label: r.raw.section, icon: Tag });
                                if (dateStr) tags.push({ label: dateStr, icon: Clock });
                                if (r.raw.consulenti?.name) tags.push({ label: r.raw.consulenti.name, icon: User });

                            } else if (r.type === 'consulenze') {
                                icon = Users;
                                action = () => router.push(`/consulenze?gestione=${r.raw.gestione_id}&highlight=${r.id}`);
                                
                                const listName = r.raw.gestioni?.nome || "Lista";
                                tags.push({ label: `Consulenze: ${listName}`, icon: MapPin });

                            } else if (r.type === 'medical') {
                                icon = Activity;
                                action = () => router.push(`/visite-mediche?session=${r.raw.session_id}&highlight=${r.id}`);
                                
                                const sessionDate = r.raw.medical_sessions?.date ? new Date(r.raw.medical_sessions.date).toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
                                tags.push({ label: "Visita Medica", icon: Activity });
                                if (sessionDate) tags.push({ label: sessionDate, icon: Clock });

                            } else if (r.type === 'waiting') {
                                icon = Activity;
                                action = () => router.push(`/visite-mediche?tab=waiting&highlight=${r.id}`);
                                tags.push({ label: "Lista d'Attesa", icon: Activity });
                            }

                            return {
                                id: `${r.type}-${r.id}`,
                                label: r.title,
                                phone: r.phone,
                                icon,
                                group: "Risultati Ricerca",
                                action,
                                tags
                            };
                        });'''

content = re.sub(old_map, new_map, content, flags=re.DOTALL)


# Update the UI rendering
old_ui = r'\{command\.subtitle && \(\n\s*<span className=\{cn\("text-xs font-medium mt-0\.5", isSelected \? "text-cyan-100" : "text-slate-400"\)\}>\n\s*\{command\.subtitle\}\n\s*</span>\n\s*\)\}'

new_ui = '''{/* TAGS UI */}
                                            {(command.tags || command.phone) && (
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                    {command.phone && (
                                                        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide", isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                                                            <Phone size={10} /> {command.phone}
                                                        </span>
                                                    )}
                                                    {command.tags?.map((t, i) => (
                                                        <span key={i} className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide", isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                                                            {t.icon && <t.icon size={10} />} {t.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}'''

content = re.sub(old_ui, new_ui, content, flags=re.DOTALL)

with open("src/components/ui/CommandPalette.tsx", "w") as f:
    f.write(content)

print("CommandPalette UI updated!")
