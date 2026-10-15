import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createMediaTickets } from '../src/media.js';

test('approved roles can generate valid LiveKit screen-share-only tokens', async () => {
 const previous = Object.fromEntries(['LIVEKIT_URL','LIVEKIT_API_KEY','LIVEKIT_API_SECRET'].map(k => [k,process.env[k]]));
 process.env.LIVEKIT_URL='wss://unit-test.livekit.cloud';
 process.env.LIVEKIT_API_KEY='testkey';
 process.env.LIVEKIT_API_SECRET='not-a-real-secret-but-long-enough-for-jwt-tests';
 try {
  const { host, viewer } = await createMediaTickets(randomUUID());
  assert.equal(host.url, 'wss://unit-test.livekit.cloud');
  assert.equal(viewer.url,host.url);
  const jwtPayload = value => JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString('utf8'));
  const publisher=jwtPayload(host.token).video;
  const subscriber=jwtPayload(viewer.token).video;
  assert.equal(publisher.room,subscriber.room);
  assert.equal(publisher.canPublish,true);
  assert.deepEqual(publisher.canPublishSources,['screen_share','screen_share_audio']);
  assert.equal(publisher.canSubscribe,false);
  assert.equal(subscriber.canPublish,false);
  assert.equal(subscriber.canSubscribe,true);
  assert.deepEqual(subscriber.canPublishSources,[]);
  assert.notEqual(host.token,viewer.token);
 } finally {
  for(const [name,value] of Object.entries(previous)){
   if(value===undefined) delete process.env[name]; else process.env[name]=value;
  }
 }
});
