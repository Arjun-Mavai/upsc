import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const q55Data = {
"extendedData": {
"layoutType": "table",
"contextStr": "निम्नलिखित सूचना पर विचार कीजिए :",
"contextStrEn": "Consider the following information:",
"tableHeaders": ["पुरातात्विक स्थल", "राज्य", "विवरण"],
"tableRows": [
["1. चंद्रकेतुगढ़", "ओडिशा", "व्यापार बंदरगाह शहर"],
["2. इनामगाँव", "महाराष्ट्र", "ताम्र-पाषाण स्थल"],
["3. मंगडु", "केरल", "महापाषाण स्थल"],
["4. सालिहुंडम", "आंध्र प्रदेश", "शैलकृत गुफा मंदिर"]
],
"questionPrompt": "उपर्युक्त में से कौन-सी पंक्तियों में दी गई सूचना सही सुमेलित है ?",
"questionPromptEn": "In which of the above rows is the given information correctly matched ?"
}
};

async function run() {
  const { db } = await import('../db/index');
  const { questions } = await import('../db/schema');
  const { eq } = await import('drizzle-orm');

  const qId = "-n5D0MzNanBw0uXRBsKGS"; // Q55 ID we found earlier
  
  console.log(`Patching Q55 (${qId}) with extendedData...`);

  await db.update(questions)
    .set({
      extendedData: JSON.stringify(q55Data.extendedData)
    })
    .where(eq(questions.id, qId));

  console.log("Patch Successful!");
}

run().catch(console.error);
