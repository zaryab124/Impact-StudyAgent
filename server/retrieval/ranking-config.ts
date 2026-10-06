// ==============================================================================
// AI Live Paper Generator - Versioned Ranking Configuration Registry (Phase 6)
// Provides configurable, versioned hybrid ranking weights (Semantic, Keyword, Metadata)
// ==============================================================================

export interface RankingWeights {
  semantic: number;
  keyword: number;
  metadata: number;
}

export interface RankingConfig {
  version: string;
  name: string;
  description: string;
  weights: RankingWeights;
  isDefault?: boolean;
}

export class RankingConfigRegistry {
  public static readonly DEFAULT_VERSION = "v1.0.0";

  private static configs: Map<string, RankingConfig> = new Map([
    [
      "v1.0.0",
      {
        version: "v1.0.0",
        name: "Production Baseline Hybrid Ranking",
        description: "Initial production baseline: 55% semantic, 25% keyword, 20% metadata",
        weights: {
          semantic: 0.55,
          keyword: 0.25,
          metadata: 0.20,
        },
        isDefault: true,
      },
    ],
    [
      "v1.1.0-semantic-heavy",
      {
        version: "v1.1.0-semantic-heavy",
        name: "Semantic Heavy Hybrid Ranking",
        description: "Emphasizes deep conceptual similarity: 70% semantic, 15% keyword, 15% metadata",
        weights: {
          semantic: 0.70,
          keyword: 0.15,
          metadata: 0.15,
        },
      },
    ],
    [
      "v1.1.0-keyword-heavy",
      {
        version: "v1.1.0-keyword-heavy",
        name: "Keyword Precision Hybrid Ranking",
        description: "Emphasizes exact terminology and nomenclature: 40% semantic, 40% keyword, 20% metadata",
        weights: {
          semantic: 0.40,
          keyword: 0.40,
          metadata: 0.20,
        },
      },
    ],
  ]);

  private static activeVersion: string = RankingConfigRegistry.DEFAULT_VERSION;

  /**
   * Retrieves the default production ranking configuration (v1.0.0).
   */
  public static getDefaultConfig(): RankingConfig {
    return this.configs.get(this.DEFAULT_VERSION)!;
  }

  /**
   * Retrieves a ranking configuration by version, or falls back to active/default.
   */
  public static getConfig(version?: string): RankingConfig {
    if (version && this.configs.has(version)) {
      return this.configs.get(version)!;
    }
    return this.configs.get(this.activeVersion) || this.getDefaultConfig();
  }

  /**
   * Registers or updates a versioned ranking configuration dynamically.
   */
  public static registerConfig(config: RankingConfig): void {
    // Validate weights sum to ~1.0
    const sum = config.weights.semantic + config.weights.keyword + config.weights.metadata;
    if (Math.abs(sum - 1.0) > 0.05) {
      throw new Error(
        `Invalid ranking configuration weights for version "${config.version}": weights sum to ${sum}, must sum to ~1.0`
      );
    }
    this.configs.set(config.version, { ...config });
  }

  /**
   * Sets the active global default ranking version.
   */
  public static setActiveVersion(version: string): void {
    if (!this.configs.has(version)) {
      throw new Error(`Ranking configuration version "${version}" not registered.`);
    }
    this.activeVersion = version;
  }

  /**
   * Gets the active global default ranking version.
   */
  public static getActiveVersion(): string {
    return this.activeVersion;
  }

  /**
   * Lists all available ranking configurations.
   */
  public static listConfigs(): RankingConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Resets registry to default initial state (useful for test isolation).
   */
  public static resetToDefaults(): void {
    this.activeVersion = this.DEFAULT_VERSION;
  }
}
