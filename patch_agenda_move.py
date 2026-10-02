import re

def patch_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # 1. Add ArrowRightLeft to lucide-react imports
    if "ArrowRightLeft" not in content:
        content = content.replace('Copy, Users } from "lucide-react";', 'Copy, Users, ArrowRightLeft } from "lucide-react";')
        content = content.replace('Copy } from "lucide-react";', 'Copy, ArrowRightLeft } from "lucide-react";')

    # 2. Add MoveSectionModal import
    if "MoveSectionModal" not in content:
        content = content.replace('import EntryDrawer', 'import MoveSectionModal from "./MoveSectionModal";\nimport EntryDrawer')

    # 3. Add State
    if "const [moveEntry," not in content:
        content = content.replace('const [isDuplicateMode, setIsDuplicateMode] = useState(false);', 'const [isDuplicateMode, setIsDuplicateMode] = useState(false);\n    const [moveEntry, setMoveEntry] = useState<any | null>(null);')

    # 4. Add Button next to Copy
    old_copy_btn = r'''<button
                                                    onClick=\{\(\) => handleDuplicate\(row\)\}
                                                    className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200"
                                                    title="Duplica"
                                                >
                                                    <Copy size=\{14\} />
                                                </button>'''
    new_btns = '''<button
                                                    onClick={() => setMoveEntry(row)}
                                                    className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors border border-slate-200"
                                                    title="Sposta Sezione"
                                                >
                                                    <ArrowRightLeft size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(row)}
                                                    className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200"
                                                    title="Duplica"
                                                >
                                                    <Copy size={14} />
                                                </button>'''
    content = re.sub(old_copy_btn, new_btns, content)
    
    # 5. Add Button next to Copy for Mobile List
    old_copy_btn_mob = r'''<button onClick=\{\(\) => handleDuplicate\(row\)\} className="flex items-center justify-center p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200">
                                            <Copy size=\{16\} />
                                        </button>'''
    new_btns_mob = '''<button onClick={() => setMoveEntry(row)} className="flex items-center justify-center p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200">
                                            <ArrowRightLeft size={16} />
                                        </button>
                                        <button onClick={() => handleDuplicate(row)} className="flex items-center justify-center p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200">
                                            <Copy size={16} />
                                        </button>'''
    content = re.sub(old_copy_btn_mob, new_btns_mob, content)

    # 6. Add Modal to JSX
    if "<MoveSectionModal" not in content:
        content = content.replace('{/* Reschedule Drawer */}', '''<MoveSectionModal 
                isOpen={!!moveEntry} 
                onClose={() => setMoveEntry(null)} 
                entry={moveEntry} 
                onMoved={() => { setMoveEntry(null); fetchRows(); }} 
            />

            {/* Reschedule Drawer */}''')

    with open(filepath, "w") as f:
        f.write(content)

patch_file("src/components/agenda/AgendaTable.tsx")
patch_file("src/components/agenda/AgendaMobileList.tsx")
print("Move button added!")
