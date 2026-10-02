import re

with open("src/components/ui/CommandPalette.tsx", "r") as f:
    content = f.read()

# Add Loader2 to imports if not there
if "Loader2" not in content:
    content = content.replace('Search, Calendar', 'Search, Calendar, Loader2')

# Add isSearching state
if "const [isSearching" not in content:
    content = content.replace('const [isPending, startTransition] = useTransition();', 'const [isPending, startTransition] = useTransition();\n    const [isSearching, setIsSearching] = useState(false);')

# Update the useEffect logic
old_use_effect = r'''    useEffect\(\(\) => \{
        if \(!query \|\| query\.length < 2\) \{
            setDbResults\(\[\]\);
            return;
        \}

        const timer = setTimeout\(\(\) => \{
            startTransition\(async \(\) => \{
                try \{
                    const res = await fetch\(`/api/search\?q=\$\{encodeURIComponent\(query\)\}`\);
                    const data = await res\.json\(\);
                    
                    if \(data\.results\) \{'''

new_use_effect = '''    useEffect(() => {
        if (!query || query.length < 2) {
            setDbResults([]);
            setIsSearching(false);
            return;
        }
        
        setIsSearching(true);

        const timer = setTimeout(() => {
            startTransition(async () => {
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    
                    if (data.results) {'''

content = re.sub(old_use_effect, new_use_effect, content)

# Add the finally block in the fetch
old_catch = r'''                \} catch \(e\) \{
                    console\.error\("Search failed", e\);
                \}
            \}\);
        \}, 300\);'''

new_catch = '''                } catch (e) {
                    console.error("Search failed", e);
                } finally {
                    setIsSearching(false);
                }
            });
        }, 300);'''

content = re.sub(old_catch, new_catch, content)


# Update the UI empty state logic
old_ui = r'''                    \{query\.trim\(\) === "" \? \(
                        <div className="py-12 text-center flex flex-col items-center">
                            <Search className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-slate-500 text-base font-medium">Cerca nel Giornalone\.\.\.</p>
                            <p className="text-slate-400 text-sm mt-1">Digita nome, cognome o numero di telefono</p>
                        </div>
                    \) : displayCommands\.length === 0 \? \(
                        <div className="py-12 text-center flex flex-col items-center">
                            <Search className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-slate-500 text-base font-medium">Nessun risultato trovato per "\{query\}"</p>
                        </div>
                    \) : \('''

new_ui = '''                    {query.trim() === "" ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <Search className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-slate-500 text-base font-medium">Cerca nel Giornalone...</p>
                            <p className="text-slate-400 text-sm mt-1">Digita nome, cognome o numero di telefono</p>
                        </div>
                    ) : isSearching ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <Loader2 className="w-10 h-10 text-cyan-500 mb-3 animate-spin" />
                            <p className="text-slate-500 text-base font-medium animate-pulse">Ricerca in corso...</p>
                            <p className="text-slate-400 text-sm mt-1">Sto setacciando l'intero database</p>
                        </div>
                    ) : displayCommands.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <Search className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-slate-500 text-base font-medium">Nessun risultato trovato per "{query}"</p>
                        </div>
                    ) : ('''

content = re.sub(old_ui, new_ui, content)

with open("src/components/ui/CommandPalette.tsx", "w") as f:
    f.write(content)

print("Search feedback state added!")
