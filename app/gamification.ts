import type { CurriculumModule } from "./course-data";

export type GamificationState = {
  xp: number;
  earnedRewardIds: string[];
  activityDates: string[];
  dailyActionCounts: Record<string, number>;
  streak: number;
  bestStreak: number;
  badges: string[];
};

export type Reward = { id: string; xp: number };

export const emptyGamification: GamificationState = {
  xp: 0,
  earnedRewardIds: [],
  activityDates: [],
  dailyActionCounts: {},
  streak: 0,
  bestStreak: 0,
  badges: [],
};

export const levels = [
  { name: "Explorer", xp: 0 },
  { name: "Lakehouse Novice", xp: 250 },
  { name: "Pipeline Builder", xp: 750 },
  { name: "Orchestrator", xp: 1_500 },
  { name: "Streaming Operator", xp: 2_500 },
  { name: "Performance Tuner", xp: 4_000 },
  { name: "Data Governor", xp: 6_000 },
  { name: "Production Engineer", xp: 8_000 },
  { name: "Lakehouse Architect", xp: 10_000 },
] as const;

export const badgeCatalog = {
  "first-lab": { icon: "⌘", label: "Primer laboratorio" },
  "perfect-test": { icon: "4/4", label: "Test perfecto" },
  "associate": { icon: "A", label: "Tronco Associate" },
  "streaming": { icon: "↝", label: "Streaming dominado" },
  "pipelines": { icon: "◇", label: "Pipelines dominados" },
  "performance": { icon: "∆", label: "FinOps dominado" },
  "delivery": { icon: "✓", label: "Entrega dominada" },
  "capstone": { icon: "★", label: "Capstone Professional" },
  "comeback": { icon: "↻", label: "Vuelta a la ruta" },
  "source-scout": { icon: "↗", label: "Source Scout" },
} as const;

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayDifference(previous: string, current: string) {
  const start = new Date(`${previous}T12:00:00`);
  const end = new Date(`${current}T12:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function sanitizeGamification(value: unknown): GamificationState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyGamification;
  const raw = value as Partial<GamificationState>;
  const earnedRewardIds = Array.isArray(raw.earnedRewardIds)
    ? [...new Set(raw.earnedRewardIds.filter((item): item is string => typeof item === "string" && item.length <= 160))]
    : [];
  const activityDates = Array.isArray(raw.activityDates)
    ? [...new Set(raw.activityDates.filter((item): item is string => /^\d{4}-\d{2}-\d{2}$/.test(item)))].sort()
    : [];
  const dailyActionCounts: Record<string, number> = {};
  if (raw.dailyActionCounts && typeof raw.dailyActionCounts === "object" && !Array.isArray(raw.dailyActionCounts)) {
    for (const [date, count] of Object.entries(raw.dailyActionCounts)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isInteger(count) && Number(count) >= 0 && Number(count) <= 500) dailyActionCounts[date] = Number(count);
    }
  }
  return {
    xp: typeof raw.xp === "number" && Number.isFinite(raw.xp) ? Math.min(100_000, Math.max(0, Math.round(raw.xp))) : 0,
    earnedRewardIds,
    activityDates,
    dailyActionCounts,
    streak: typeof raw.streak === "number" ? Math.min(10_000, Math.max(0, Math.round(raw.streak))) : 0,
    bestStreak: typeof raw.bestStreak === "number" ? Math.min(10_000, Math.max(0, Math.round(raw.bestStreak))) : 0,
    badges: Array.isArray(raw.badges) ? [...new Set(raw.badges.filter((item): item is string => typeof item === "string" && item in badgeCatalog))] : [],
  };
}

export function grantRewards(state: GamificationState, rewards: Reward[], today = localDate()) {
  const alreadyEarned = new Set(state.earnedRewardIds);
  const unique = rewards.filter((reward) => !alreadyEarned.has(reward.id));
  if (!unique.length) return { state, awardedXp: 0, awarded: [] as string[] };

  unique.forEach((reward) => alreadyEarned.add(reward.id));
  const previousDate = state.activityDates.at(-1);
  const activityDates = state.activityDates.includes(today) ? state.activityDates : [...state.activityDates, today].sort();
  let streak = state.streak;
  if (previousDate !== today) {
    streak = previousDate && dayDifference(previousDate, today) === 1 ? Math.max(1, state.streak + 1) : 1;
  }

  const dailyActionCounts = { ...state.dailyActionCounts };
  const beforeCount = dailyActionCounts[today] ?? 0;
  const afterCount = beforeCount + unique.length;
  dailyActionCounts[today] = afterCount;
  const comboRewards: Reward[] = [];
  for (const [threshold, xp] of [[3, 10], [5, 20], [7, 40]] as const) {
    const comboId = `combo:${today}:${threshold}`;
    if (beforeCount < threshold && afterCount >= threshold && !alreadyEarned.has(comboId)) {
      alreadyEarned.add(comboId);
      comboRewards.push({ id: comboId, xp });
    }
  }

  const allRewards = [...unique, ...comboRewards];
  const awardedXp = allRewards.reduce((sum, reward) => sum + reward.xp, 0);
  const next: GamificationState = {
    ...state,
    xp: state.xp + awardedXp,
    earnedRewardIds: [...alreadyEarned],
    activityDates,
    dailyActionCounts,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
  };
  return { state: next, awardedXp, awarded: allRewards.map((reward) => reward.id) };
}

export function deriveBadges(state: GamificationState, completedModules: string[]) {
  const rewards = state.earnedRewardIds;
  const completed = new Set(completedModules);
  const badges = new Set(state.badges);
  if (rewards.some((id) => id.startsWith("lab:"))) badges.add("first-lab");
  if (rewards.some((id) => id.startsWith("quiz-perfect:"))) badges.add("perfect-test");
  if (completed.has("m12")) badges.add("associate");
  if (completed.has("m17")) badges.add("streaming");
  if (completed.has("m22")) badges.add("pipelines");
  if (completed.has("m27")) badges.add("performance");
  if (completed.has("m31")) badges.add("delivery");
  if (completed.has("m32")) badges.add("capstone");
  if (state.streak === 1 && state.bestStreak >= 3) badges.add("comeback");
  if (rewards.filter((id) => id.startsWith("source:")).length >= 10) badges.add("source-scout");
  return { ...state, badges: [...badges] };
}

export function levelFor(xp: number) {
  const current = [...levels].reverse().find((level) => xp >= level.xp) ?? levels[0];
  const index = levels.findIndex((level) => level.name === current.name);
  const next = levels[index + 1];
  const percent = next ? Math.round(((xp - current.xp) / (next.xp - current.xp)) * 100) : 100;
  return { current, next, percent: Math.min(100, Math.max(0, percent)) };
}

export function dailyChallenge(modules: CurriculumModule[], completed: Set<string>, completedLessons: Record<string, string[]>) {
  const module = modules.find((item) => item.prerequisites.every((id) => completed.has(id)) && !completed.has(item.id));
  if (!module) return "Revisa una fuente oficial y conserva tu cobertura al día.";
  const lesson = module.lessons.find((item) => !(completedLessons[module.id] ?? []).includes(item.id));
  return lesson ? `Explica «${lesson.title}» sin mirar.` : `Completa el laboratorio del módulo ${module.number}.`;
}

export function weeklyMission(modules: CurriculumModule[], completed: Set<string>) {
  const target = modules.find((item) => item.prerequisites.every((id) => completed.has(id)) && !completed.has(item.id));
  return target ? `Avanza hasta completar el módulo ${target.number}: ${target.short}.` : "Defiende el capstone Professional de extremo a extremo.";
}
