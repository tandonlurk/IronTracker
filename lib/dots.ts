// DOTS coefficient formula for powerlifting strength comparison
// Accounts for bodyweight to allow comparison across weight classes

const MALE_COEFFS = [-0.000001093, 0.0007391293, -0.1918759221, 24.0900756, -1307.23, 47436.0];
const FEMALE_COEFFS = [-0.0000010706, 0.0005158568, -0.1126655495, 13.6175032, -701.6486, 24279.8];

function dotsCoefficient(bodyweightKg: number, gender: "male" | "female"): number {
  const bw = Math.min(Math.max(bodyweightKg, 40), 210);
  const coeffs = gender === "male" ? MALE_COEFFS : FEMALE_COEFFS;
  const denom =
    coeffs[0] * bw ** 5 +
    coeffs[1] * bw ** 4 +
    coeffs[2] * bw ** 3 +
    coeffs[3] * bw ** 2 +
    coeffs[4] * bw +
    coeffs[5];
  return 500 / denom;
}

export function calculateDots(
  liftKg: number,
  bodyweightKg: number,
  gender: "male" | "female"
): number {
  return Math.round(liftKg * dotsCoefficient(bodyweightKg, gender) * 100) / 100;
}

export function getDotsRank(score: number): { label: string; color: string } {
  if (score >= 500) return { label: "Elite", color: "#f59e0b" };
  if (score >= 400) return { label: "Master", color: "#8b5cf6" };
  if (score >= 300) return { label: "Advanced", color: "#3b82f6" };
  if (score >= 200) return { label: "Intermediate", color: "#22c55e" };
  if (score >= 120) return { label: "Novice", color: "#6b7280" };
  return { label: "Beginner", color: "#6b7280" };
}

export function getDotsPercentile(score: number, gender: "male" | "female"): number {
  // Approximate percentile based on population distribution
  const baseline = gender === "male" ? 180 : 130;
  const scale = gender === "male" ? 80 : 60;
  const percentile = Math.min(99, Math.max(1, Math.round(50 + ((score - baseline) / scale) * 34)));
  return percentile;
}
