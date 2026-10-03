import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pngName, appendUniqueImages, convertBatch } from '../src/utils/convertBatch.ts';
import { mobilePlatform } from '../src/utils/platform.ts';

test('renames only the terminal extension and removes ZIP path separators', () => {
  assert.equal(pngName('webp-sample.WEBP'), 'webp-sample.png');
  assert.equal(pngName('picture'), 'picture.png');
  assert.equal(pngName('../picture.webp'), '.._picture.png');
  assert.equal(pngName('path\\picture.webp'), 'path_picture.png');
});
test('duplicate names remain unique across multiple batches without mutating prior images', () => {
  const image = (id,name) => ({id,name,blob:new Blob(['png'])});
  const prior=[image('old','a.png'),image('older','a (2).png')];
  const next=appendUniqueImages(prior,[image('new','a.png'),image('new2','a.png')]);
  assert.deepEqual(next.map(x=>x.name),['a.png','a (2).png','a (3).png','a (4).png']);
  assert.equal(prior.length,2);
});
test('keeps valid converted images when another WebP is corrupt and ignores other MIME types', async () => {
  const files=[new File(['good'],'good.WEBP',{type:'image/webp'}),new File(['bad'],'bad.webp',{type:'image/webp'}),new File(['skip'],'skip.png',{type:'image/png'})];
  const result=await convertBatch(files,async file=>{if(file.name==='bad.webp')throw new Error('corrupt');return new Blob(['PNG'],{type:'image/png'});});
  assert.equal(result.failed,1);assert.equal(result.rejected,1);assert.deepEqual(result.images.map(x=>x.name),['good.png']);assert.equal(result.images[0].blob.type,'image/png');
});
test('uses only vk_platform to preserve the product mobile-client restriction', () => {
  assert.deepEqual(mobilePlatform('?vk_platform=desktop_web&description=mobile_android'),{isMobileInApp:false,isMobileWeb:false});
  for(const platform of ['mobile_android','mobile_iphone']) assert.equal(mobilePlatform('?vk_platform='+platform).isMobileInApp,true);
  assert.equal(mobilePlatform('?vk_platform=mobile_web').isMobileWeb,true);
});
