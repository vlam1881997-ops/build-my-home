import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_WORKER_TIMEOUT_MS,workerTimeLimits} from '../limits.mjs';

const minute=60*1000;
test('worker limits distinguish planning, write work and long reasoning efforts',()=>{
  assert.deepEqual(workerTimeLimits({reasoningEffort:'high'}),{timeoutMs:120*minute,idleTimeoutMs:30*minute});
  assert.deepEqual(workerTimeLimits({reasoningEffort:'xhigh'}),{timeoutMs:120*minute,idleTimeoutMs:30*minute});
  for(const effort of ['ultra','max']){
    assert.deepEqual(workerTimeLimits({reasoningEffort:effort}),{timeoutMs:240*minute,idleTimeoutMs:60*minute});
    assert.deepEqual(workerTimeLimits({reasoningEffort:effort,readOnly:true}),{timeoutMs:90*minute,idleTimeoutMs:45*minute});
  }
  assert.deepEqual(workerTimeLimits({readOnly:true}),{timeoutMs:60*minute,idleTimeoutMs:30*minute});
  assert.equal(MAX_WORKER_TIMEOUT_MS,240*minute);
});
test('explicit fixture limits remain short, bounded and internally consistent',()=>{
  assert.deepEqual(workerTimeLimits({timeoutMs:1}),{timeoutMs:1,idleTimeoutMs:1});
  assert.deepEqual(workerTimeLimits({timeoutMs:100,idleTimeoutMs:30}),{timeoutMs:100,idleTimeoutMs:30});
  assert.deepEqual(workerTimeLimits({timeoutMs:MAX_WORKER_TIMEOUT_MS,idleTimeoutMs:MAX_WORKER_TIMEOUT_MS}),{timeoutMs:MAX_WORKER_TIMEOUT_MS,idleTimeoutMs:MAX_WORKER_TIMEOUT_MS});
  for(const value of [0,-1,1.5,Infinity,NaN,null,'100',MAX_WORKER_TIMEOUT_MS+1]){
    assert.throws(()=>workerTimeLimits({timeoutMs:value}),/Thời gian tối đa/);
    assert.throws(()=>workerTimeLimits({idleTimeoutMs:value}),/Thời gian chờ hoạt động/);
  }
  assert.throws(()=>workerTimeLimits({timeoutMs:100,idleTimeoutMs:101}),/không được lớn hơn/);
  assert.throws(()=>workerTimeLimits({readOnly:'true'}),/chỉ đọc/);
  assert.throws(()=>workerTimeLimits({reasoningEffort:'Ultra;bad'}),/suy luận/);
});
