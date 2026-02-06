import { CheckCircle, ChevronRight } from "lucide-react";
import type { Recommendation } from "../../api/types";

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

const difficultyConfig = {
  easy: {
    color: "var(--g-green)",
    bgColor: "var(--g-green-tint)",
    label: "Easy",
  },
  moderate: {
    color: "var(--g-orange)",
    bgColor: "var(--g-orange-tint)",
    label: "Moderate",
  },
  advanced: {
    color: "var(--g-red)",
    bgColor: "var(--g-red-tint)",
    label: "Advanced",
  },
};

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <div
        className="p-4 rounded-lg text-center"
        style={{ background: "var(--g-card-bg)" }}
      >
        <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--g-green)" }} />
        <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
          No recommendations at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec, idx) => {
        const difficulty = difficultyConfig[rec.difficulty];

        return (
          <div
            key={idx}
            className="p-4 rounded-lg"
            style={{ background: "var(--g-card-bg)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{
                  background: idx === 0 ? "var(--g-blue)" : "var(--g-card-bg)",
                  color: idx === 0 ? "white" : "var(--g-text-secondary)",
                  border: idx === 0 ? "none" : "1px solid var(--g-card-bg)",
                }}
              >
                {rec.priority}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-medium" style={{ color: "var(--g-text)" }}>
                    {rec.title}
                  </h4>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: difficulty.bgColor, color: difficulty.color }}
                  >
                    {difficulty.label}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: "var(--g-text-secondary)" }}>
                  {rec.description}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <ChevronRight className="w-3 h-3" style={{ color: "var(--g-green)" }} />
                  <span className="text-xs" style={{ color: "var(--g-green)" }}>
                    {rec.expected_impact}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
