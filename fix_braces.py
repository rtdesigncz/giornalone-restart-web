import re

with open("src/app/api/report/route.ts", "r") as f:
    content = f.read()

# Replace "return NextResponse.json({ rows: normalized, meta: { options, kpi } }, { status: 200 });"
# Which by the way is completely wrong because the original JSON response was bigger!
# Let's see if the original JSON response was really like that.
