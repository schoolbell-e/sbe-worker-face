import { isMatch } from 'lodash';
import mysql from 'mysql2';
import { Pool as PromisePool } from 'mysql2/promise';
import fetch from "node-fetch";
import sleep from 'sleep-promise';

import {
  MYSQL_SOCKET_PATH,
  CLOUDSQL_USER,
  CLOUDSQL_PASSWORD,
  ENVIRONMENT,
  DEFAULT_MYSQL_HOST,
  MYSQL_PROJECT_NAME,
  CLOUDSQL_DATABASE,
  SHARDED_MYSQL_HOSTS,
} from '@schoolbell-e/backend.util';
const weightedRandom = require('weighted-random');

export interface DatabaseCandidate {
  db_id: number;
  region:string;
  host: string;
  weight: number;
};

export class Mysql {
  public region:string = '';
  
  
  private isReady:boolean|Error = false;
  private ready!: Promise<any>;
  private global!: PromisePool & mysql.Pool;
  private dblist: DatabaseCandidate[] = [];

  
  constructor() {
    if (!DEFAULT_MYSQL_HOST) throw new Error(`DEFAULT_MYSQL_HOST not found`);
    this.dblist.push({
      db_id: 0,
      region:'asia-northeast1',
      weight: 1,
      host:DEFAULT_MYSQL_HOST,      
    });
  }

  private async init (refreshForce:boolean = false) {
    // if mysql is already inited or being inited, break here.
    if (
      refreshForce === false 
      && typeof this.ready !== 'undefined' && typeof this.isReady === 'boolean' // if set to error instance, should rerun the init process 
    ) return await this.ready;

    try {

      this.ready = (async () => {
        // reset isReady back to its default value.
        this.isReady = false;

        this.global = this.createPool(DEFAULT_MYSQL_HOST);    

        this.region = await this.getCurrentRegion();
        if (this.region) console.debug(`Region is found to be ${this.region}.`);
    
        let cnt = 0;
        while (cnt < 3) {
          console.debug(`Trying to connect to mysql server...${cnt + 1}`);
          try {
            let list = await this.getDatabaseList();
            this.dblist = this.dblist.concat(list.filter(li=>li.host !== DEFAULT_MYSQL_HOST));
            console.debug(`connected to mysql server...${cnt + 1}`);
            break;
          }
          catch (e:any) {
            console.error(`Mysql initiation process has failed.`);
            cnt += 1;
            if (cnt >= 3) throw e;
          }
          await sleep(1000);
        }
        this.isReady = true;        
      })();
      await this.ready;

    }
    catch (e:any) {
      this.isReady = e;
    }    


  }

  private pools: { [key: string]: PromisePool & mysql.Pool } = {};

  disconnect () {
    for(let key in this.pools) {
      const pool = this.pools[key];
      pool.destroy();
    }
    this.pools = {};
  }

  private async getCurrentRegion () {
    if (ENVIRONMENT !== 'production') return 'asia-northeast1';
    try {
      const url = 'http://metadata.google.internal/computeMetadata/v1/instance/?recursive=true&alt=json';
      const response = await fetch(url, {
        headers:{
          'Metadata-Flavor': 'Google',
        }
      })
      const data = await response.json() as any;
      const zone_match = data['zone'].match(/zones\/([^\/]+)/);
      const zone = zone_match[1];
      const region = zone.split('-').slice(0, -1).join('-');
      return region;
    }
    catch (e:any) {
      return 'asia-northeast1';
    }
  }

  private getShards(
    conditions?:{db_id?:number, region?:string},
    pickClosest: boolean = false,
  ): DatabaseCandidate[] {
    let candidates: DatabaseCandidate[] = [];
    // pickClosest will return current region + random instance
    if (typeof conditions === 'undefined' && pickClosest) conditions = {region:this.region};
    
    candidates = this.dblist.filter(li=>!conditions || isMatch(li, conditions));
    if (candidates.length === 0) {
      throw `No suitable database is found for ${JSON.stringify(conditions)}.`;
    }  

    if (pickClosest === true) {
      const index =
        candidates.length > 1
          ? weightedRandom(candidates.map(c => c.weight))
          : 0;
      candidates = [candidates[index]];
    }
    return candidates;
  }
  
  async healthcheck () {
    try {
      await this.init();
      const connection = await this.global.getConnection();
      await connection.ping();
      return true;
    }
    catch (e:any) {
      return false;
    } 
  }

  async getPools(
    db_id?:number,
    pickOne: boolean = false,
  ): Promise<{db_id:number, connection:PromisePool & mysql.Pool}[]> {
    await this.init();
    const shards = this.getShards(typeof db_id === 'number' ? {db_id} : undefined, pickOne);
    return shards.map(({db_id, host})=>{
      return {
        db_id, connection:this.pools[host] || this.createPool(host),
      };
    });
  }

  /**
   * 
   * @param host_url 
   * will be a socket path like path/${project_id}:${region}:${instance-name} 
   * or a TCP path like ${ip}:${port} 
   * @returns 
   */
  private createPool(host_url: string) {
    let host:string|undefined, port:number|undefined, socketPath:string|undefined;
    if (host_url.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/)) { // ${ip}:${port}  ex> 127.0.0.1:3306
      const bits = host_url.split(':');
      host = bits[0];
      if (bits[1]) port = Number(bits[1]);
    }
    else if (host_url.match(/^[^:]+:[^:]+$/)) { // ${region}:${instance-name} ex> asia-northeast1:schoolbelle-japan-cloudsql
        socketPath = `${MYSQL_SOCKET_PATH}/${MYSQL_PROJECT_NAME}:${host_url}`;
    }
    else { // docker-compose container name ex> mysql, shard-1-mysql, shard-2-mysql 
      host = host_url;
    }
    let pool = mysql.createPool({
        host,port,
        socketPath,
        database: CLOUDSQL_DATABASE,
        user: CLOUDSQL_USER,
        password: CLOUDSQL_PASSWORD,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      })
      .promise() as PromisePool & mysql.Pool;
    this.pools[host_url] = pool;
    return pool;
  }


  /**
     * instanceName, region  
     * 
     * ./cloud_sql_proxy -dir=/cloudsql -instances=myProject:us-central1:myInstance,myProject:us-central1:myInstance2 &
mysql -u myUser -S /cloudsql/myProject:us-central1:myInstance2
     */
  private async getDatabaseList() {
    let rows = (await this.global.query('SELECT * FROM schoolbelle.shards'))[0] as DatabaseCandidate[];
    if ((<DatabaseCandidate[]>rows).length === 0) {
      if (typeof SHARDED_MYSQL_HOSTS === 'string') {
        rows.push(...(<string>SHARDED_MYSQL_HOSTS).split(',').filter(v=>v).map((host, i)=>{
          return {
            db_id: 1 + i,
            region:'asia-northeast1',
            weight: 1,
            host, 
          };
        }));
      }
  
    }
    return rows as DatabaseCandidate[];
  }

  /**
   * 
   * @param v 
   * @returns 
   * 
   * /^([^:]+):(.+)$/
   */

  // splitDatabaseIdAndValue (v:string):[v1: number, v2: string] {
  splitDatabaseIdAndValue (v:string):any[] {
      let matches:RegExpMatchArray|null; 
    matches = v.match(/^(\d+):(.+)$/); // ${shard_id}:${internal_id}
    if (matches) return [Number(matches[1]), matches[2]];
    throw new Error(`Provided string(${v}) is not in the supported format.`);
  }

}
export default new Mysql();