with open("src/components/medical/AppointmentTable.tsx", "r") as f:
    content = f.read()
if "appointments" in content:
    print("AppointmentTable contains 'appointments'")
    
with open("src/components/medical/WaitingList.tsx", "r") as f:
    content = f.read()
if "waitingList" in content:
    print("WaitingList contains 'waitingList'")
