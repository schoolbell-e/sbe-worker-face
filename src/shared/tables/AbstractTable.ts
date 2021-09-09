import { MYSQL } from '@schoolbell-e/backend.servers';
import { OkPacket } from 'mysql2';
import { flatten, groupBy, map, omit, pick, pickBy, sum } from 'lodash';


export type SqlQueryValue = {
  // [key: string]: string | number | boolean | Date | undefined | null | Array<string> | [v1:number, v2:number]
  [key: string]: string | number | boolean | Date | undefined | null | Array<string> | Array<number>
}

export type ReservedKeys = {
  limit?:number, orderBy?:string[]|string
}

export class AbstractTable {
  table_name: string = '';
  id_fields: string[] = []; // these columns share a same shard and does not carry shard info.
  columns_to_pad_for_compatibility: string[] = [];

  protected removeHostFromValue(conditions: Partial<SqlQueryValue>): Partial<SqlQueryValue> {
    let picked:any = pickBy(conditions, v=>v !== undefined && (!Array.isArray(v) || v.length > 0));
    this.id_fields.forEach(col => {
      ['', '__gt', '__lt', '__not', '__like'].forEach(appendix=>{
        const key = `${col}${appendix}`;
        let value = picked[key];
        if (typeof value === 'string') {
          picked[key] = MYSQL.splitDatabaseIdAndValue(value)[1];
        } else if (Array.isArray(value)) {
          picked[key] = value.map(li => MYSQL.splitDatabaseIdAndValue(li)[1]);
        }
      })
    });
    return picked;
  }
  protected addDatabaseIdToValue(
    db_id: number,
    rows: { [key: string]: any }[],
    id_fields = this.id_fields,
    columns_to_pad_for_compatibility = this.columns_to_pad_for_compatibility,
  ): { [key: string]: any }[] {
    return rows.map(row => {
      id_fields.forEach(key => {
        const value = row[key];
        if (!value) return;
        row[key] = `${db_id}:${value}`;
      });
      columns_to_pad_for_compatibility.forEach(key => {
        const value = row[key];
        if (!value || value.indexOf(':') !== -1) return;
        row[key] = `0:${value}`;
      });
      return row;
    });
  }

  protected getDatabaseIdFromValue (ob: Partial<SqlQueryValue>):{db_id:number, value:SqlQueryValue}[] {
    let pairs:{db_id:number, value:Partial<SqlQueryValue>}[] = [];
    for (let key in ob) {
      const value = ob[key];
      if (!this.id_fields.includes(key)) continue;
      if (Array.isArray(value) && typeof value[0] === 'string') {
        const grouped = groupBy(value as string[], li=>MYSQL.splitDatabaseIdAndValue(li)[0]);
        map(grouped, (list, db_id)=>{
          pairs.push({db_id:Number(db_id), value : { ...ob, [key]:list }});
        });
      }
      else if (typeof value === 'string'){
        const db_id = MYSQL.splitDatabaseIdAndValue(value)[0];
        pairs.push({db_id, value:ob});
      }
    }
    return pairs;
  }
  // Only one key with an array value should exist if does exist.
  protected async _get(
    _conditions: {
      // [key: string]: string | number | undefined | null | Array<string> | [v1:number, v2:number];
      [key: string]: string | number | undefined | null | Array<string> | Array<number>;
    },
    db_id?:number
  ) {
    let pairs = typeof db_id === 'number' ? [{db_id, value:_conditions}] : this.getDatabaseIdFromValue(_conditions);
    if (!pairs || pairs.length === 0) {
      pairs = (await MYSQL.getPools()).map(({db_id})=>{ return { db_id, value:_conditions}; });
    }  
    return await Promise.all(pairs.map(({db_id, value:conditions})=>{
      const reserved_keys = ['orderBy', 'limit'];
      const reserved = pick(conditions, reserved_keys); 
      conditions = this.removeHostFromValue(omit(conditions, reserved_keys));
      return MYSQL.getPools(db_id)
      .then(list=>list[0])
      .then(({db_id, connection})=>{
          let query = `
                  SELECT 
                      * 
                  FROM ${connection.escapeId('schoolbelle.' + this.table_name)} 
                  WHERE 1 `;
          for (let key in conditions) {
            let value = conditions[key];
            if (key.match(/__not$/)) { 
              key = key.replace(/__not$/, '');
              if (Array.isArray(value)) {
                if (typeof value[0] === 'string') query += `
                    AND ${connection.escapeId(key)} NOT IN (${connection.escape(value)}) `;
                if (typeof value[0] === 'number') query += `
                    AND ${connection.escapeId(key)} < ${connection.escape(value[0])} `; 
                if (typeof value[1] === 'number') query += `
                    AND ${connection.escapeId(key)} >= ${connection.escape(value[1])}` ;
  
              }
              else if (value === null) query += `
                    AND ${connection.escapeId(key)} IS NOT NULL `;            
              else query += `
                    AND ${connection.escapeId(key)} != ${connection.escape(value)} `;                        
            }
            else if (key.match(/__lt$/)) { key = key.replace(/__lt$/, ''); 
              if (typeof value === 'string' || typeof value === 'string') query += `
                    AND ${connection.escapeId(key)} < ${connection.escape(value)} `;                                  
              else throw new Error('less than value should be string.');
            }
            else if (key.match(/__gt$/)) { key = key.replace(/__gt$/, ''); 
              if (typeof value === 'string' || typeof value === 'string') query += `
                    AND ${connection.escapeId(key)} > ${connection.escape(value)} `;                                  
              else throw new Error('greater than value should be string.');
            }
            else if (key.match(/__like$/)) { key = key.replace(/__like$/, ''); 
              if (typeof value === 'string' || typeof value === 'string') query += `
                    AND ${connection.escapeId(key)} like ${connection.escape(value)} `;                                  
              else throw new Error('greater than value should be string.');
            }
            else {
              if (Array.isArray(value)) {
                if (typeof value[0] === 'string') query += `
                    AND ${connection.escapeId(key)} IN (${connection.escape(value)}) `;
                if (typeof value[0] === 'number') query += `
                    AND ${connection.escapeId(key)} >= ${connection.escape(value[0])} `; 
                if (typeof value[1] === 'number') query += `
                    AND ${connection.escapeId(key)} < ${connection.escape(value[1])}` ;
              }
              else if (value === null) query += `
                    AND ${connection.escapeId(key)} IS NULL `;            
              else query += `
                    AND ${connection.escapeId(key)} = ${connection.escape(value)} `;            
            }
          }
          for(let key in reserved) {
            let value = reserved[key];
            if (key === 'orderBy') {
              if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'string' && typeof value[1] === 'string') {
                const [column, direction] = value;
                if (!column) throw new Error('Column value missing.');
                query += `
                  ORDER BY ${connection.escapeId(column)} `;
                if (direction.toLowerCase() === 'desc') query += `DESC `;
                else if (direction.toLowerCase() === 'asc') query += `ASC `;
              } 
              else if (typeof value === 'string') {
                query += `
                  ORDER BY ${connection.escapeId(value)} `;
              }
              else {
                throw new Error('Not supported');
              }
            }
            else if (key === 'limit') {
              if (typeof value === 'number') {
                query += `
                  LIMIT ${connection.escape(value)} `;
              }
              else {
                throw new Error('Not supported');
              }
            }
  
          }
          return connection
            .query<any[]>(query)
            .then(([rows]) => rows)
            .then(rows => {
              return this.addDatabaseIdToValue(db_id, rows);
            });
      });
    }))
    .then((chunk) => flatten(chunk));
  }
  protected async _insert(
    _params: { [key: string]: string | number | boolean | Date | undefined | null },
    db_id_to_use?:number
  ): Promise<string> {
    const pairs = typeof db_id_to_use === 'number' ? [{db_id:db_id_to_use, value:_params}] : this.getDatabaseIdFromValue(_params);
    const {db_id, connection} = (await MYSQL.getPools(pairs[0] && typeof pairs[0].db_id === 'number' ? pairs[0].db_id : undefined, true))[0];
    const params = this.removeHostFromValue(_params);
    let query = `
            INSERT INTO ${connection.escapeId('schoolbelle.' + this.table_name)}
            SET ${connection.escape(params)}`;

    let [result] = await connection.query<OkPacket>(query);
    return `${db_id}:${result.insertId}`;
  }
  protected async _update(
    _params: {
      [key: string]: string | number | boolean | Date | undefined | null;
    },
    _conditions: {
      [key: string]: string | number | boolean | Date | undefined | null | Array<string>;
    },
    db_id?:number
  ) {
    let pairs = typeof db_id === 'number' ? [{db_id, value:_conditions}] : this.getDatabaseIdFromValue(_conditions);
    if (!pairs || pairs.length === 0) {
      pairs = (await MYSQL.getPools()).map(({db_id})=>{ return { db_id, value:_conditions}; });
    }  
    return await Promise.all(pairs.map(({db_id, value:conditions})=>{
      const params = this.removeHostFromValue(_params);
      conditions = this.removeHostFromValue(_conditions);
      return MYSQL.getPools(db_id)
      .then(list=>list[0])
      .then(({connection})=>{
          let query = `
                  UPDATE ${connection.escapeId('schoolbelle.' + this.table_name)}
                  SET ${connection.escape(params)}
                  WHERE 1 `;
          for (let key in conditions) {
            let value = conditions[key];
            if (key.match(/__not$/)) { key = key.replace(/__not$/, '');
              if (Array.isArray(value)) query += `
                    AND ${connection.escapeId(key)} NOT IN (${connection.escape(value)}) `;
              else if (value === null) query += `
                    AND ${connection.escapeId(key)} IS NOT NULL `;            
              else query += `
                    AND ${connection.escapeId(key)} != ${connection.escape(value)} `;                        
            }
            else {
              if (Array.isArray(value)) query += `
                    AND ${connection.escapeId(key)} IN (${connection.escape(value)}) `;
              else if (value === null) query += `
                    AND ${connection.escapeId(key)} IS NULL `;            
              else query += `
                    AND ${connection.escapeId(key)} = ${connection.escape(value)} `;            
            }
          }  
          return connection
            .query<OkPacket>(query)
            .then(([result]) => {
              return result.affectedRows });        
      });
    }))
    .then(list=>{
      return sum(list)});  


  }
  protected async _delete(
    _conditions: {
      [key: string]: string | number | boolean | Date | undefined | null | Array<string>;
    },
    db_id?:number
  ): Promise<number> {
    let pairs = typeof db_id === 'number' ? [{db_id, value:_conditions}] : this.getDatabaseIdFromValue(_conditions);
    if (!pairs || pairs.length === 0) {
      pairs = (await MYSQL.getPools()).map(({db_id})=>{ return { db_id, value:_conditions}; });
    }  
    return await Promise.all(pairs.map(({db_id, value:conditions})=>{
      conditions = this.removeHostFromValue(conditions);
      return MYSQL.getPools(db_id)
      .then(list=>list[0])
      .then(({connection})=>{
        let query = `
                DELETE 
                FROM ${connection.escapeId('schoolbelle.' + this.table_name)} 
                WHERE 1 `;
        for (let key in conditions) {
          let value = conditions[key];
          if (key.match(/__not$/)) { key = key.replace(/__not$/, '');
            if (Array.isArray(value)) query += `
                  AND ${connection.escapeId(key)} NOT IN (${connection.escape(value)}) `;
            else if (value === null) query += `
                  AND ${connection.escapeId(key)} IS NOT NULL `;            
            else query += `
                  AND ${connection.escapeId(key)} != ${connection.escape(value)} `;                        
          }
          else {
            if (Array.isArray(value)) query += `
                  AND ${connection.escapeId(key)} IN (${connection.escape(value)}) `;
            else if (value === null) query += `
                  AND ${connection.escapeId(key)} IS NULL `;            
            else query += `
                  AND ${connection.escapeId(key)} = ${connection.escape(value)} `;            
          }
        }
        return connection
          .query<OkPacket>(query)
          .then(([result]) => result.affectedRows);
      });
    }))
    .then(list=>sum(list));
  }

  async truncate () {
    const pairs = await MYSQL.getPools();
    const chunks = await Promise.all(
      pairs.map(({connection}) => {

        let query = `TRUNCATE ${connection.escapeId('schoolbelle.' + this.table_name)}`;
        return connection
          .query<OkPacket>(query)
          .then(([result]) => result);        
      })
    );
    return sum(chunks);
  }
}