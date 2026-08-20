import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";

import { ResultPanel } from "@/src/components/dashboard/ResultPanel";

describe("ResultPanel emergency safety", () => {
  beforeEach(() => {
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("shows an explicit, ungated 115 action when backend marks an emergency", async () => {
    const screen = render(
      <ResultPanel
        result={{
          recommendedDepartment: {
            departmentId: "emergency",
            departmentName: "Cấp cứu",
            confidenceScore: 0.98,
            isEmergencySuggested: true,
            priorityRank: 1,
          },
          recommendedFacilities: [],
        }}
        userLocation={null}
        locationStatus="idle"
        onRequestLocation={jest.fn()}
        onOpenMap={jest.fn()}
        onPrepareConsultation={jest.fn()}
        onNewSymptom={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText("Gọi cấp cứu 115"));
    expect(screen.getByText("Có dấu hiệu cần được đánh giá khẩn cấp")).toBeTruthy();
    await waitFor(() => expect(Linking.openURL).toHaveBeenCalledWith("tel:115"));
  });
});
