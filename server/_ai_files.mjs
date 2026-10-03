import {requireAiAccount} from './_ai_usage.mjs';
import {geminiFileInfo} from './_gemini.mjs';
export const aiFilePrefix=user=>'BMH-'+user.id+':';
export async function ownedAiFile(req,name){
 const account=await requireAiAccount(req),file=await geminiFileInfo(name);
 // The server sets this metadata when starting the resumable upload. The
 // browser receives a byte-upload URL, never the provider key or metadata API.
 if(account&&!String(file.displayName||file.display_name||'').startsWith(aiFilePrefix(account.user)))throw Object.assign(new Error('Tệp này không thuộc tài khoản đang dùng. Hãy tải lại tệp của bạn.'),{statusCode:403,code:'AI_FILE_OWNER_REQUIRED'});
 return file;
}
