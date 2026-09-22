import { presets } from "../presets/index.js";
import { registry } from "../rules/registry.js";
import type {
  AnyRuleDefinition,
  HumyOptions,
  RuleId,
  RuleSettings,
} from "./types.js";

export interface ResolvedRule {
  rule: AnyRuleDefinition;
  options: Record<string, unknown>;
}

function enabledSetting(setting: RuleSettings[RuleId]): boolean {
  return (
    setting === true ||
    (typeof setting === "object" && setting !== null && setting.enabled)
  );
}

export function resolveRules(options: HumyOptions = {}): ResolvedRule[] {
  const presetName = options.preset === undefined ? "natural" : options.preset;
  const settings: RuleSettings =
    presetName === false ? {} : { ...presets[presetName] };
  if (options.rules) Object.assign(settings, options.rules);

  const resolved: ResolvedRule[] = [];
  for (const rule of registry) {
    const setting = settings[rule.id];
    if (!enabledSetting(setting)) continue;
    const supplied =
      typeof setting === "object" && setting !== null ? setting : {};
    const { enabled: _enabled, ...ruleOptions } = supplied as Record<
      string,
      unknown
    >;
    resolved.push({
      rule,
      options: { ...rule.defaultOptions, ...ruleOptions },
    });
  }
  return resolved;
}
