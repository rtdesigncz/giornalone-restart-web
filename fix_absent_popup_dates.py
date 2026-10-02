import re

with open("src/components/dashboard/AbsentListPopup.tsx", "r") as f:
    content = f.read()

# Replace the Time Badge section safely
old_badge = r'''                                            \{\/\* Time Badge \*\/\}
                                            <div className="w-14 h-14 rounded-xl bg-yellow-100 border border-yellow-200 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                                                <span className="text-\[10px\] font-bold uppercase text-yellow-600 leading-none mb-0\.5">
                                                    \{new Date\(entry\.entry_date\)\.toLocaleDateString\('it-IT', \{ month: 'short' \}\)\.replace\('\.', ''\)\}
                                                </span>
                                                <span className="text-lg font-bold text-yellow-700 leading-none">
                                                    \{new Date\(entry\.entry_date\)\.getDate\(\)\}
                                                </span>
                                            </div>'''

new_badge = '''                                            {/* Time Badge */}
                                            <div className="w-14 h-14 rounded-xl bg-yellow-100 border border-yellow-200 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                                                <span className="text-[10px] font-bold uppercase text-yellow-600 leading-none mb-0.5">
                                                    {entry.entry_date && !isNaN(new Date(entry.entry_date).getTime()) ? new Date(entry.entry_date).toLocaleDateString('it-IT', { month: 'short' }).replace('.', '') : 'N/D'}
                                                </span>
                                                <span className="text-lg font-bold text-yellow-700 leading-none">
                                                    {entry.entry_date && !isNaN(new Date(entry.entry_date).getTime()) ? new Date(entry.entry_date).getDate() : '?'}
                                                </span>
                                            </div>'''

content = re.sub(old_badge, new_badge, content)

with open("src/components/dashboard/AbsentListPopup.tsx", "w") as f:
    f.write(content)

print("AbsentListPopup Time Badge patched!")
