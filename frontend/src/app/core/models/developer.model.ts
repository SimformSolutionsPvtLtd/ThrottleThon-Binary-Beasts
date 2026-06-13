export interface Developer {
  pseudonym: string;
  role: string;
  department: string;
  tenureYears: number;
  costBand: string;
  skills: Skill[];
  currentAllocation: {
    project: string;
    percent: number;
  };
  availablePercent?: number;
}

export interface Skill {
  tech: string;
  proficiency: number;
  source: string;
}

export interface Allocation {
  devPseudonym: string;
  scenarioExternalId: string;
  allocationPercent: number;
}
