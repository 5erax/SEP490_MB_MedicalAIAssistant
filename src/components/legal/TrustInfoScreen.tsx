// Ported 1:1 from src/pages/TrustInfoPage.jsx (Web) — content for the three
// public info pages (support/privacy/medical-disclaimer). Web renders these
// with a sticky in-page anchor-nav sidebar (a desktop affordance); mobile
// drops that and just lays every section out in a single scroll, redesigned
// as cards instead of copying Web's article layout.
import { ReactNode } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  ArrowRight,
  BadgeInfo,
  CircleAlert,
  CircleHelp,
  ClipboardCheck,
  CreditCard,
  Database,
  ExternalLink,
  HeartPulse,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  LucideIcon,
  MapPinned,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
} from "lucide-react-native";

import { AppText, Button, Card, Screen } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ROUTES } from "@/src/navigation/routes";

const ICONS = {
  arrowRight: ArrowRight,
  badgeInfo: BadgeInfo,
  circleAlert: CircleAlert,
  circleHelp: CircleHelp,
  clipboardCheck: ClipboardCheck,
  creditCard: CreditCard,
  database: Database,
  heartPulse: HeartPulse,
  keyRound: KeyRound,
  lifeBuoy: LifeBuoy,
  lockKeyhole: LockKeyhole,
  mapPinned: MapPinned,
  shieldAlert: ShieldAlert,
  shieldCheck: ShieldCheck,
  stethoscope: Stethoscope,
  userRoundCheck: UserRoundCheck,
} as const satisfies Record<string, LucideIcon>;

type IconKey = keyof typeof ICONS;
type NoticeTone = "info" | "calm" | "warning";
type LinkTuple = [label: string, href: string];

type TrustCard = { icon: IconKey; title: string; body: string; links?: LinkTuple[] };
type TrustSection = {
  id: string;
  title: string;
  intro?: string;
  cards?: TrustCard[];
  steps?: [step: string, title: string, body: string][];
  services?: [name: string, description: string][];
  bullets?: string[];
  source?: LinkTuple;
  links?: LinkTuple[];
};

export type TrustPageId = "support" | "privacy" | "medical-disclaimer";

type TrustPageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  icon: IconKey;
  facts: [icon: IconKey, title: string, body: string][];
  notice: { tone: NoticeTone; title: string; body: string };
  sections: TrustSection[];
};

const TRUST_PAGES: Record<TrustPageId, TrustPageContent> = {
  support: {
    eyebrow: "Trung tâm hỗ trợ",
    title: "Tìm đúng hướng khi bạn cần trợ giúp.",
    intro:
      "Chọn vấn đề bạn đang gặp để mở đúng phần của MediMate. Trang này ưu tiên các bước tự xử lý đang có trên hệ thống và không yêu cầu bạn chia sẻ dữ liệu sức khỏe.",
    icon: "lifeBuoy",
    facts: [
      ["circleHelp", "Hướng dẫn theo vấn đề", "Đi thẳng đến tài khoản, gói dịch vụ hoặc tính năng công khai."],
      ["shieldCheck", "Không gửi dữ liệu nhạy cảm", "Không chia sẻ mật khẩu, mã đăng nhập hoặc nội dung hồ sơ y tế."],
      ["heartPulse", "Không dùng cho cấp cứu", "Liên hệ dịch vụ cấp cứu tại nơi bạn sống nếu tình huống đe dọa tính mạng."],
    ],
    notice: {
      tone: "info",
      title: "Kênh hỗ trợ trực tiếp chưa được công bố trên ứng dụng",
      body: "MediMate hiện cung cấp hướng dẫn tự phục vụ trên trang này. Không gửi dữ liệu cá nhân hoặc dữ liệu sức khỏe đến email, số điện thoại hay tài khoản mạng xã hội không được công bố chính thức.",
    },
    sections: [
      {
        id: "start",
        title: "Chọn nội dung bạn cần hỗ trợ",
        intro: "Mỗi lựa chọn bên dưới dẫn đến chức năng đang có trên hệ thống.",
        cards: [
          {
            icon: "keyRound",
            title: "Tài khoản và đăng nhập",
            body: "Đăng nhập lại hoặc đặt lại mật khẩu khi bạn không thể vào tài khoản.",
            links: [
              ["Mở trang đăng nhập", ROUTES.PUBLIC.LOGIN],
              ["Đặt lại mật khẩu", ROUTES.PUBLIC.FORGOT_PASSWORD],
            ],
          },
          {
            icon: "creditCard",
            title: "Gói dịch vụ và thanh toán",
            body: "Xem gói đang cung cấp, hạn mức và trạng thái được hệ thống trả về.",
            links: [
              ["Xem bảng giá", ROUTES.PUBLIC.PRICING],
              ["Mở hồ sơ cá nhân", ROUTES.PATIENT.PROFILE],
            ],
          },
          {
            icon: "stethoscope",
            title: "Tính năng trước khi đi khám",
            body: "Mở hướng dẫn mô tả triệu chứng hoặc tìm cơ sở y tế trên bản đồ.",
            links: [
              ["Mở trợ lý y tế", ROUTES.PATIENT.SYMPTOM],
              ["Tìm cơ sở y tế", ROUTES.PATIENT.MAP],
            ],
          },
        ],
      },
      {
        id: "troubleshoot",
        title: "Khi ứng dụng không tải hoặc dữ liệu chưa cập nhật",
        intro: "Thử lần lượt các bước này. Dừng lại nếu thao tác yêu cầu bạn cung cấp mật khẩu hoặc mã truy cập cho người khác.",
        steps: [
          ["01", "Tải lại một lần", "Chờ yêu cầu hiện tại kết thúc rồi mở lại ứng dụng. Tránh bấm thanh toán nhiều lần."],
          ["02", "Kiểm tra kết nối và phiên đăng nhập", "Xác nhận mạng ổn định. Nếu phiên đã hết hạn, đăng nhập lại."],
          ["03", "Ghi lại thông tin không nhạy cảm", "Ghi màn hình, thời điểm xảy ra và thông báo lỗi. Không chụp mật khẩu hay nội dung hồ sơ."],
          ["04", "Kiểm tra trạng thái trong tài khoản", "Với gói dịch vụ, mở lại bảng giá hoặc hồ sơ sau vài phút để xem trạng thái mới nhất."],
        ],
      },
      {
        id: "safety",
        title: "Hỗ trợ kỹ thuật không thay thế trợ giúp y tế",
        intro: "Nếu bạn lo ngại về triệu chứng, hãy ưu tiên cơ sở y tế hoặc chuyên gia y tế. Đừng chờ phản hồi kỹ thuật trong tình huống khẩn cấp.",
        links: [
          ["Đọc tuyên bố miễn trừ y tế", ROUTES.PUBLIC.MEDICAL_DISCLAIMER],
          ["Mở bản đồ cơ sở y tế", ROUTES.PATIENT.MAP],
        ],
      },
    ],
  },
  privacy: {
    eyebrow: "Quyền riêng tư",
    title: "Hiểu dữ liệu nào được dùng và khi nào.",
    intro:
      "MediMate xử lý dữ liệu bạn chủ động cung cấp để vận hành tài khoản và các tính năng sức khỏe. Phần này mô tả hành vi hiện có trên ứng dụng, không đưa ra cam kết vượt quá hệ thống.",
    icon: "lockKeyhole",
    facts: [
      ["userRoundCheck", "Bạn chọn nội dung nhập", "Chỉ cung cấp thông tin cần thiết cho chức năng bạn đang dùng."],
      ["database", "Dữ liệu theo từng chức năng", "Tài khoản, hồ sơ, hội thoại và thanh toán được gửi khi bạn thực hiện thao tác tương ứng."],
      ["shieldCheck", "Bảo vệ thông tin đăng nhập", "Không chia sẻ mật khẩu, mã truy cập hoặc ảnh chụp chứa thông tin xác thực."],
    ],
    notice: {
      tone: "calm",
      title: "Dữ liệu sức khỏe là dữ liệu nhạy cảm",
      body: "Không nhập thông tin của người khác khi chưa được phép. Với nội dung không cần thiết để sử dụng tính năng, hãy bỏ qua hoặc mô tả ở mức tối thiểu.",
    },
    sections: [
      {
        id: "data",
        title: "Những nhóm dữ liệu có thể được xử lý",
        intro: "Dữ liệu cụ thể phụ thuộc vào chức năng bạn chọn sử dụng.",
        cards: [
          { icon: "userRoundCheck", title: "Tài khoản", body: "Thông tin đăng ký, đăng nhập và vai trò tài khoản. Phiên đăng nhập được lưu trên thiết bị để duy trì truy cập." },
          { icon: "heartPulse", title: "Thông tin sức khỏe", body: "Triệu chứng, câu trả lời lâm sàng, hồ sơ bệnh nhân hoặc nội dung trò chuyện khi bạn chủ động nhập." },
          { icon: "clipboardCheck", title: "Gói dịch vụ", body: "Gói đã chọn, trạng thái đăng ký và thông tin giao dịch cần thiết để theo dõi thanh toán." },
          { icon: "badgeInfo", title: "Dữ liệu kỹ thuật", body: "Tùy chọn hiển thị, thông tin phiên tạm thời và dữ liệu hiệu năng cần để vận hành, sửa lỗi ứng dụng." },
        ],
      },
      {
        id: "services",
        title: "Dịch vụ liên quan khi bạn dùng MediMate",
        intro: "Một số yêu cầu đi qua dịch vụ khác để hoàn thành đúng chức năng.",
        services: [
          ["Hệ thống MediMate", "Xử lý yêu cầu về tài khoản, hồ sơ, trợ lý y tế, cơ sở y tế và gói dịch vụ."],
          ["Google", "Chỉ tham gia khi đăng nhập Google được bật và bạn chọn cách đăng nhập này."],
          ["PayOS", "Nhận thông tin cần thiết khi bạn chủ động bắt đầu thanh toán gói đăng ký."],
          ["CARTO và OpenStreetMap", "Cung cấp kiểu bản đồ và dữ liệu nền; ứng dụng cần gửi yêu cầu tải bản đồ đến các dịch vụ này."],
        ],
      },
      {
        id: "choices",
        title: "Những lựa chọn bạn có trên ứng dụng",
        bullets: [
          "Không nhập dữ liệu sức khỏe khi bạn chưa sẵn sàng chia sẻ với chức năng đó.",
          "Đăng xuất khi dùng thiết bị chung và không lưu thông tin đăng nhập trên thiết bị công cộng.",
          "Chỉ mở thanh toán khi bạn đã kiểm tra đúng tên gói, giá và thời hạn.",
          "Bạn có thể sửa các trường hồ sơ mà ứng dụng hiện cho phép chỉnh sửa.",
        ],
      },
      {
        id: "open-items",
        title: "Thông tin cần được công bố thêm trước khi phát hành chính thức",
        intro:
          "Ứng dụng hiện chưa công bố đầu mối yêu cầu dữ liệu, thời hạn lưu trữ chi tiết hoặc quy trình yêu cầu xóa tài khoản. MediMate không nên khẳng định các quyền này cho đến khi có thông tin và quy trình hỗ trợ đầy đủ.",
      },
    ],
  },
  "medical-disclaimer": {
    eyebrow: "Tuyên bố miễn trừ y tế",
    title: "MediMate hỗ trợ chuẩn bị, không chẩn đoán hay kê đơn.",
    intro: "Kết quả từ AI chỉ mang tính tham khảo dựa trên thông tin bạn nhập. Chuyên gia y tế cần đánh giá trực tiếp để chẩn đoán, chỉ định xét nghiệm hoặc quyết định điều trị.",
    icon: "shieldAlert",
    facts: [
      ["stethoscope", "Không chẩn đoán", "Gợi ý từ AI không phải kết luận bệnh án."],
      ["clipboardCheck", "Không kê đơn", "Không tự bắt đầu, đổi liều hoặc ngừng thuốc chỉ vì nội dung AI."],
      ["circleAlert", "Không dùng cho cấp cứu", "Gọi dịch vụ cấp cứu địa phương khi có dấu hiệu đe dọa tính mạng."],
    ],
    notice: {
      tone: "warning",
      title: "Trong tình huống khẩn cấp, đừng chờ MediMate phản hồi",
      body: "Liên hệ dịch vụ cấp cứu tại nơi bạn sống hoặc đến cơ sở cấp cứu gần nhất. Nếu có thể, nhờ người ở cạnh hỗ trợ.",
    },
    sections: [
      {
        id: "can-do",
        title: "MediMate có thể hỗ trợ điều gì",
        cards: [
          { icon: "clipboardCheck", title: "Sắp xếp thông tin", body: "Giúp bạn mô tả triệu chứng rõ hơn và chuẩn bị câu hỏi trước khi gặp nhân viên y tế." },
          { icon: "stethoscope", title: "Định hướng tham khảo", body: "Đưa ra gợi ý chuyên khoa hoặc bước tiếp theo dựa trên dữ liệu bạn cung cấp." },
          { icon: "mapPinned", title: "Tìm cơ sở y tế", body: "Hiển thị cơ sở có trong dữ liệu hệ thống để bạn tự xem và lựa chọn." },
        ],
      },
      {
        id: "cannot-do",
        title: "MediMate không thể thay thế",
        bullets: [
          "Khám trực tiếp, đo dấu hiệu sinh tồn hoặc xem toàn bộ bệnh sử.",
          "Xét nghiệm, chẩn đoán hình ảnh và đánh giá chuyên môn của bác sĩ.",
          "Chẩn đoán xác định, kê đơn hoặc quyết định thay đổi điều trị.",
          "Dịch vụ cấp cứu hay theo dõi liên tục khi tình trạng chuyển nặng.",
        ],
      },
      {
        id: "emergency",
        title: "Ví dụ về dấu hiệu cần trợ giúp khẩn cấp",
        intro: "Danh sách này không đầy đủ. Hãy gọi dịch vụ cấp cứu địa phương nếu bạn cho rằng tính mạng hoặc sự an toàn đang bị đe dọa.",
        bullets: [
          "Khó thở nặng, đau hoặc tức ngực nghiêm trọng.",
          "Bất tỉnh, co giật hoặc thay đổi ý thức đột ngột.",
          "Đột ngột yếu liệt một bên, khó nói, khó nhìn hoặc khó đi lại.",
          "Chảy máu không cầm, phản ứng dị ứng nặng hoặc sưng nhanh ở mặt, mắt, lưỡi.",
        ],
        source: ["Nguồn tham khảo về dấu hiệu cấp cứu: MedlinePlus", "https://medlineplus.gov/ency/article/001927.htm"],
      },
      {
        id: "safe-use",
        title: "Cách sử dụng kết quả AI an toàn hơn",
        steps: [
          ["01", "Kiểm tra lại thông tin đầu vào", "Bổ sung thời điểm khởi phát, mức độ và dấu hiệu đi kèm khi phù hợp."],
          ["02", "Xem kết quả là gợi ý", "Không coi tên bệnh hoặc chuyên khoa do AI đề xuất là kết luận y khoa."],
          ["03", "Trao đổi với chuyên gia y tế", "Mang theo thông tin đã chuẩn bị để bác sĩ hoặc nhân viên y tế đánh giá."],
        ],
        links: [["Tìm cơ sở y tế", ROUTES.PATIENT.MAP]],
      },
    ],
  },
};

const NOTICE_COLORS: Record<NoticeTone, { bg: string; border: string }> = {
  info: { bg: colors.mint, border: colors.teal },
  calm: { bg: colors.mint, border: colors.teal },
  warning: { bg: colors.warningBg, border: colors.warning },
};

function isInternalHref(href: string) {
  return href.startsWith("/(");
}

function openLink(href: string) {
  if (isInternalHref(href)) {
    router.push(href as never);
  } else {
    Linking.openURL(href);
  }
}

function LinkRow({ links }: { links?: LinkTuple[] }) {
  if (!links?.length) return null;
  return (
    <View style={styles.linkRow}>
      {links.map(([label, href]) => (
        <Button key={href} variant="secondary" size="sm" onPress={() => openLink(href)}>
          <View style={styles.linkInline}>
            <AppText variant="bodyStrong">{label}</AppText>
            <ArrowRight size={14} color={colors.ink} />
          </View>
        </Button>
      ))}
    </View>
  );
}

function SectionBlock({ section }: { section: TrustSection }) {
  return (
    <View style={styles.section}>
      <AppText variant="h3">{section.title}</AppText>
      {section.intro ? <AppText color={colors.muted}>{section.intro}</AppText> : null}

      {section.cards
        ? section.cards.map((card) => {
            const Icon = ICONS[card.icon];
            return (
              <Card key={card.title} variant="soft" style={styles.card}>
                <View style={styles.cardIcon}>
                  <Icon size={18} color={colors.teal} />
                </View>
                <AppText variant="bodyStrong">{card.title}</AppText>
                <AppText color={colors.muted}>{card.body}</AppText>
                <LinkRow links={card.links} />
              </Card>
            );
          })
        : null}

      {section.steps
        ? section.steps.map(([number, title, body]) => (
            <View key={number} style={styles.stepRow}>
              <AppText variant="caption" color={colors.limeDark} style={styles.stepIndex}>
                {number}
              </AppText>
              <View style={styles.stepText}>
                <AppText variant="bodyStrong">{title}</AppText>
                <AppText color={colors.muted}>{body}</AppText>
              </View>
            </View>
          ))
        : null}

      {section.services
        ? section.services.map(([name, description]) => (
            <View key={name} style={styles.serviceRow}>
              <AppText variant="bodyStrong">{name}</AppText>
              <AppText color={colors.muted}>{description}</AppText>
            </View>
          ))
        : null}

      {section.bullets
        ? section.bullets.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <AppText color={colors.muted} style={styles.bulletText}>
                {item}
              </AppText>
            </View>
          ))
        : null}

      {section.source ? (
        <Button
          variant="secondary"
          size="sm"
          onPress={() => openLink(section.source![1])}
          style={styles.sourceButton}
        >
          <View style={styles.linkInline}>
            <ExternalLink size={14} color={colors.ink} />
            <AppText variant="bodyStrong">{section.source[0]}</AppText>
          </View>
        </Button>
      ) : null}

      <LinkRow links={section.links} />
    </View>
  );
}

export function TrustInfoScreen({ page }: { page: TrustPageId }): ReactNode {
  const content = TRUST_PAGES[page];
  const HeroIcon = ICONS[content.icon];
  const noticeColors = NOTICE_COLORS[content.notice.tone];

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <HeroIcon size={24} color={colors.limeDark} />
        </View>
        <AppText variant="eyebrow" color={colors.limeDark}>
          {content.eyebrow}
        </AppText>
        <AppText variant="h1">{content.title}</AppText>
        <AppText color={colors.muted}>{content.intro}</AppText>
      </View>

      <Card variant="hard" style={styles.factPanel}>
        {content.facts.map(([iconKey, title, body]) => {
          const Icon = ICONS[iconKey];
          return (
            <View key={title} style={styles.factRow}>
              <Icon size={18} color={colors.teal} />
              <View style={styles.factText}>
                <AppText variant="bodyStrong">{title}</AppText>
                <AppText variant="caption" color={colors.muted}>
                  {body}
                </AppText>
              </View>
            </View>
          );
        })}
      </Card>

      <View style={[styles.notice, { backgroundColor: noticeColors.bg, borderColor: noticeColors.border }]}>
        <ShieldAlert size={20} color={noticeColors.border} />
        <View style={styles.noticeText}>
          <AppText variant="bodyStrong">{content.notice.title}</AppText>
          <AppText color={colors.muted}>{content.notice.body}</AppText>
        </View>
      </View>

      {content.sections.map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  hero: {
    gap: spacing.sm,
  },
  heroIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.lime,
  },
  factPanel: {
    gap: spacing.md,
  },
  factRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  factText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  noticeText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  section: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  cardIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.mint,
  },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  linkInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stepRow: {
    flexDirection: "row",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
  },
  stepIndex: {
    width: 24,
  },
  stepText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  serviceRow: {
    gap: spacing.xs / 2,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
  },
  bulletRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    backgroundColor: colors.limeDark,
  },
  bulletText: {
    flex: 1,
  },
  sourceButton: {
    alignSelf: "flex-start",
  },
});
