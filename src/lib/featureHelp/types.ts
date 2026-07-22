export type FeatureHelpStep = {
  /** document.querySelector(`[data-help-id="${targetId}"]`) */
  targetId: string;
  title: string;
  description: string;
  /** 툴팁을 타깃 위/아래에 둘지 (미지정 시 자동) */
  placement?: "above" | "below" | "auto";
  /** 하이라이트 패딩(px) */
  padding?: number;
};

export type FeatureHelpTour = {
  id: string;
  steps: FeatureHelpStep[];
};
