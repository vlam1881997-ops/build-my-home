export const MAX_WORKER_TIMEOUT_MS=4*60*60*1000;
const minute=60*1000;

function boundedDuration(value,label) {
  if(!Number.isSafeInteger(value) || value<1 || value>MAX_WORKER_TIMEOUT_MS)throw Error(`${label} phải từ 1 mili giây đến 4 giờ.`);
  return value;
}

// One policy is shared by the CLI process and its job watchdog. Short explicit
// caps remain available for local fixtures; omitted idle caps fit inside them.
export function workerTimeLimits({reasoningEffort,readOnly=false,timeoutMs,idleTimeoutMs}={}) {
  if(typeof readOnly!=='boolean')throw Error('Chế độ chỉ đọc phải là giá trị đúng/sai.');
  if(reasoningEffort!==undefined && (typeof reasoningEffort!=='string' || !/^[a-z][a-z0-9_]{0,31}$/.test(reasoningEffort)))throw Error('Mức suy luận không hợp lệ.');
  const extended=reasoningEffort==='ultra' || reasoningEffort==='max';
  const totalDefault=(readOnly?(extended?90:60):(extended?240:120))*minute;
  const idleDefault=(readOnly?(extended?45:30):(extended?60:30))*minute;
  const total=boundedDuration(timeoutMs===undefined?totalDefault:timeoutMs,'Thời gian tối đa');
  const idle=boundedDuration(idleTimeoutMs===undefined?Math.min(idleDefault,total):idleTimeoutMs,'Thời gian chờ hoạt động');
  if(idle>total)throw Error('Thời gian chờ hoạt động không được lớn hơn thời gian tối đa.');
  return {timeoutMs:total,idleTimeoutMs:idle};
}
