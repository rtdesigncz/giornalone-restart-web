import re

with open("src/app/api/report/route.ts", "r") as f:
    content = f.read()

old_bad_return = r'    return NextResponse\.json\(\{ rows: normalized, meta: \{ options, kpi \} \}, \{ status: 200 \}\);\n    \}'

new_good_return = """    if (format === "json") {
      return NextResponse.json({
        meta: {
          options: {
            sezioni: SECTIONS,
            consulenti: consulentiOptions,
            tipi_abbonamento: tipiOptions,
          }
        },
        rows: normalized
      });
    }"""

content = re.sub(old_bad_return, new_good_return, content)

with open("src/app/api/report/route.ts", "w") as f:
    f.write(content)

print("Fixed!")
