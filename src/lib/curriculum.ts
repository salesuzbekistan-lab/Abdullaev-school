export const LESSON_STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  scheduled: "Rejalashtirilgan",
  published: "Chop etilgan",
};

export const STAGE_TYPE_LABELS: Record<string, string> = {
  video_theory: "1. Video dars + nazariya",
  vocabulary: "2. Amaliy mashqlar",
  listening: "3. Topshiriqlar",
  reading: "4. Nazorat savollari",
};

export const STAGE_TYPE_ORDER = ["video_theory", "vocabulary", "listening", "reading"] as const;
