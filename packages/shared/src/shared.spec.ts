import { describe, expect, it } from 'vitest';
import { ComplexityMode, meetsComplexity } from './complexity.js';
import { ADMINISTRATOR_PERMISSION, DashboardPermission, hasPermission } from './permissions.js';
import { AutomodLogic, emptyConditionGroup } from './automod.js';

describe('meetsComplexity', () => {
  it('allows higher modes to see lower requirements', () => {
    expect(meetsComplexity(ComplexityMode.Expert, ComplexityMode.Advanced)).toBe(true);
    expect(meetsComplexity(ComplexityMode.Advanced, ComplexityMode.Advanced)).toBe(true);
  });

  it('hides higher requirements from lower modes', () => {
    expect(meetsComplexity(ComplexityMode.Simple, ComplexityMode.Advanced)).toBe(false);
  });
});

describe('hasPermission', () => {
  it('respects the wildcard permission', () => {
    expect(hasPermission([ADMINISTRATOR_PERMISSION], DashboardPermission.ManageSettings)).toBe(
      true,
    );
  });

  it('checks for the specific permission otherwise', () => {
    expect(
      hasPermission([DashboardPermission.ViewMembers], DashboardPermission.ManageMembers),
    ).toBe(false);
    expect(
      hasPermission([DashboardPermission.ManageMembers], DashboardPermission.ManageMembers),
    ).toBe(true);
  });
});

describe('emptyConditionGroup', () => {
  it('creates an AND group with no children', () => {
    const group = emptyConditionGroup();
    expect(group.logic).toBe(AutomodLogic.And);
    expect(group.children).toHaveLength(0);
  });
});
