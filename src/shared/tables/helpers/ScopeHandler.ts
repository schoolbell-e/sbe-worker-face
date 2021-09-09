import { flatten } from 'lodash';

class ScopeHandler {
  /**
   *
   * @param old_scope_str
   *
   * migration from old type scope to new type scope(s) : ${member_type}_${member_name}
   *
   * all => all
   * studentparent_all => student, parent1, parent2
   * studentparent_col_1 => student
   * studentparent_col_2 => parent1
   * studentparent_col_3 => parent2
   * studentparent_row_name => student_name, parent1_name, parent2_name
   * studentparent_col_1_of_row_name => student_name
   * studentparent_col_2_of_row_name => parent1_name
   * studentparent_col_3_of_row_name => parent2_name
   *
   */
  migrateScopes(old_scope_str: string): string[] {
    if (!old_scope_str) return [];
    const new_scope_arr = flatten(
      old_scope_str
        .split(',')
        .filter(v => v)
        .map(scope => {
          let match,
            scopes: string[] = [];
          if ((match = scope.match(/^([^_]+)_all$/))) {
            if (match[1] === 'studentparent') {
              scopes.push('student');
              scopes.push('parent1');
              scopes.push('parent2');
            } else scopes.push(match[1]);
          } else if ((match = scope.match(/^([^_]+)_col_([\d]+)$/))) {
            if (match[1] === 'studentparent') {
              switch (Number(match[2])) {
                case 1:
                  scopes.push('student');
                  break;
                case 2:
                  scopes.push('parent1');
                  break;
                case 3:
                  scopes.push('parent2');
                  break;
                default:
                  throw new Error(`Cannot understand ${scope}`);
              }
            } else scopes.push(match[1]);
          } else if ((match = scope.match(/^([^_]+)_row_(.+)$/))) {
            if (match[1] === 'studentparent') {
              scopes.push(`student_${match[2]}`);
              scopes.push(`parent1_${match[2]}`);
              scopes.push(`parent2_${match[2]}`);
            } else scopes.push(`${match[1]}_${match[2]}`);
          } else if (
            (match = scope.match(/^([^_]+)_col_([\d]+)_of_row_(.+)$/))
          ) {
            if (match[1] === 'studentparent') {
              switch (Number(match[2])) {
                case 1:
                  scopes.push(`student_${match[3]}`);
                  break;
                case 2:
                  scopes.push(`parent1_${match[3]}`);
                  break;
                case 3:
                  scopes.push(`parent2_${match[3]}`);
                  break;
                default:
                  throw new Error(`Cannot understand ${scope}`);
              }
            } else scopes.push(`${match[1]}_${match[3]}`);
          } else {
            scopes.push(scope);
          }
          return scopes;
        }),
    );
    return new_scope_arr;
  }

  matchScopes(scopesA: string[], scopesB: string[]): boolean {
    return scopesA.find(scopeA => {
      return scopesB.includes(scopeA);
    })
      ? true
      : false;
  }
}

export default new ScopeHandler();
