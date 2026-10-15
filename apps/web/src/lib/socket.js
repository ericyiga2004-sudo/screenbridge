import {io} from 'socket.io-client';
const API=(import.meta.env.VITE_API_URL||'').trim().replace(/\/$/,'');
export function createSocket(){
 return io(API||undefined,{path:'/socket.io',autoConnect:false,reconnectionAttempts:12,timeout:15000});
}
export async function fetchMediaStatus(){
 const response=await fetch(`${API}/api/media-status`,{cache:'no-store'});
 if(!response.ok)throw Error('Could not reach ScreenBridge media configuration');
 return response.json();
}
export function emitAck(socket,event,payload){
 return new Promise((resolve,reject)=>{
  socket.timeout(12000).emit(event,payload,(err,result)=>{
   if(err)reject(Error('The pairing server did not respond.'));
   else if(!result?.ok)reject(Error(result?.error||'Request failed'));
   else resolve(result);
  });
 });
}
