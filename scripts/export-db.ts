import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { adminDb } from '../src/lib/firebase-admin';
import { CollectionReference, DocumentData, DocumentReference } from 'firebase-admin/firestore';

// Рекурсивна функция за извличане на данни от документ и неговите подколекции
async function getDocumentData(docRef: DocumentReference): Promise<DocumentData> {
    // 1. Взимаме данните на самия документ
    const docSnapshot = await docRef.get();
    const data = docSnapshot.data() || {};
    
    // 2. Взимаме всички подколекции на този документ
    const subcollections = await docRef.listCollections();
    
    // 3. За всяка подколекция, рекурсивно извикваме главната функция
    for (const subcollection of subcollections) {
        const subcollectionData = await getCollectionData(subcollection);
        // Добавяме данните от подколекцията като вложен обект
        data[subcollection.id] = subcollectionData;
    }
    
    return data;
}

// Функция за извличане на всички документи от дадена колекция
async function getCollectionData(collectionRef: CollectionReference): Promise<Record<string, DocumentData>> {
    const collectionSnapshot = await collectionRef.get();
    const collectionData: Record<string, DocumentData> = {};

    for (const doc of collectionSnapshot.docs) {
        // За всеки документ в колекцията, извикваме рекурсивната функция
        collectionData[doc.id] = await getDocumentData(doc.ref);
    }

    return collectionData;
}

// Главна функция за стартиране на експорта
async function exportFirestoreData() {
    console.log('Starting Firestore data export...');
    const mainCollections = await adminDb.listCollections();
    const finalExport: Record<string, any> = {};

    try {
        for (const collection of mainCollections) {
            console.log(`- Exporting collection: ${collection.id}`);
            const collectionId = collection.id;
            finalExport[collectionId] = await getCollectionData(collection);
        }

        // Записваме резултата в JSON файл
        const outputPath = path.resolve(process.cwd(), 'db-export.json');
        fs.writeFileSync(outputPath, JSON.stringify(finalExport, null, 2));
        console.log(`\n✅ Export successful! Data saved to: ${outputPath}`);

    } catch (error) {
        console.error('\n❌ An error occurred during export:', error);
    }
}

exportFirestoreData();
