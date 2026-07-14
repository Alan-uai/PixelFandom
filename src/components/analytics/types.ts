export type DailyView = { day: string; views: number; unique_visitors: number };
export type DailyChat = { day: string; total_questions: number; unique_users: number; avg_latency_ms: number };
export type TopPage = { page_title: string; page_path: string; views: number; unique_visitors: number };
export type ReferrerItem = { label: string; count: number; percentage: number };
export type ModelUsageItem = { model: string; count: number };
export type TrendData = { current: number; previous: number; change: number };

export type AnalyticsData = {
  period: string;
  pageViews: { daily: DailyView[]; topPages: TopPage[]; total: number; uniqueVisitors: number };
  chatUsage: {
    daily: DailyChat[];
    total: number;
    feedbackStats: { positive: number; negative: number; withContext: number };
    modelUsage: ModelUsageItem[];
  };
  trends: {
    views: TrendData;
    chats: TrendData;
  };
  referrerBreakdown: ReferrerItem[];
};
