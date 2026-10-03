import {supabaseEnv} from './_lib.mjs';

// Set readiness flags only after applying the checked-in migrations.
export function customerConfig(){
 const db=supabaseEnv();
 const cloud=!!(db.url&&db.publishable&&process.env.BMH_CLOUD_READY==='true');
 const quota=!!(cloud&&db.secret&&process.env.BMH_AI_QUOTA_READY==='true');
 const n=Number(process.env.BMH_AI_DAILY_LIMIT??10);
 return {cloud,quota,dailyLimit:Number.isSafeInteger(n)&&n>=0&&n<=10000?n:10};
}
export function requireCustomerCloud(){
 if(!customerConfig().cloud)throw Object.assign(new Error('Lưu nhiều thiết bị chưa được mở. Bạn vẫn có thể giữ thiết kế bằng bản sao JSON.'),{statusCode:503});
}
