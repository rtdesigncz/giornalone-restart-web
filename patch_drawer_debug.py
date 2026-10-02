import re

with open("src/components/ui/ClientTimelineDrawer.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'setEvents(mappedData);',
    'console.log("Timeline events:", mappedData, "TipiMap:", tipiMap);\n        setEvents(mappedData);'
)

with open("src/components/ui/ClientTimelineDrawer.tsx", "w") as f:
    f.write(content)

print("Debug added")
