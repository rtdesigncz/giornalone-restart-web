import re

with open("src/components/agenda/AgendaView.tsx", "r") as f:
    content = f.read()

# Fix the duplicate block
content = content.replace("""                                if (!isNaN(d.getTime())) {
                                    d.setDate(d.getDate() - (viewMode === "calendar" ? 7 : 1));
                                    const newDate = d.toISOString().slice(0, 10);
                                    router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${newDate}`);
                                }
                                const newDate = d.toISOString().slice(0, 10);
                                router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${newDate}`);""",
"""                                if (!isNaN(d.getTime())) {
                                    d.setDate(d.getDate() - (viewMode === "calendar" ? 7 : 1));
                                    const newDate = d.toISOString().slice(0, 10);
                                    router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${newDate}`);
                                }""")

content = content.replace("""                                if (!isNaN(d.getTime())) {
                                    d.setDate(d.getDate() + (viewMode === "calendar" ? 7 : 1));
                                    const newDate = d.toISOString().slice(0, 10);
                                    router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${newDate}`);
                                }
                                const newDate = d.toISOString().slice(0, 10);
                                router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${newDate}`);""",
"""                                if (!isNaN(d.getTime())) {
                                    d.setDate(d.getDate() + (viewMode === "calendar" ? 7 : 1));
                                    const newDate = d.toISOString().slice(0, 10);
                                    router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${newDate}`);
                                }""")

with open("src/components/agenda/AgendaView.tsx", "w") as f:
    f.write(content)

print("Fixed!")
