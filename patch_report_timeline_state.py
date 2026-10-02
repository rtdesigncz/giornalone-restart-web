import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

state_hook = r'    const \[loading, setLoading\] = useState\(false\);'
new_state = '''    const [loading, setLoading] = useState(false);
    const [timelineOpen, setTimelineOpen] = useState(false);
    const [timelinePhone, setTimelinePhone] = useState<string | null>(null);
    const [timelineName, setTimelineName] = useState<string | null>(null);'''

content = re.sub(state_hook, new_state, content)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Reportistica Timeline state patched")
