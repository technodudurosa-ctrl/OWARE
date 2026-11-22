const {onCall,HttpsError}=require('firebase-functions/v2/https');
const admin=require('firebase-admin');
admin.initializeApp();
const db=admin.firestore();
const TIERS=['bronze','prata','ouro','platina','diamante','mestre','grao-mestre'];
function actor(req,roles=['owner','admin']){if(!req.auth||!roles.includes(req.auth.token.role))throw new HttpsError('permission-denied','Acesso administrativo não autorizado.');return req.auth;}
exports.setPlayerRank=onCall(async req=>{
 const a=actor(req),{playerId,rankTier,points}=req.data||{};
 if(typeof playerId!=='string'||!/^[a-z0-9_]{3,14}$/.test(playerId))throw new HttpsError('invalid-argument','Jogador inválido.');
 if(!TIERS.includes(rankTier)||!Number.isInteger(points)||points<0||points>100000)throw new HttpsError('invalid-argument','Categoria ou pontuação inválida.');
 const ref=db.collection('accounts').doc(playerId);
 await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists)throw new HttpsError('not-found','Jogador não encontrado.');const before=snap.data();tx.update(ref,{rankTier,r:points,rankUpdatedAt:admin.firestore.FieldValue.serverTimestamp(),rankUpdatedBy:a.uid});const audit=db.collection('rankAudit').doc();tx.set(audit,{actorUid:a.uid,actorEmail:a.token.email||'',playerId,before:{rankTier:before.rankTier||null,points:Number(before.r)||0},after:{rankTier,points},createdAt:admin.firestore.FieldValue.serverTimestamp()});});
 return {ok:true};
});
exports.setPlayerRole=onCall(async req=>{
 const a=actor(req,['owner']),{playerId,role}=req.data||{};
 if(typeof playerId!=='string'||!/^[a-z0-9_]{3,14}$/.test(playerId)||!['player','admin'].includes(role))throw new HttpsError('invalid-argument','Jogador ou permissão inválida.');
 const ref=db.collection('accounts').doc(playerId),snap=await ref.get();if(!snap.exists)throw new HttpsError('not-found','Jogador não encontrado.');const data=snap.data();if(data.uid===a.uid)throw new HttpsError('failed-precondition','A conta OWNER não pode ser rebaixada.');if(!data.uid)throw new HttpsError('failed-precondition','A conta precisa entrar no jogo pelo menos uma vez.');
 const user=await admin.auth().getUser(data.uid);await admin.auth().setCustomUserClaims(user.uid,{...(user.customClaims||{}),role});await ref.update({role,roleUpdatedAt:admin.firestore.FieldValue.serverTimestamp(),roleUpdatedBy:a.uid});return {ok:true};
});
