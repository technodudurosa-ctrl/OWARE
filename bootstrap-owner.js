// Execute apenas em ambiente confiável, com GOOGLE_APPLICATION_CREDENTIALS configurado.
// Não publique a chave JSON da conta de serviço no GitHub.
const admin=require('firebase-admin');
admin.initializeApp({credential:admin.credential.applicationDefault()});
const db=admin.firestore();
(async()=>{const email='technodudu@oware.game';const user=await admin.auth().getUserByEmail(email);await admin.auth().setCustomUserClaims(user.uid,{...(user.customClaims||{}),role:'owner'});await db.collection('accounts').doc('technodudu').set({uid:user.uid,role:'owner'},{merge:true});console.log('OWNER configurado para',email);process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
