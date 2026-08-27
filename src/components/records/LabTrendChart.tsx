import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { LabIndicatorTrend } from "@/src/types/labTest";
import { formatDateOnly } from "@/src/utils/labTestPresentation";

const WIDTH = 320;
const HEIGHT = 190;
const PAD_X = 30;
const PAD_TOP = 18;
const PAD_BOTTOM = 38;

export function LabTrendChart({ trend }: { trend: LabIndicatorTrend }) {
  const points = useMemo(() => [...(trend.points ?? [])].sort((a, b) => String(a.testDate).localeCompare(String(b.testDate))), [trend.points]);
  const chart = useMemo(() => {
    if (!points.length) return null;
    const candidates = points.flatMap((point) => [point.value, point.referenceMin, point.referenceMax]).filter((value): value is number => Number.isFinite(value));
    const minValue = Math.min(...candidates);
    const maxValue = Math.max(...candidates);
    const padding = Math.max((maxValue - minValue) * 0.14, Math.abs(maxValue || 1) * 0.05, 1);
    const domainMin = minValue - padding;
    const domainMax = maxValue + padding;
    const plotWidth = WIDTH - PAD_X * 2;
    const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
    const x = (index: number) => points.length === 1 ? WIDTH / 2 : PAD_X + (index / (points.length - 1)) * plotWidth;
    const y = (value: number) => PAD_TOP + ((domainMax - value) / (domainMax - domainMin)) * plotHeight;
    const path = points.map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point.value)}`).join(" ");
    return { domainMin, domainMax, x, y, path };
  }, [points]);

  if (!chart) return <AppText color={colors.muted}>Chưa có điểm đo để hiển thị.</AppText>;

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} accessibilityLabel="Biểu đồ xu hướng chỉ số xét nghiệm">
        {[0, 0.5, 1].map((ratio) => {
          const y = PAD_TOP + ratio * (HEIGHT - PAD_TOP - PAD_BOTTOM);
          const value = chart.domainMax - ratio * (chart.domainMax - chart.domainMin);
          return (
            <G key={ratio}>
              <Line x1={PAD_X} y1={y} x2={WIDTH - PAD_X} y2={y} stroke={colors.line} strokeWidth={1} />
              <SvgText x={PAD_X - 5} y={y + 4} textAnchor="end" fontSize={9} fill={colors.subtle}>{formatNumber(value)}</SvgText>
            </G>
          );
        })}
        {points.length > 1 ? <Path d={chart.path} fill="none" stroke={colors.teal} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" /> : null}
        {points.map((point, index) => (
          <G key={`${point.sessionId}-${point.testDate}-${index}`}>
            <Circle cx={chart.x(index)} cy={chart.y(point.value)} r={5} fill={point.status === "normal" ? colors.success : colors.warning} stroke={colors.paper} strokeWidth={2} />
            {(index === 0 || index === points.length - 1) ? (
              <SvgText x={chart.x(index)} y={HEIGHT - 14} textAnchor={index === 0 ? "start" : "end"} fontSize={9} fill={colors.muted}>
                {formatDateOnly(point.testDate)}
              </SvgText>
            ) : null}
          </G>
        ))}
      </Svg>
    </View>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.paper, paddingTop: spacing.sm },
});
