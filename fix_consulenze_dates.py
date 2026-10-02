import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# 1. Update dateClass definition
old_dateclass = r'let dateClass = "text-slate-500";\n\s*if \(r\.preso_appuntamento && !r\.consulenza_fatta && r\.data_consulenza\) \{\n\s*const d = new Date\(r\.data_consulenza\);\n\s*const today = new Date\(\);\n\s*today\.setHours\(0, 0, 0, 0\);\n\s*if \(d < today\) \{\n\s*dateClass = "text-slate-500"; // Past = Gray\n\s*\} else \{\n\s*dateClass = "text-teal-600 font-medium"; // Future = Teal\n\s*\}\n\s*\}'

new_dateclass = """let dateClass = "bg-slate-100 text-slate-500";
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
content = re.sub(old_dateclass, new_dateclass, content)

# 2. Update Desktop usage
old_desktop_date = r'<div className=\{cn\("text-xs flex items-center gap-1 px-2 py-0\.5 rounded-full bg-slate-50", dateClass\)\}>'
new_desktop_date = '<div className={cn("text-xs flex items-center gap-1 px-2 py-0.5 rounded-full", dateClass)}>'
content = re.sub(old_desktop_date, new_desktop_date, content)

# 3. Update Mobile usage
old_mobile_date = r'<div className=\{cn\("text-xs flex items-center gap-1 px-3 py-1 rounded-full font-medium",\n\s*r\.data_consulenza && new Date\(r\.data_consulenza\) >= new Date\(new Date\(\)\.setHours\(0, 0, 0, 0\)\)\n\s*\? "bg-teal-50 text-teal-700"\n\s*: "bg-slate-100 text-slate-500"\n\s*\)\}>'

new_mobile_date = '<div className={cn("text-xs flex items-center gap-1 px-3 py-1 rounded-full font-medium", dateClass)}>'
content = re.sub(old_mobile_date, new_mobile_date, content)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Date styles updated!")
