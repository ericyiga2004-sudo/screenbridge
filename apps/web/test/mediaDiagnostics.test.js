import test from 'node:test';
import assert from 'node:assert/strict';
import {readInboundReport,roomSnapshot,mediaWarning} from '../src/lib/mediaDiagnostics.js';
test('missing counters stay unavailable, not zero',()=>{
 const d=readInboundReport(new Map());assert.equal(d.bytes,null);assert.equal(d.framesDecoded,null);
});
test('select video inbound and referenced codec, preserve real zero',()=>{
 const rows=[{id:'a',type:'inbound-rtp',kind:'audio',bytesReceived:999},{id:'v',type:'inbound-rtp',mediaType:'video',codecId:'c',bytesReceived:50,framesDecoded:0},{id:'c',type:'codec',mimeType:'video/H264'}];
 const d=readInboundReport(new Map(rows.map(r=>[r.id,r])));assert.equal(d.codec,'video/H264');assert.equal(d.bytes,50);assert.equal(d.framesDecoded,0);
 assert.match(mediaWarning({...d,connection:'connected',publication:true,subscription:'subscribed'},{}),/no frames decode/);
});
test('publication discovery precedes subscription',()=>{
 const room={state:'connected',remoteParticipants:new Map([['p',{trackPublications:new Map([['v',{source:'screen_share',kind:'video',trackSid:'TR_test',subscriptionStatus:'desired',permissionStatus:'allowed'}]])}]])};
 const d=roomSnapshot(room);assert.equal(d.publication,true);assert.equal(d.participants,1);assert.equal(d.subscription,'desired');assert.match(mediaWarning(d,{}),/not established/);
});
