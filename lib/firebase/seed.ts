import {
  collection,
  getDocs,
  writeBatch,
  doc,
  Timestamp,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { addDays, subDays, startOfWeek } from 'date-fns';
import { GoalStatus, GoalType } from '../types';

const COLLECTIONS = ['customers', 'projects', 'tasks', 'communications', 'goals'];

// Demo Customers
const DEMO_CUSTOMERS = [
  { name: 'Ahmet Yilmaz', company: 'Teknoloji AS', email: 'ahmet@teknolojiAS.com', phone: '0532 111 2233', notes: 'Yazilim gelistirme projeleri icin potansiyel musteri.' },
  { name: 'Ayse Demir', company: 'Digital Cozumler Ltd', email: 'ayse@digitalcozumler.com', phone: '0533 222 3344', notes: 'E-ticaret platformu gelistirmek istiyor.' },
  { name: 'Mehmet Kaya', company: 'Akilli Sistemler', email: 'mehmet@akillisistemler.com', phone: '0534 333 4455', notes: 'IoT cozumleri ariyorlar.' },
  { name: 'Fatma Ozturk', company: 'Yesil Enerji AŞ', email: 'fatma@yesilenerji.com', phone: '0535 444 5566', notes: 'Enerji yonetim sistemi projesi.' },
  { name: 'Ali Celik', company: 'Lojistik Pro', email: 'ali@lojistikpro.com', phone: '0536 555 6677', notes: 'Filo takip sistemi ihtiyaci var.' },
  { name: 'Zeynep Arslan', company: 'Saglik Teknolojileri', email: 'zeynep@sagliktek.com', phone: '0537 666 7788', notes: 'Hasta takip uygulamasi gelistirmek istiyorlar.' },
];

// Demo Projects (will be linked to customers)
const DEMO_PROJECTS = [
  { name: 'E-Ticaret Platformu', description: 'Modern e-ticaret sitesi gelistirme projesi. React ve Node.js kullanilacak.', status: 'active' as const },
  { name: 'Mobil Uygulama', description: 'iOS ve Android icin cross-platform mobil uygulama.', status: 'active' as const },
  { name: 'CRM Sistemi', description: 'Musteri iliskileri yonetim sistemi entegrasyonu.', status: 'pending' as const },
  { name: 'IoT Dashboard', description: 'Sensor verilerini izlemek icin dashboard uygulamasi.', status: 'active' as const },
  { name: 'Filo Takip Sistemi', description: 'Arac takip ve rota optimizasyonu.', status: 'pending' as const },
  { name: 'Randevu Sistemi', description: 'Online randevu ve hasta yonetim sistemi.', status: 'completed' as const },
  { name: 'Web Sitesi Yenileme', description: 'Kurumsal web sitesi modernizasyonu.', status: 'completed' as const },
];

// Demo Tasks (will be linked to projects)
const DEMO_TASKS = [
  { title: 'Veritabani tasarimi', description: 'PostgreSQL sema tasarimi yapilacak.', status: 'done' as const, priority: 'high' as const },
  { title: 'API gelistirme', description: 'REST API endpointleri olusturulacak.', status: 'in_progress' as const, priority: 'high' as const },
  { title: 'Frontend komponenti', description: 'React komponentleri gelistirilecek.', status: 'todo' as const, priority: 'normal' as const },
  { title: 'Test yazimi', description: 'Unit ve integration testleri yazilacak.', status: 'todo' as const, priority: 'normal' as const },
  { title: 'Dokumantasyon', description: 'API dokumantasyonu hazirlanacak.', status: 'todo' as const, priority: 'low' as const },
  { title: 'Kullanici arayuzu tasarimi', description: 'Figma ile UI/UX tasarimi.', status: 'done' as const, priority: 'high' as const },
  { title: 'Performans optimizasyonu', description: 'Sayfa yukleme surelerini iyilestirme.', status: 'in_progress' as const, priority: 'urgent' as const },
  { title: 'Guvenlik testi', description: 'Penetrasyon testi yapilacak.', status: 'todo' as const, priority: 'high' as const },
];

// Demo Communications
const DEMO_COMMUNICATIONS = [
  { type: 'phone' as const, summary: 'Proje gereksinimleri gorusuldu. Musteri hizli teslimat istiyor.', nextAction: 'Teklif hazirla' },
  { type: 'meeting' as const, summary: 'Yuz yuze toplanti yapildi. Butce ve zaman plani konusuldu.', nextAction: 'Sozlesme taslagini gonder' },
  { type: 'email' as const, summary: 'Teknik detaylar mail ile paylasıldı.', nextAction: null },
  { type: 'phone' as const, summary: 'Ilerleme durumu hakkinda bilgi verildi.', nextAction: 'Demo toplantisi ayarla' },
  { type: 'meeting' as const, summary: 'Sprint demo toplantisi yapildi. Geri bildirimler alindi.', nextAction: 'Revizyonlari tamamla' },
];

// Demo Goals
const DEMO_GOALS = [
  { title: 'E-ticaret MVP tamamla', description: 'Minimum viable product cikartilacak.', goalType: 'milestone' as const },
  { title: 'Yeni musteri gorusmesi', description: 'Potansiyel musteri ile tanitim toplantisi.', goalType: 'contact' as const },
  { title: 'Sprint planlama', description: 'Sonraki sprint icin gorev planlama.', goalType: 'task' as const },
  { title: 'Proje baslangici', description: 'CRM projesi resmi baslangic.', goalType: 'project_start' as const },
  { title: 'Q1 hedefleri', description: 'Ilk ceyrek gelir ve musteri hedefleri.', goalType: 'milestone' as const },
];

export const seedService = {
  // Clear all data from collections
  clearAll: async () => {
    for (const collectionName of COLLECTIONS) {
      const collRef = collection(db, collectionName);
      const snapshot = await getDocs(collRef);

      // Batch delete (max 500 per batch)
      const batches: ReturnType<typeof writeBatch>[] = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      snapshot.docs.forEach((document) => {
        currentBatch.delete(doc(db, collectionName, document.id));
        operationCount++;

        if (operationCount === 500) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
      });

      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      for (const batch of batches) {
        await batch.commit();
      }
    }
  },

  // Seed demo data
  seedAll: async () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // 1. Create Customers
    const customerIds: string[] = [];
    for (let i = 0; i < DEMO_CUSTOMERS.length; i++) {
      const customer = DEMO_CUSTOMERS[i];
      const temperatures = ['hot', 'warm', 'cold'] as const;
      const lastContactDays = [2, 5, 10, 20, 35, 50];

      const docRef = await addDoc(collection(db, 'customers'), {
        ...customer,
        temperature: temperatures[i % 3],
        lastContactDate: Timestamp.fromDate(subDays(now, lastContactDays[i])),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      customerIds.push(docRef.id);
    }

    // 2. Create Projects (linked to customers)
    const projectIds: { id: string; name: string; customerId: string; customerName: string }[] = [];
    for (let i = 0; i < DEMO_PROJECTS.length; i++) {
      const project = DEMO_PROJECTS[i];
      const customerIndex = i % customerIds.length;
      const customerId = customerIds[customerIndex];
      const customerName = DEMO_CUSTOMERS[customerIndex].company;

      const startOffset = i * 10;
      const endOffset = startOffset + 30 + (i * 5);

      const docRef = await addDoc(collection(db, 'projects'), {
        ...project,
        customerId,
        customerName,
        targetStartDate: Timestamp.fromDate(subDays(now, startOffset)),
        targetEndDate: Timestamp.fromDate(addDays(now, endOffset)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      projectIds.push({ id: docRef.id, name: project.name, customerId, customerName });
    }

    // 3. Create Tasks (linked to projects)
    for (let i = 0; i < DEMO_TASKS.length; i++) {
      const task = DEMO_TASKS[i];
      const projectIndex = i % projectIds.length;
      const project = projectIds[projectIndex];

      const dueOffset = (i + 1) * 3;
      const isThisWeek = i < 4;

      await addDoc(collection(db, 'tasks'), {
        ...task,
        projectId: project.id,
        projectName: project.name,
        customerId: project.customerId,
        customerName: project.customerName,
        sourceCommunicationId: null,
        order: i,
        dueDate: Timestamp.fromDate(addDays(now, dueOffset)),
        weeklyPlanDate: isThisWeek ? Timestamp.fromDate(weekStart) : null,
        completedAt: task.status === 'done' ? Timestamp.fromDate(subDays(now, 2)) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Create Communications (linked to customers)
    for (let i = 0; i < DEMO_COMMUNICATIONS.length; i++) {
      const comm = DEMO_COMMUNICATIONS[i];
      const customerIndex = i % customerIds.length;
      const customerId = customerIds[customerIndex];
      const customerName = DEMO_CUSTOMERS[customerIndex].company;

      // Some communications have project links
      const projectIndex = i % projectIds.length;
      const hasProject = i % 2 === 0;
      const project = hasProject ? projectIds[projectIndex] : null;

      const dateOffset = (i + 1) * 4;
      const hasNextAction = comm.nextAction !== null;
      const nextActionOffset = 7;

      await addDoc(collection(db, 'communications'), {
        customerId,
        customerName,
        projectId: project?.id || null,
        projectName: project?.name || null,
        type: comm.type,
        date: Timestamp.fromDate(subDays(now, dateOffset)),
        summary: comm.summary,
        nextAction: comm.nextAction,
        nextActionDate: hasNextAction ? Timestamp.fromDate(addDays(now, nextActionOffset)) : null,
        createdAt: serverTimestamp(),
      });
    }

    // 5. Create Goals
    const normalizedWeekStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), 0, 0, 0, 0);
    const nextWeekStart = new Date(normalizedWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    for (let i = 0; i < DEMO_GOALS.length; i++) {
      const goal = DEMO_GOALS[i];
      const statuses: GoalStatus[] = ['planned', 'in_progress', 'completed', 'planned', 'in_progress'];
      const types: GoalType[] = ['weekly', 'weekly', 'weekly', 'monthly', 'yearly'];

      const type = types[i];
      const isThisWeek = i < 3;

      await addDoc(collection(db, 'goals'), {
        ...goal,
        type,
        status: statuses[i],
        targetDate: Timestamp.fromDate(addDays(now, (i + 1) * 5)),
        weekStart: type === 'weekly' ? Timestamp.fromDate(isThisWeek ? normalizedWeekStart : nextWeekStart) : null,
        month: type === 'monthly' ? now.getMonth() : null,
        year: now.getFullYear(),
        relatedProjectId: i < projectIds.length ? projectIds[i].id : null,
        relatedCustomerId: i < customerIds.length ? customerIds[i] : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return {
      customers: customerIds.length,
      projects: projectIds.length,
      tasks: DEMO_TASKS.length,
      communications: DEMO_COMMUNICATIONS.length,
      goals: DEMO_GOALS.length,
    };
  },

  // Clear and seed in one call
  resetAndSeed: async () => {
    await seedService.clearAll();
    return await seedService.seedAll();
  },
};
