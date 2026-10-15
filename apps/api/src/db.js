// MongoDB is optional. Avoid loading the Mongoose driver in memory-only sessions.
let mongoose;
let Audit;
export async function connectOptionalDatabase() {
  const uri=process.env.MONGODB_URI?.trim();
  if(!uri){console.log('MongoDB optional: disabled (sessions held in memory)');return;}
  try {
    const module=await import('mongoose');
    mongoose=module.default;
    const auditSchema=new mongoose.Schema({
      sessionId:{type:String,index:true},
      event:{type:String,enum:['created','approved','ended'],required:true},
      occurredAt:{type:Date,default:Date.now}
    },{versionKey:false});
    auditSchema.index({occurredAt:1},{expireAfterSeconds:60*60*24*30});
    Audit=mongoose.models.SessionAudit || mongoose.model('SessionAudit',auditSchema);
    await mongoose.connect(uri,{serverSelectionTimeoutMS:5000});
    console.log('MongoDB connected (metadata only)');
  } catch(err) { console.warn('MongoDB unavailable; continuing without audit log:',err.message); }
}
export function audit(sessionId,event){
  if(mongoose?.connection.readyState===1&&Audit) {
    Audit.create({sessionId,event}).catch(err=>console.warn('audit write failed',err.message));
  }
}
