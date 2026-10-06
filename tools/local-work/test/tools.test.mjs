import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { parseTool,executeTool } from "../src/lib/tools.mjs";
test("parse tool",()=>assert.equal(parseTool("{\"tool\":\"list\",\"path\":\".\"}").tool,"list"));
test("blocks escape",async()=>{const d=fs.mkdtempSync(path.join(os.tmpdir(),"lw-"));await assert.rejects(()=>executeTool(d,{tool:"read",path:"../x"}));});
test("write patch",async()=>{const d=fs.mkdtempSync(path.join(os.tmpdir(),"lw-"));await executeTool(d,{tool:"write",path:"a.txt",content:"hello"});await executeTool(d,{tool:"patch",path:"a.txt",find:"hello",replace:"world"});assert.equal(fs.readFileSync(path.join(d,"a.txt"),"utf8"),"world");});
