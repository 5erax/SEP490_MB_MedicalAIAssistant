import { PremiumGate } from "@/src/components/auth";
import { ChatScreen } from "@/src/components/chat";

export default function PatientChatScreen() {
  return (
    <PremiumGate>
      <ChatScreen />
    </PremiumGate>
  );
}
