import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import { PieChart } from "lucide-react";',
    'import { PieChart, Clock } from "lucide-react";'
)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Clock imported")
