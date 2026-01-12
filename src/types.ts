export type ActiveJobDto = {
  jobId: string;
  name: string;
  status: "Running" | "Completed" | string;
  startedAtUtc: string;
  completedAtUtc: string;
  remainingSeconds: number;
  reward: number;
};

export type JobDefDto = {
  id: string;
  name: string;
  baseSeconds: number;
  baseReward: number;
  requiredLevel: number;
};

export type UpgradeDto = {
  id: string;
  name: string;
  type: string;
  level: number;
  nextCost: number;
};

export type WorkshopStateDto = {
  workshopId: string;
  money: number;
  level: number;
  exp: number;
  activeJob: ActiveJobDto | null;
  jobs: JobDefDto[];
  upgrades: UpgradeDto[];
};
