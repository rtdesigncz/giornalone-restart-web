import re

with open("src/components/medical/AppointmentTable.tsx", "r") as f:
    content = f.read()

hook_code = """    const sp = useSearchParams();
    const highlightId = sp?.get("highlight");
    const [flashId, setFlashId] = useState<string | null>(null);

    useEffect(() => {
        if (highlightId && Object.keys(appointments).length > 0) {
            setTimeout(() => {
                const el = document.getElementById(`row-${highlightId}`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    setFlashId(highlightId);
                    setTimeout(() => setFlashId(null), 3000);
                }
            }, 300);
        }
    }, [highlightId, appointments]);
"""

old_dec = r'const \[appointments, setAppointments\] = useState<Record<string, any>>\(\{\}\); // Map slot -> appointment'
new_dec = old_dec + '\n' + hook_code
content = re.sub(old_dec, new_dec, content)

with open("src/components/medical/AppointmentTable.tsx", "w") as f:
    f.write(content)
print("AppointmentTable fixed!")
