import { render } from "@testing-library/react-native";

import { ResultCard } from "@/src/components/records/ResultCard";

describe("Lab ResultCard provenance safety", () => {
  it("renders the server reference range and source value", () => {
    const screen = render(<ResultCard result={{ resultDetailId: "r1", rawExtractedName: "Glucose", rawExtractedValue: "6.2", userValue: 6.2, status: "high", referenceMinUsed: 3.9, referenceMaxUsed: 5.6, referenceUnitUsed: "mmol/L" }} />);
    expect(screen.getByText(/Khoảng tham chiếu: 3.9 – 5.6 mmol\/L/)).toBeTruthy();
    expect(screen.getByText("Cao")).toBeTruthy();
  });

  it("does not invent a normal range when the backend omits it", () => {
    const screen = render(<ResultCard result={{ resultDetailId: "r2", rawExtractedName: "Chỉ số OCR", rawExtractedValue: "12", status: "unknown" }} />);
    expect(screen.getByText("Chưa xác định")).toBeTruthy();
    expect(screen.queryByText(/Khoảng tham chiếu:/)).toBeNull();
  });
});
