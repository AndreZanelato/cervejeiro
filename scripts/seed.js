/*
Seed script to create an admin and sample recipe using Firebase Admin SDK.
Run with: SERVICE_ACCOUNT_PATH=./serviceAccountKey.json node scripts/seed.js
*/

import { adminAuth, adminDb } from '../lib/firebaseAdmin'

async function main () {
  // Create sample admin user (if not exists)
  try {
    const user = await adminAuth.getUserByEmail('admin@example.com')
    console.log('Admin exists:', user.uid)
  } catch (err) {
    const user = await adminAuth.createUser({ email: 'admin@example.com', password: 'changeme' })
    await adminAuth.setCustomUserClaims(user.uid, { role: 'admin' })
    console.log('Created admin:', user.uid)
  }

  // Seed sample recipe
  const recipes = adminDb.collection('recipes')
  await recipes.doc('sample-ipa').set({
    title: 'Sample IPA',
    description: 'Receita de exemplo',
    authorId: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ingredients: [ { name: 'Malte Pale', amount: 5, unit: 'kg' } ],
    steps: [ { id: 'mash-1', type: 'mash', order: 1, tempTarget: 66, durationMin: 60 } ]
  })
  console.log('Seeded sample recipe')

  // Seed sample brew session
  const sess = adminDb.collection('brewSessions')
  await sess.add({
    userId: 'admin',
    recipeId: 'sample-ipa',
    status: 'planned',
    steps: [ { id: 'mash-1', title: 'Aquecimento', order: 1, tempTarget: 66, durationMin: 60 } ],
    logs: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  console.log('Seeded sample brew session')
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
