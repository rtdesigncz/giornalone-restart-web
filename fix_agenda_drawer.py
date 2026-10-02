import re

def patch_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # 1. Remove MoveSectionModal import
    content = content.replace('import MoveSectionModal from "./MoveSectionModal";\n', '')

    # 2. Replace moveEntry with isMoveMode
    content = content.replace('const [moveEntry, setMoveEntry] = useState<any | null>(null);', 'const [isMoveMode, setIsMoveMode] = useState(false);')

    # 3. Fix the "Sposta Sezione" button onClick
    content = content.replace('onClick={() => setMoveEntry(row)}', 'onClick={() => { setSelectedEntry(row); setIsMoveMode(true); setDrawerOpen(true); }}')

    # 4. Remove the MoveSectionModal JSX component rendering
    content = re.sub(r'<MoveSectionModal.*?/>', '', content, flags=re.DOTALL)

    # 5. Add allowSectionChange to the EntryDrawer (the main one, not RescheduleDrawer)
    old_drawer = r'''<EntryDrawer
                isOpen=\{drawerOpen\}
                onClose=\{\(\) => setDrawerOpen\(false\)\}
                entry=\{selectedEntry\}
                section=\{section\}
                date=\{dateParam\}
                onSave=\{fetchRows\}
                onDelete=\{handleDelete\}
                isDuplicate=\{isDuplicateMode\}
            />'''
    new_drawer = '''<EntryDrawer
                isOpen={drawerOpen}
                onClose={() => { setDrawerOpen(false); setIsMoveMode(false); setIsDuplicateMode(false); }}
                entry={selectedEntry}
                section={section}
                date={dateParam}
                onSave={fetchRows}
                onDelete={handleDelete}
                isDuplicate={isDuplicateMode}
                allowSectionChange={isMoveMode}
            />'''
    content = re.sub(old_drawer, new_drawer, content)

    # Wait, the mobile version might not have dateParam, it uses current date? Let's check AgendaMobileList drawer.
    # The regex for Mobile List drawer:
    old_drawer_mob = r'''<EntryDrawer
                isOpen=\{drawerOpen\}
                onClose=\{\(\) => setDrawerOpen\(false\)\}
                entry=\{selectedEntry\}
                section=\{section\}
                date=\{new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\}
                onSave=\{fetchRows\}
                onDelete=\{handleDelete\}
                isDuplicate=\{isDuplicateMode\}
            />'''
    new_drawer_mob = '''<EntryDrawer
                isOpen={drawerOpen}
                onClose={() => { setDrawerOpen(false); setIsMoveMode(false); setIsDuplicateMode(false); }}
                entry={selectedEntry}
                section={section}
                date={new Date().toISOString().split('T')[0]}
                onSave={fetchRows}
                onDelete={handleDelete}
                isDuplicate={isDuplicateMode}
                allowSectionChange={isMoveMode}
            />'''
    content = re.sub(old_drawer_mob, new_drawer_mob, content)

    with open(filepath, "w") as f:
        f.write(content)

patch_file("src/components/agenda/AgendaTable.tsx")
patch_file("src/components/agenda/AgendaMobileList.tsx")
print("Move mode integrated into Drawer!")
