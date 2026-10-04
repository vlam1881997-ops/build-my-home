// Public, bounded diagnostics. Provider bodies and credentials stay on the server.
export function geminiProviderError(status,data={},model=''){
 const raw=String(data.error?.message||''),providerStatus=Number(status)||502;
 let code='GEMINI_UNAVAILABLE',message='Gemini chưa phản hồi được. Thử lại sau ít phút.';
 if(providerStatus===401||providerStatus===400&&/api.?key.*(?:invalid|not valid)|API_KEY_INVALID/i.test(raw)){code='GEMINI_KEY_INVALID';message='Google từ chối API key. Cập nhật key của dự án trên máy chủ rồi phát hành lại.';}
 else if(providerStatus===403){code='GEMINI_ACCESS_DENIED';message='Google từ chối quyền gọi model. Kiểm tra quyền Gemini API và giới hạn API key trong dự án Google.';}
 else if(providerStatus===429){const hard=/limit\s*:\s*0|billing|insufficient|payment/i.test(raw);code=hard?'GEMINI_QUOTA_EXHAUSTED':'GEMINI_RATE_LIMITED';message=hard?'Model Gemini này chưa có quota sử dụng. Chủ dự án cần kiểm tra hạn mức hoặc tài khoản thanh toán trong Google AI Studio.':'Gemini đang chạm hạn mức. Đợi trước khi thử lại; máy chủ không gửi lại cùng yêu cầu liên tục.';}
 else if(providerStatus===404){code='GEMINI_MODEL_UNAVAILABLE';message='Model Gemini đã đổi hoặc chưa được cấp cho tài khoản. Máy chủ sẽ chọn model có trong danh sách của Google.';}
 else if(providerStatus===400){code='GEMINI_REQUEST_INVALID';message='Model Gemini chưa nhận định dạng yêu cầu này. Thử lại với ảnh JPG/PNG hoặc nội dung ngắn hơn.';}
 const retry=(data.error?.details||[]).find(x=>typeof x?.retryDelay==='string')?.retryDelay,seconds=Number(String(retry||'').replace(/s$/,''));
 return Object.assign(new Error(message),{statusCode:providerStatus===401||code==='GEMINI_KEY_INVALID'?401:providerStatus>=400&&providerStatus<500?providerStatus:502,code,model,details:{code,model,providerStatus,...(Number.isFinite(seconds)&&seconds>0?{retryAfterSeconds:Math.ceil(seconds)}:{})}});
}
