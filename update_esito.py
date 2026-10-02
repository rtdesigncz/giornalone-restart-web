import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Add isPastDue calculation
old_esito = """                                                                            <StatusBadge
                                                                                label={r.esito}
                                                                                color={
                                                                                    r.esito === "NEGATIVO" ? "red" :
                                                                                        r.esito === "IN ATTESA" ? "amber" : "emerald"
                                                                                }
                                                                            />"""

new_esito = """                                                                            <StatusBadge
                                                                                label={r.esito}
                                                                                color={
                                                                                    r.esito === "NEGATIVO" ? "red" :
                                                                                        r.esito === "IN ATTESA" ? "amber" : "emerald"
                                                                                }
                                                                                className={
                                                                                    (r.esito === "IN ATTESA" && r.data_risposta && new Date(r.data_risposta) < new Date(new Date().setHours(0,0,0,0))) 
                                                                                        ? "animate-pulse ring-2 ring-amber-400 bg-amber-200 text-amber-900 border-amber-400" 
                                                                                        : ""
                                                                                }
                                                                            />"""

content = content.replace(old_esito, new_esito)

# Remove the old filters area, keeping the "Totale" feature request in mind
# Wait, let me replace the "showFilters &&" block entirely with nothing since we want to remove the old collapsible filter area
filters_regex = r'\{\/\* Collapsible Filters Area \*\/\}[\s\S]*?\}\)\}'
# Wait, this regex is too dangerous. I'll just remove the button that opens it and the showFilters state.
# Wait, I can just remove the button: `onClick={() => setShowFilters(!showFilters)}` and the whole `div` for `Collapsible Filters Area`.

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Esito updated!")
