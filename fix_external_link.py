import re

with open("src/components/dashboard/AbsentListPopup.tsx", "r") as f:
    content = f.read()

# Just append ExternalLink directly to the end of the line
content = content.replace(
    'import { X, MessageCircle, Calendar, Phone, Clock, Users as UsersIcon, ThumbsDown, Ghost } from "lucide-react";',
    'import { X, MessageCircle, Calendar, Phone, Clock, Users as UsersIcon, ThumbsDown, Ghost, ExternalLink } from "lucide-react";'
)

with open("src/components/dashboard/AbsentListPopup.tsx", "w") as f:
    f.write(content)

print("ExternalLink import fixed!")
