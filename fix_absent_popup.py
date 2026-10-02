import re

with open("src/components/dashboard/AbsentListPopup.tsx", "r") as f:
    content = f.read()

old_func = r'export default function AbsentListPopup\(\{ isOpen, onClose, entries, onWhatsApp, onReschedule, onNegative \}: AbsentListPopupProps\) \{'
new_func = r'''export default function AbsentListPopup({ isOpen, onClose, entries, onWhatsApp, onReschedule, onNegative }: AbsentListPopupProps) {
    const router = useRouter();'''

content = re.sub(old_func, new_func, content)

with open("src/components/dashboard/AbsentListPopup.tsx", "w") as f:
    f.write(content)

print("router added to AbsentListPopup!")
