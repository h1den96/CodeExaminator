export const normalizeOutput = (str: string | null): string => {
  if (!str) return "";
  return str
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .join(" ")
    .trim();
};

export const calculatePartialGrade = (
  results: any[],
  totalPoints: number,
): number => {
  const passed = results.filter((r) => r.status === "Passed").length;
  if (results.length === 0) return 0;
  const score = (passed / results.length) * totalPoints;
  return Math.round(score * 100) / 100;
};
