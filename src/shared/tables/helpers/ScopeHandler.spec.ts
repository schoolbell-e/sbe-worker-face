import ScopeHandler from './ScopeHandler';

/**
 * npm run test -- src/shared/tables/helpers/ScopeHandler.spec.ts
 */
describe('ScopeHandler test', () => {
  it('migrateScopes()', () => {
    // old type
    expect(
      ScopeHandler.migrateScopes('studentparent_all')).toEqual(['student','parent1','parent2']);
    expect(ScopeHandler.migrateScopes('studentparent_col_1')).toEqual(['student']);
    expect(ScopeHandler.migrateScopes('studentparent_col_2')).toEqual(['parent1']);
    expect(ScopeHandler.migrateScopes('studentparent_col_3')).toEqual(['parent2']);
    expect(
      ScopeHandler.migrateScopes('studentparent_row_name')).toEqual(['student_name','parent1_name','parent2_name']);
    expect(ScopeHandler.migrateScopes('studentparent_col_1_of_row_name')).toEqual(['student_name']);
    expect(ScopeHandler.migrateScopes('studentparent_col_2_of_row_name')).toEqual(['parent1_name']);
    expect(ScopeHandler.migrateScopes('studentparent_col_3_of_row_name')).toEqual(['parent2_name']);

    expect(ScopeHandler.migrateScopes('faculty_all')).toEqual(['faculty']);
    expect(ScopeHandler.migrateScopes('faculty_col_1')).toEqual(['faculty']);
    expect(ScopeHandler.migrateScopes('faculty_row_name')).toEqual(['faculty_name']);
    expect(ScopeHandler.migrateScopes('faculty_col_1_of_row_name')).toEqual(['faculty_name']);

    // new type
    expect(ScopeHandler.migrateScopes('faculty')).toEqual(['faculty']);
    expect(ScopeHandler.migrateScopes('faculty_name')).toEqual(['faculty_name']);
  });
});
