export const normalizeOutput = (str: string | null): string => {
  if (!str) return "";
  return str
    .replace(/\r\n/g, "\n") // Standardize line endings
    .split("\n") // Split by line
    .map((line) => line.trim()) // Trim each line
    .filter((line) => line !== "") // Remove empty lines
    .join(" ") // Join into a single space-separated string
    .trim(); // Final cleanup
};

export const calculatePartialGrade = (
  results: any[],
  totalPoints: number,
): number => {
  const passed = results.filter((r) => r.status === "Passed").length;
  if (results.length === 0) return 0;
  const score = (passed / results.length) * totalPoints;
  return Math.round(score * 100) / 100; // Round to 2 decimals
};
