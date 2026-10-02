import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

old_block = """        if (fRecuperati) {
            r = r.filter(row => !!row.conversion);
        }"""

new_block = """        if (selectedEsiti.length > 0) {
            r = r.filter(row => {
                let match = false;
                if (selectedEsiti.includes("Presentati") && row.presentato) match = true;
                if (selectedEsiti.includes("Venduti") && row.venduto) match = true;
                if (selectedEsiti.includes("Miss") && row.miss) match = true;
                if (selectedEsiti.includes("Assenti") && row.assente) match = true;
                if (selectedEsiti.includes("Recuperati") && !!row.conversion) match = true;
                if (selectedEsiti.includes("Contattati") && row.contattato) match = true;
                if (selectedEsiti.includes("Negativi") && row.negativo) match = true;
                return match;
            });
        }"""

content = content.replace(old_block, new_block)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Fixed!")
