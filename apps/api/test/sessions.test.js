import test from 'node:test';
import assert from 'node:assert/strict';
import {registerSessions} from '../src/sessions.js';

class FakeSocket {
 constructor(id){this.id=id;this.data={};this.handlers=new Map();this.messages=[];}
 on(event,handler){this.handlers.set(event,handler);}
 receive(event,...args){assert.ok(this.handlers.has(event),`Missing server handler ${event}`);return this.handlers.get(event)(...args);}
 outgoing(event,payload){this.messages.push({event,payload});}
 take(event){const idx=this.messages.findIndex(m=>m.event===event);if(idx===-1)return null;return this.messages.splice(idx,1)[0].payload;}
}
class FakeIO {
 constructor(){this.sockets={sockets:new Map()};this.handler=null;}
 on(event,handler){if(event==='connection')this.handler=handler;}
 to(id){return {emit:(event,payload)=>this.sockets.sockets.get(id)?.outgoing(event,payload)};}
 connect(id){const socket=new FakeSocket(id);this.sockets.sockets.set(id,socket);this.handler(socket);return socket;}
}
function ack(socket,event,payload){let answer;socket.receive(event,payload,result=>{answer=result;});return answer;}

test('screen requests require host approval and signaling is scoped to the approved peer',()=>{
 const io=new FakeIO();registerSessions(io);const host=io.connect('host'),viewer=io.connect('viewer'),intruder=io.connect('other');
 const room=ack(host,'session:create',{});assert.equal(room.ok,true);assert.match(room.code,/^[A-Z2-9]{8}$/);
 const request=ack(viewer,'session:request-view',{code:room.code,name:'iPhone'});assert.equal(request.ok,true);
 const pending=host.take('session:viewer-request');assert.equal(pending.name,'iPhone');
 const response=ack(host,'session:approve',{requestId:pending.requestId});assert.equal(response.ok,true);
 assert.equal(host.take('session:approved').role,'host');assert.equal(viewer.take('session:approved').role,'viewer');
 const offer={type:'offer',sdp:'sample-sdp'};host.receive('rtc:offer',offer);assert.deepEqual(viewer.take('rtc:offer'),offer);
 intruder.receive('rtc:offer',offer);assert.equal(viewer.take('rtc:offer'),null);
 const answer={type:'answer',sdp:'answer-sdp'};viewer.receive('rtc:answer',answer);assert.deepEqual(host.take('rtc:answer'),answer);
 host.receive('session:leave');assert.ok(viewer.take('session:ended'));
 assert.equal(ack(intruder,'session:request-view',{code:room.code,name:'intruder'}).ok,false);
});
test('the host can decline a viewer before capture begins',()=>{
 const io=new FakeIO();registerSessions(io);const host=io.connect('h'),viewer=io.connect('v');const room=ack(host,'session:create',{});
 assert.equal(ack(viewer,'session:request-view',{code:room.code,name:'Guest'}).ok,true);
 host.receive('session:decline',{requestId:'v'});assert.ok(viewer.take('session:declined'));
 assert.equal(viewer.take('session:approved'),null);
 host.receive('session:leave');
});
test('viewer disconnect releases an active room for a later approved viewer',()=>{
 const io=new FakeIO();registerSessions(io);const host=io.connect('h'),viewer=io.connect('v'),later=io.connect('v2');const {code}=ack(host,'session:create',{});
 ack(viewer,'session:request-view',{code});ack(host,'session:approve',{requestId:'v'});
 viewer.receive('disconnect');assert.ok(host.messages.some(m=>m.event==='session:viewer-left'));
 assert.equal(ack(later,'session:request-view',{code,name:'Later'}).ok,true);
 host.receive('session:leave');
});

test('laser pointer and emoji reactions are confined to approved sessions',()=>{
 const io=new FakeIO();registerSessions(io);const host=io.connect('host'),viewer=io.connect('viewer'),other=io.connect('other');
 const {code}=ack(host,'session:create',{});
 ack(viewer,'session:request-view',{code,name:'TV'});
 viewer.receive('interaction:pointer',{visible:true,x:0.2,y:0.8});
 other.receive('interaction:reaction',{emoji:'👍'});
 assert.equal(host.take('interaction:pointer'),null);
 assert.equal(host.take('interaction:reaction'),null);
 ack(host,'session:approve',{requestId:'viewer'});
 viewer.receive('interaction:pointer',{visible:true,x:.3,y:.7});
 assert.deepEqual(host.take('interaction:pointer'),{visible:true,x:.3,y:.7});
 viewer.receive('interaction:reaction',{emoji:'❤️'});
 assert.deepEqual(host.take('interaction:reaction'),{emoji:'❤️'});
 host.receive('interaction:reaction',{emoji:'💡'});
 assert.deepEqual(viewer.take('interaction:reaction'),{emoji:'💡'});
 viewer.receive('interaction:pointer',{visible:true,x:999,y:0});
 assert.equal(host.take('interaction:pointer'),null);
 other.receive('interaction:pointer',{visible:true,x:0.5,y:0.5});
 assert.equal(host.take('interaction:pointer'),null);
 host.receive('session:leave');
});
