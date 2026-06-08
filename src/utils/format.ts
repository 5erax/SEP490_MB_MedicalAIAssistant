export function compactText(value?: string | null, fallback = "Chua cap nhat") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function getInitials(nameOrEmail = "MediMate") {
  const name = String(nameOrEmail).split("@")[0];

  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "MM"
  );
}

