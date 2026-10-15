import test from 'node:test';
import assert from 'node:assert/strict';
import {containedRect,pointInVideo} from '../src/lib/videoGeometry.js';

test('portrait content stays centered without distortion on a 16:9 TV canvas',()=>{
 const rect=containedRect(1920,1080,1080,1920);
 assert.equal(rect.height,1080);
 assert.equal(rect.width,607.5);
 assert.equal(rect.left,(1920-607.5)/2);
});

test('the laser pointer maps to visible video pixels, never the sidebars',()=>{
 assert.equal(pointInVideo(0,540,1920,1080,1080,1920),null);
 const p=pointInVideo(960,540,1920,1080,1080,1920);
 assert.equal(p.x,.5);assert.equal(p.y,.5);
 assert.equal(containedRect(0,1080,1080,1920),null);
});
