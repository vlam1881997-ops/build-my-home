/* Read-only evidence builder. No downloads, supplier approvals or project writes. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {designClient} from './fixtures/design-client.mjs';
import {materialPriceEvidence} from '../server/_material_catalog.mjs';

export function skuImageRegister(){
 const fixturePath='docs/team-v1/evidence/B/Modern-5x20-V01/project.json',fixtureBytes=fs.readFileSync(fixturePath),saved=JSON.parse(fixtureBytes),B=designClient({realHouse:true});
 B.state.project=structuredClone(saved.project);B.materialPriceEvidence=materialPriceEvidence;
 const before=JSON.stringify(B.state.project),catalog=JSON.parse(fs.readFileSync('assets/materials/official-catalog.json','utf8'));
 B.materialResearch={products:catalog.products};
 const source=fs.readFileSync('src/75_completion.js','utf8');
 vm.runInNewContext(source.slice(source.indexOf('BMH.materialProductPhotoStatus='),source.indexOf('BMH.restoreWebMaterials=')),{BMH:B});
 // Match the existing UI URL policy without making a network request.
 B.v71SafeHttps=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
 const productRow=p=>{const photo=B.materialProductPhotoStatus(p),price=materialPriceEvidence(p);return {
  productId:p.id,category:p.category,brand:p.brand||null,sku:p.sku?.trim()||null,specification:p.specification||p.spec||null,quantityUnit:price.quantityUnit,
  productSource:p.productUrl||null,imageKind:'product-source-reference',imageSource:p.imageUrl||null,
  rights:{verified:p.photoLicense?.verified===true,commercialUse:p.photoLicense?.commercialUse===true,source:p.photoLicense?.sourceUrl||null},
  sourceCheckedAt:p.verifiedAt||null,displayableSourcePhoto:photo.displayable,missingPhotoEvidence:[...photo.missing],
  exactSkuPhotoReviewed:false,reviewer:null,reviewedAt:null,commercialAccepted:false,
  price:{amountVnd:price.amountVnd,status:price.priceType,quotedAt:price.quotedAt,retrievedAt:price.retrievedAt},
 };};
 const products=catalog.products.map(productRow),p=B.state.project,rooms=p.plan.rooms,regular=rooms.filter(r=>!['stairs','elevator','balcony'].includes(r.type)),schedule=B.styleMaterialSchedule(p);
 const roleTargets=role=>role.id==='roof'||role.id==='facade'?[null]:role.id==='stairs'?rooms.filter(r=>r.type==='stairs'):role.id==='wetArea'?rooms.filter(r=>['bath','wc'].includes(r.type)):role.id==='floor'?regular.filter(r=>!['bath','wc'].includes(r.type)):regular;
 const applications=schedule.rows.flatMap(role=>roleTargets(role).map(room=>{
  const scope=room?'room':'exterior',palette=room?B.finishPalette(room.id):B.facadeFinishPalette?.(),binding=palette?.catalogMaterials?.[role.category],bound=binding&&B.catalogBoundProduct?.(role.category,binding),valid=!!bound&&B.catalogBindingStatus?.(role.category,binding,bound,palette)?.valid,
   product=valid?bound:null,photo=product?B.materialProductPhotoStatus(product):null,sample=valid&&B.catalogSampleMetadataValid?.(binding)?binding.sample:null;
  return {roleId:role.id,category:role.category,scope,roomId:room?.id||null,floor:room?.floor??null,
   targetStatus:'review-target-not-confirmed-application',categoryChoiceId:p.materials.choices[role.category]||null,
   productId:product?.id||null,sku:product?.sku||null,specification:product?.specification||product?.spec||null,quantityUnit:product?materialPriceEvidence(product).quantityUnit:null,
   visualProfileId:binding?.visualProfileId||role.profileId||null,
   imageKind:sample?'customer-surface-sample':'generic-simulation',sample:sample?structuredClone(sample):null,
   sourcePhoto:photo?.displayable?productRow(product):null,
   candidateProductIds:products.filter(x=>role.category&&x.category===role.category).map(x=>x.productId),
   missing:[...(!product?['confirmed-role-product']:[]),...(!product?.sku?['sku']:[]),...(!photo?.displayable?['eligible-product-photo']:[]),'exact-sku-photo-review','customer-product-approval'],
   commercialAccepted:false,quantity:null,quantityOwner:'A'};
 }));
 const furniture=rooms.flatMap(room=>B.roomFurnitureLayout(room).filter(item=>item.placementStatus!=='removed').map(item=>({roomId:room.id,floor:room.floor,id:item.id,modelId:item.modelId||item.model,sku:item.sku||null,materialBindings:structuredClone(item.materialBindings||{}),supplierPhotoReviewed:false,commercialAccepted:false})));
 assert.equal(JSON.stringify(p),before,'register must not mutate the shared project');
 return {schemaVersion:1,owner:'B',taskId:'U1-B02',status:'inventory-ready-assets-pending',baseCommit:'8a03c900459cb2b4df03fd11ed8846ed2c0d400b',
  fixture:{path:fixturePath,sha256:createHash('sha256').update(fixtureBytes).digest('hex'),id:'modern-5x20-2f-v01',styleId:'modern',designRevision:B.drawingRevision(),testOnly:true,rooms:rooms.map(r=>({id:r.id,type:r.type,floor:r.floor,name:r.name}))},
  summary:{products:products.length,displayableSourcePhotos:products.filter(p=>p.displayableSourcePhoto).length,exactSkuPhotosReviewed:0,confirmedApplications:applications.filter(a=>a.productId).length,reviewTargets:applications.length,furniture:furniture.length},
  limits:['Candidate IDs are not selections or compatibility approvals.','Targets are review locations, not A quantity/BOQ applications.','No supplier image bytes downloaded; source references and existing flags are not licence grants.','Generic surfaces and customer samples do not certify manufacturer SKU appearance.','Unknown prices remain null; no quantities or supplier approval inferred.'],
  applications,furniture,products};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const target=process.argv[2];if(!target)throw Error('Pass an explicit output JSON path');
 const register=skuImageRegister();fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(register,null,2)+'\n');console.log(JSON.stringify(register.summary));
}
