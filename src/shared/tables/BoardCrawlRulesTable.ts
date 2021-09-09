import { AbstractTable } from './AbstractTable';

export type ExtractionType =
  | 'innerHTML'
  | 'textNodes'
  | 'timestamp'
  | 'download'
  | 'inputValue'
  | 'url'
  | 'static';
export type CrawlingTargets = {
  [key: string]: { selector?: string; type: ExtractionType; must?: boolean };
};
export type ActionSelectorOrder = {
  selector: string;
  type: 'asc' | 'desc'; // order direction
  gt?: any;
  lt?: any;
  click?: string;
  extractionType?: ExtractionType;
};
export type ActionType = 'click' | 'input' | 'clickOnly';
export type MixedActionDescriptor = string | AdvancedActionDescriptor;
export type AdvancedActionDescriptor = {
  selector: string;
  order?: ActionSelectorOrder;
  index?: number;
  type?: ActionType;
  inputValue?: string;
  onSuccess?: MixedActionDescriptor[];
};
export type BoardCrawlItemData = {
  url: string;
  clicks: MixedActionDescriptor[];
  targets: CrawlingTargets;
};
export type BoardCrawlRuleItem = {
  rule_id: string;
  group_id: string;
  board_type: string;
  user_id: string;
  data: BoardCrawlItemData;
  starts_at?: Date; // ms timestamp; items created at before starts_at will not be crawled.
  should_push?: boolean;
  should_update?: boolean;
  should_delete?: boolean;
};
class BoardCrawlRulesTable extends AbstractTable {
  table_name = 'board_crawl_rules';
  id_fields = ['rule_id', 'group_id'];
  columns_to_pad_for_compatibility = ['user_id'];

  async get(params: {
    rule_id?: string;
    group_id?: string;
    board_type?: string;
  }) {
    const { rule_id, group_id } = params;
    if (!rule_id && !group_id) throw new Error('Not enough params.');
    const list = await this._get({ deleted_at: null, ...params });

    return list.map(li => {
      if (li.data) li.data = JSON.parse(li.data);
      return li;
    }) as BoardCrawlRuleItem[];
  }
  async insert(params: {
    group_id: string; // required
    board_type: string; // required
    user_id: string; // required
    data?: {
      url: string;
      clicks: MixedActionDescriptor[];
      targets: CrawlingTargets;
    };
    starts_at?: number; // ms timestamp; items created at before starts_at will not be crawled.
    should_push?: boolean;
    should_update?: boolean;
    should_delete?: boolean;
  }): Promise<string> {
    const { group_id, board_type, user_id } = params;
    if (!group_id || !board_type || !user_id)
      throw new Error('Not enough params.');
    return await this._insert({
      ...params,
      data: params.data ? JSON.stringify(params.data) : undefined,
    });
  }
  async delete(params: {
    board_id?: string;
    group_id?: string;
  }): Promise<number> {
    const { board_id, group_id } = params;
    if (!board_id && !group_id) throw new Error('Not enough params.');
    return await this._update(
      { deleted_at: new Date() },
      { ...params, deleted_at: null },
    );
  }
}

export default new BoardCrawlRulesTable();
