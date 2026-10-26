export type Row={startTime:string;publishTime:string|null;forecast_generation:number|null;actual_generation:number|null;error_mw:number|null;absolute_error_mw:number|null;status:string}
export type Overview={start:string;end:string;cutoff_hour_utc:number;metrics:{mae_mw:number|null;rmse_mw:number|null;mbe_mw:number|null;matched_intervals:number;expected_intervals:number;coverage_percent:number|null;overforecast_intervals:number;underforecast_intervals:number};rows:Row[];data_available:boolean;message:string}
const base=(import.meta.env.VITE_API_BASE_URL||'http://localhost:8000').replace(/\/$/,'')
export async function getOverview(start:string,end:string):Promise<Overview>{const r=await fetch(`${base}/api/overview?start=${start}&end=${end}`);if(!r.ok){const b=await r.json().catch(()=>({}));throw new Error(b.detail||`API error ${r.status}`)}return r.json()}
export const exportUrl=(start:string,end:string)=>`${base}/api/export.csv?start=${start}&end=${end}`
