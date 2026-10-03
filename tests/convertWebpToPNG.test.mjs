import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import convert from '../src/utils/convertWebpToPNG.ts'

const original = { Image: globalThis.Image, document: globalThis.document, create: URL.createObjectURL, revoke: URL.revokeObjectURL }
afterEach(() => { globalThis.Image = original.Image; globalThis.document = original.document; URL.createObjectURL = original.create; URL.revokeObjectURL = original.revoke })
function fixture({ decode = true, context = true, output = new Blob(['PNG'], {type:'image/png'}), drawThrows = false, encodeThrows = false } = {}) {
  const revoked = []
  URL.createObjectURL = () => 'blob:synthetic'
  URL.revokeObjectURL = (url) => revoked.push(url)
  globalThis.Image = class { width = 2; height = 3; naturalWidth = 2; naturalHeight = 3; set src(value) { if(value) queueMicrotask(() => decode ? this.onload?.() : this.onerror?.()) } }
  globalThis.document = { createElement: () => ({ width:0, height:0, getContext: () => context ? { drawImage() { if(drawThrows) throw new Error('draw failed') } } : null,
    toBlob(callback) { if(encodeThrows) throw new Error('encode failed'); callback(output) } }) }
  return { revoked, output }
}

test('releases the source URL after a successful conversion', async () => {
  const f = fixture();assert.equal(await convert(new Blob()),f.output);assert.deepEqual(f.revoked,['blob:synthetic'])
})
test('releases the source URL after decode failure', async () => {
  const f = fixture({decode:false});await assert.rejects(convert(new Blob()));assert.deepEqual(f.revoked,['blob:synthetic'])
})
test('releases the source URL when no 2D context is available', async () => {
  const f = fixture({context:false});await assert.rejects(convert(new Blob()));assert.deepEqual(f.revoked,['blob:synthetic'])
})
test('rejects a null encoding result rather than returning a renamed original', async () => {
  const f = fixture({output:null});await assert.rejects(convert(new Blob()));assert.deepEqual(f.revoked,['blob:synthetic'])
})
test('drawing exceptions reject and clean up rather than escaping the load handler', async () => {
  const f = fixture({drawThrows:true});await assert.rejects(convert(new Blob()),/draw failed/);assert.deepEqual(f.revoked,['blob:synthetic'])
})
test('encoding exceptions reject and clean up', async () => {
  const f = fixture({encodeThrows:true});await assert.rejects(convert(new Blob()),/encode failed/);assert.deepEqual(f.revoked,['blob:synthetic'])
})
