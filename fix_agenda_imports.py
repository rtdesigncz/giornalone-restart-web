import re

with open("src/components/agenda/AgendaTable.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'Search, Plus, Filter, Phone, Check, MessageCircle, Copy, Users, ArrowRightLeft',
    'Search, Plus, Filter, Phone, Check, MessageCircle, Copy, Users, ArrowRightLeft, Clock'
)

with open("src/components/agenda/AgendaTable.tsx", "w") as f:
    f.write(content)

print("AgendaTable imports fixed")
