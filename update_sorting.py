import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

old_sort_logic = """                let aValue: any = a[sortConfig.key as keyof typeof a];
                let bValue: any = b[sortConfig.key as keyof typeof b];

                if (sortConfig.key === 'consulente') {
                    aValue = a.consulente?.name || "";
                    bValue = b.consulente?.name || "";
                }
                if (sortConfig.key === 'tipo_abbonamento') {
                    aValue = a.tipo_abbonamento?.name || "";
                    bValue = b.tipo_abbonamento?.name || "";
                }
                if (sortConfig.key === 'entry_date') {
                    aValue = new Date(`${a.entry_date}T${a.entry_time || '00:00'}`).getTime();
                    bValue = new Date(`${b.entry_date}T${b.entry_time || '00:00'}`).getTime();
                }
                if (sortConfig.key === 'nome') {
                    aValue = `${a.nome || ''} ${a.cognome || ''}`;
                    bValue = `${b.nome || ''} ${b.cognome || ''}`;
                }

                if (aValue === null || aValue === undefined) aValue = "";
                if (bValue === null || bValue === undefined) bValue = "";
                
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;"""

new_sort_logic = """                let aValue: any = a[sortConfig.key as keyof typeof a];
                let bValue: any = b[sortConfig.key as keyof typeof b];

                if (sortConfig.key === 'consulente') {
                    aValue = a.consulente?.name || "";
                    bValue = b.consulente?.name || "";
                }
                if (sortConfig.key === 'tipo_abbonamento') {
                    aValue = a.tipo_abbonamento?.name || "";
                    bValue = b.tipo_abbonamento?.name || "";
                }
                if (sortConfig.key === 'entry_date') {
                    aValue = new Date(`${a.entry_date}T${a.entry_time || '00:00'}`).getTime();
                    bValue = new Date(`${b.entry_date}T${b.entry_time || '00:00'}`).getTime();
                }
                if (sortConfig.key === 'nome') {
                    aValue = `${a.cognome || ''} ${a.nome || ''}`;
                    bValue = `${b.cognome || ''} ${b.nome || ''}`;
                }

                if (aValue === null || aValue === undefined) aValue = "";
                if (bValue === null || bValue === undefined) bValue = "";
                
                if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                if (typeof bValue === 'string') bValue = bValue.toLowerCase();
                
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;"""

content = content.replace(old_sort_logic, new_sort_logic)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Sorting logic updated for case-insensitivity and cognome first!")
