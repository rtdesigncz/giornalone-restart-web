import re

with open("src/app/api/search/route.ts", "r") as f:
    content = f.read()

# Add order to queries
content = content.replace(
    'const { data: agenda } = await agendaQuery.limit(10);',
    'const { data: agenda } = await agendaQuery.order("entry_date", { ascending: false }).limit(10);'
)
content = content.replace(
    'const { data: consulenze } = await consulenzeQuery.limit(10);',
    'const { data: consulenze } = await consulenzeQuery.order("created_at", { ascending: false }).limit(10);'
)

with open("src/app/api/search/route.ts", "w") as f:
    f.write(content)
print("DB Ordering added!")
