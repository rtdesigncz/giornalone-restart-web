import re

with open("src/components/dashboard/AbsentListPopup.tsx", "r") as f:
    content = f.read()

# 1. Import useRouter
if "useRouter" not in content:
    content = content.replace('import { Users as UsersIcon, X, Calendar, MessageCircle, Phone, Ghost } from "lucide-react";', 
                              'import { Users as UsersIcon, X, Calendar, MessageCircle, Phone, Ghost, ExternalLink } from "lucide-react";\nimport { useRouter } from "next/navigation";')

# 2. Add router instance
if "const router = useRouter();" not in content:
    content = content.replace('if (!mounted) return null;', 'if (!mounted) return null;\n    const router = useRouter();')

# 3. Replace the h4 tag with a button
old_h4 = r'''<h4 className="font-bold text-slate-900 truncate text-lg md:text-base">
                                                        \{entry\.nome\} \{entry\.cognome\}
                                                    </h4>'''
new_h4 = '''<button 
                                                        onClick={() => {
                                                            onClose();
                                                            router.push(`/agenda?section=${encodeURIComponent(entry.section)}&date=${entry.entry_date}&highlight=${entry.id}`);
                                                        }}
                                                        className="font-bold text-slate-900 truncate text-lg md:text-base hover:text-brand hover:underline flex items-center gap-1.5 transition-colors text-left"
                                                    >
                                                        {entry.nome} {entry.cognome}
                                                        <ExternalLink size={14} className="text-slate-400" />
                                                    </button>'''

content = re.sub(old_h4, new_h4, content)

with open("src/components/dashboard/AbsentListPopup.tsx", "w") as f:
    f.write(content)

print("AbsentListPopup patched!")
