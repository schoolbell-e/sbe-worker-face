import { values } from 'lodash';
import { AbstractTable } from './AbstractTable';

export type BoardItem = {
  group_id: string;
  board_type: string;
  enabled: boolean;
};

class BoardsTable extends AbstractTable {
  table_name = 'boards';
  id_fields = ['board_id', 'group_id'];
  columns_to_pad_for_compatibility = ['user_id'];

  async get(params: {
    board_id?: string;
    group_id?: string;
    board_type?: string;
  }) {
    const { board_id, group_id } = params;
    if (!board_id && !group_id) throw new Error('Not enough params.');
    const list = await this._get({ deleted_at_v2: 0, ...params });

    return list.map(li => {
      if (li.targets) li.targets = JSON.parse(li.targets);
      return li;
    }) as BoardItem[];
  }
  async insert(params: {
    group_id: string; // required
    board_type: string; // required
    user_id: string; // required
    board_name?: string;
  }): Promise<string> {
    const { group_id, board_type, user_id } = params;
    if (!group_id || !board_type || !user_id)
      throw new Error('Not enough params.');
    return await this._insert(params);
  }
  async delete(params: {
    board_id?: string;
    group_id?: string;
  }): Promise<number> {
    const { board_id, group_id } = params;
    if (!board_id && !group_id) throw new Error('Not enough params.');
    return await this._update(
      { deleted_at_v2: Date.now() / 1000 },
      { ...params, deleted_at_v2: 0 },
    );
  }

  supplementWithDefaultBoards(list: any[], group_type: string): BoardItem[] {
    if (group_type.match(/^school/)) {
      list = list.concat([
        {
          level: 10,
          board_type: 'schoolnews',
          enabled: true,
          allow_comment: false,
          public: true,
          permissions: {
            settings: [],
            manage: ['faceadmin', 'admin'],
            write: ['faceadmin', 'admin', 'faculty'],
            read: [
              'faceadmin',
              'admin',
              'faculty',
              'parent',
              'student',
              'unknown',
            ],
          },
          priority: 0,
        },
        {
          level: 10,
          board_type: 'classnews',
          enabled: group_type.match(/middle|high/) ? true : false,
          allow_comment: false,
          public: true,
          permissions: {
            settings: [],
            manage: ['faceadmin', 'admin'],
            write: ['faceadmin', 'admin', 'faculty'],
            read: [
              'faceadmin',
              'admin',
              'faculty',
              'parent',
              'student',
              'unknown',
            ],
          },
          priority: 1,
        },
        {
          level: 10,
          board_type: 'photo',
          enabled: group_type.match(/middle|high/) ? true : false,
          allow_comment: false,
          public: true,
          permissions: {
            settings: [],
            manage: ['faceadmin', 'admin'],
            write: ['faceadmin', 'admin', 'faculty'],
            read: [
              'faceadmin',
              'admin',
              'faculty',
              'parent',
              'student',
              'unknown',
            ],
          },
          priority: 2,
        },
        {
          level: 10,
          board_type: 'facultynews',
          enabled: true,
          allow_comment: false,
          public: false,
          permissions: {
            settings: [],
            manage: ['faceadmin', 'admin'],
            write: ['faceadmin', 'admin', 'faculty'],
            read: ['faceadmin', 'admin', 'faculty'],
          },
          priority: 3,
        },
      ]);
    } else {
      switch (group_type) {
        case 'openclass':
          list = list.concat([
            {
              level: 10,
              board_type: 'schoolnews',
              enabled: true,
              allow_comment: true,
              public: false,
              permissions: {
                settings: [],
                manage: ['faceadmin', 'admin'],
                write: ['faceadmin', 'admin', 'faculty'],
                read: [
                  'faceadmin',
                  'admin',
                  'faculty',
                  'parent',
                  'student',
                  'unknown',
                ],
              },
            },
            {
              level: 10,
              // 'board_name':self::$translation['board_name'][lang]['classnews'],
              board_type: 'classnews',
              enabled: true,
              allow_comment: false,
              public: false,
              permissions: {
                settings: [],
                manage: ['faceadmin', 'admin'],
                write: ['faceadmin', 'admin', 'faculty'],
                read: [
                  'faceadmin',
                  'admin',
                  'faculty',
                  'parent',
                  'student',
                  'unknown',
                ],
              },
            },
            {
              level: 10,
              // 'board_name':self::$translation['board_name'][lang]['photo'],
              board_type: 'photo',
              enabled: true,
              allow_comment: true,
              public: false,
              permissions: {
                settings: [],
                manage: ['faceadmin', 'admin'],
                write: ['faceadmin', 'admin', 'faculty', 'parent', 'student'],
                read: [
                  'faceadmin',
                  'admin',
                  'faculty',
                  'parent',
                  'student',
                  'unknown',
                ],
              },
            },
            {
              // old compatibility
              level: 10,
              // 'board_name':self::$translation['board_name'][lang]['photo'],
              board_type: 'photos',
              enabled: true,
              allow_comment: true,
              public: false,
              permissions: {
                settings: [],
                manage: ['faceadmin', 'admin'],
                write: ['faceadmin', 'admin', 'faculty', 'parent', 'student'],
                read: [
                  'faceadmin',
                  'admin',
                  'faculty',
                  'parent',
                  'student',
                  'unknown',
                ],
              },
            },
          ]);
          break;
        default:
          list = list.concat(list, [
            {
              level: 10,
              board_type: 'schoolnews',
              enabled: true,
              allow_comment: false,
              public: false,
              permissions: {
                settings: [],
                manage: ['faceadmin', 'admin'],
                write: ['faceadmin', 'admin', 'faculty'],
                read: [
                  'faceadmin',
                  'admin',
                  'faculty',
                  'parent',
                  'student',
                  'unknown',
                ],
              },
              priority: 0,
            },
            {
              level: 10,
              board_type: 'classnews',
              enabled: true,
              allow_comment: false,
              public: false,
              permissions: {
                settings: [],
                manage: ['faceadmin', 'admin'],
                write: ['faceadmin', 'admin', 'faculty'],
                read: [
                  'faceadmin',
                  'admin',
                  'faculty',
                  'parent',
                  'student',
                  'unknown',
                ],
              },
              priority: 1,
            },
            {
              level: 10,
              board_type: 'photo',
              enabled: true,
              allow_comment: true,
              public: false,
              permissions: {
                settings: [],
                manage: ['faceadmin', 'admin'],
                write: ['faceadmin', 'admin', 'faculty', 'parent', 'student'],
                read: [
                  'faceadmin',
                  'admin',
                  'faculty',
                  'parent',
                  'student',
                  'unknown',
                ],
              },
              priority: 2,
            },
            {
              level: 10,
              board_type: 'photo',
              enabled: true,
              allow_comment: true,
              public: false,
              permissions: {
                settings: [],
                manage: ['faceadmin', 'admin'],
                write: ['faceadmin', 'admin', 'faculty', 'parent', 'student'],
                read: [
                  'faceadmin',
                  'admin',
                  'faculty',
                  'parent',
                  'student',
                  'unknown',
                ],
              },
              priority: 3,
            },
          ]);
      }
    }

    // add display to old types of board
    list.forEach((li, index) => {
      switch (li['board_type']) {
        case 'schoolnews':
        case 'facultynews':
        case 'facultyboard':
          list[index]['display'] = 'short';
          break;
        case 'classnews':
          list[index]['display'] = 'long';
          break;
        case 'photos':
        case 'photo':
          list[index]['display'] = 'media';
          break;
        default:
          if (!list[index]['display']) list[index]['display'] = 'short';
      }
    });

    const grouped: { [key: string]: any } = {};
    list.forEach(li => {
      const same_type_in_data = grouped[li['board_type']];
      if (
        !same_type_in_data ||
        same_type_in_data['level'] > li['level'] ||
        (same_type_in_data['level'] === li['level'] &&
          same_type_in_data['created_at'] &&
          li['created_at'] &&
          same_type_in_data['created_at'] < li['created_at'])
      ) {
        grouped[li['board_type']] = li;
      }
    });
    return values(grouped);
  }
}

export default new BoardsTable();
