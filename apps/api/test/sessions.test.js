import test from 'node:test';
import assert from 'node:assert/strict';
import {registerSessions} from '../src/sessions.js';

class FakeSocket {
 constructor(id){this.id=id;this.data={};this.handlers=new Map();this.messages=[];}
 on(event,handler){this.handlers.set(event,handler);}
 receive(event,...args){assert.ok(this.handlers.has(event),`Missing server handler ${event}`);return this.handlers.get(event)(...args);}
 outgoing(event,payload){this.messages.push({event,payload});}
 take(event){const idx=this.messages.findIndex(m=>m.event===event);if(idx<0)return null;return this.messages.splice(idx,1)[0].payload;}
}
class FakeIO {
 constructor(){this.sockets={sockets:new Map()};this.handler=null;}
 on(event,handler){if(event==='connection')this.handler=handler;}
 to(id){return {emit:(event,payload)=>this.sockets.sockets.get(id)?.outgoing(event,payload)};}
 connect(id){const s=new FakeSocket(id);this.sockets.sockets.set(id,s);this.handler(s);return s;}
}
const config={
 mediaReady:()=>true,
 issueTickets:async()=>({
  host:{url:'wss://test.livekit.cloud',token:'publisher-token'},
  viewer:{url:'wss://test.livekit.cloud',token:'viewer-token'}
 })
};
function ack(socket,event,payload){return new Promise(resolve=>socket.receive(event,payload,resolve));}
test('approved viewer receives subscribe-only media ticket after a pairing request',async()=>{
 const io=new FakeIO();registerSessions(io,config);
 const host=io.connect('host'),viewer=io.connect('viewer'),other=io.connect('intruder');
 const created=await ack(host,'session:create',{});
 assert.equal(created.ok,true);assert.match(created.code,/^[A-Z2-9]{8}$/);
 const asked=await ack(viewer,'session:request-view',{code:created.code,name:'iPhone'});
 assert.equal(asked.ok,true);assert.equal(host.take('session:viewer-request').name,'iPhone');
 assert.equal(viewer.take('session:approved'),null);
 const approved=await ack(host,'session:approve',{requestId:'viewer'});
 assert.equal(approved.ok,true);
 assert.equal(host.take('session:approved').media.token,'publisher-token');
 assert.equal(viewer.take('session:approved').media.token,'viewer-token');
 assert.equal(await ack(other,'session:request-view',{code:created.code,name:'Intruder'}).then(x=>x.ok),false);
 viewer.receive('interaction:pointer',{visible:true,x:0.4,y:0.6});
 assert.deepEqual(host.take('interaction:pointer'),{visible:true,x:0.4,y:0.6});
 host.receive('session:leave');
 assert.ok(viewer.take('session:ended'));
});
test('unapproved peers cannot send pointers or reactions',async()=>{
 const io=new FakeIO();registerSessions(io,config);
 const host=io.connect('h'),viewer=io.connect('v'),attacker=io.connect('x');
 const {code}=await ack(host,'session:create',{});
 await ack(viewer,'session:request-view',{code,name:'Screen'});
 attacker.receive('interaction:reaction',{emoji:'👍'});
 viewer.receive('interaction:pointer',{visible:true,x:0.2,y:0.4});
 assert.equal(host.take('interaction:reaction'),null);
 assert.equal(host.take('interaction:pointer'),null);
 host.receive('session:decline',{requestId:'v'});
 assert.ok(viewer.take('session:declined'));
 host.receive('session:leave');
});
test('a connected viewer can leave, allowing a second approved viewer',async()=>{
 const io=new FakeIO();registerSessions(io,config);
 const host=io.connect('h'),viewer=io.connect('v'),later=io.connect('v2');
 const {code}=await ack(host,'session:create',{});
 await ack(viewer,'session:request-view',{code});await ack(host,'session:approve',{requestId:'v'});
 viewer.receive('disconnect');assert.ok(host.take('session:viewer-left')===undefined || host.messages.some(m=>m.event==='session:viewer-left')===false);
 assert.equal((await ack(later,'session:request-view',{code,name:'Later'})).ok,true);
 assert.equal((await ack(host,'session:approve',{requestId:'v2'})).ok,true);
 assert.equal(later.take('session:approved').media.token,'viewer-token');
 host.receive('session:leave');
});
test('rooms cannot be created until the LiveKit backend is configured',async()=>{
 const io=new FakeIO();registerSessions(io,{mediaReady:()=>false,issueTickets:config.issueTickets});
 const host=io.connect('host');
 const result=await ack(host,'session:create',{});
 assert.equal(result.ok,false);assert.match(result.error,/LiveKit/i);
});
