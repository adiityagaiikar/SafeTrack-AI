def send_emergency_alert(contacts: list, message: str) -> None:
    """
    Placeholder service to simulate sending emergency alerts via SMS.
    """
    if not contacts:
        print("No contacts to alert.")
        return

    print("=== EMERGENCY ALERT TRIGGERED ===")
    for phone in contacts:
        print(f"[SMS to {phone}]: {message}")
    print("=================================")
