import re

with open("src/components/ui/CommandPalette.tsx", "r") as f:
    content = f.read()

old_logic = r'''if \(r\.type === 'agenda'\) \{
\s*icon = Calendar;
\s*action = \(\) => router\.push\(`/agenda\?highlight=\$\{r\.id\}`\);
\s*\} else if \(r\.type === 'consulenze'\) \{
\s*icon = Users;
\s*action = \(\) => router\.push\(`/consulenze\?highlight=\$\{r\.id\}`\);
\s*\} else if \(r\.type === 'medical' \|\| r\.type === 'waiting'\) \{
\s*icon = Activity;
\s*action = \(\) => router\.push\(`/visite-mediche\?highlight=\$\{r\.id\}`\);
\s*\}'''

new_logic = """if (r.type === 'agenda') {
                                icon = Calendar;
                                action = () => router.push(`/agenda?date=${r.raw.entry_date}&highlight=${r.id}`);
                            } else if (r.type === 'consulenze') {
                                icon = Users;
                                action = () => router.push(`/consulenze?gestione=${r.raw.gestione_id}&highlight=${r.id}`);
                            } else if (r.type === 'medical') {
                                icon = Activity;
                                action = () => router.push(`/visite-mediche?session=${r.raw.session_id}&highlight=${r.id}`);
                            } else if (r.type === 'waiting') {
                                icon = Activity;
                                action = () => router.push(`/visite-mediche?tab=waiting&highlight=${r.id}`);
                            }"""

content = re.sub(old_logic, new_logic, content)

with open("src/components/ui/CommandPalette.tsx", "w") as f:
    f.write(content)
print("Palette updated!")
