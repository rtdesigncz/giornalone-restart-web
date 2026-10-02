import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

old_mobile_map = r'\{rows\.map\(r => \{\n\s*const isEditing = editable\(r\);'
new_mobile_map = """{sortedRows.map(r => {
                                    const isEditing = editable(r);
                                    let dateClass = "bg-slate-100 text-slate-500";
                                    if (r.preso_appuntamento && r.data_consulenza) {
                                        const d = new Date(r.data_consulenza);
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        if (d < today && !r.consulenza_fatta) {
                                            dateClass = "animate-pulse ring-2 ring-orange-500 bg-orange-100 text-orange-900 border-orange-500";
                                        } else if (d >= today && !r.consulenza_fatta) {
                                            dateClass = "bg-teal-50 text-teal-700 font-medium";
                                        } else {
                                            dateClass = "bg-slate-100 text-slate-500";
                                        }
                                    }"""
content = re.sub(old_mobile_map, new_mobile_map, content)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Mobile map loop fixed!")
