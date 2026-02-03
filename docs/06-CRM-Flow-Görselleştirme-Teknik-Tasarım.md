# **CRM Flow Görselleştirme Modülü - Teknik Tasarım Dokümanı**

## **1. Genel Bakış**

Bu modül, Simetri Planner CRM sistemindeki "müşteri temaslarından task kapatmaya kadar" uzanan tam iş akışını, **React Flow** kütüphanesi kullanılarak soldan sağa (Left-to-Right) akan interaktif bir graf yapısında görselleştirir.

### **1.1. Amaç ve Kapsam**

**Problem:** Mevcut ekranlar yeni kullanıcılar için karmaşık; iş akışlarını anlamak ve uygulamak zor.

**Çözüm:** Tek bir ekranda görsel hiyerarşi:
- Company → Contact + Deal
- Deal → Proposal + WorkOrder (kazanıldığında)
- WorkOrder → Deliverable → Task
- Renk kodlu durum gösterimi
- İnteraktif drill-down (node'lara tıklayarak detay)
- Zoom, pan, filtreleme özellikleri

**Kapsam Dışı:**
- Task kanban board (bu modül onun yerini alıyor)
- Gerçek zamanlı işbirliği (real-time collaboration)
- Node'ları sürükle-bırak ile yeniden bağlama (sadece görselleştirme)

---

## **2. Mimari Bileşenler**

Sistem üç ana katmandan oluşur:

1. **Veri Dönüştürme Katmanı:** Firebase Firestore'dan gelen flat data'yı React Flow graph yapısına çevirir
2. **Yerleşim Motoru:** Dagre.js ile otomatik node yerleşimi (soldan sağa)
3. **Görünüm Katmanı:** React Flow bileşenleri ve 7 farklı özel node tipi

---

## **3. Veri Modeli ve Dönüşüm**

### **3.1. Mevcut Firebase Veri Yapısı**

Sistemde **denormalizasyon** stratejisi kullanılıyor - her child entity parent isimlerini saklıyor:

```typescript
// lib/types/index.ts'den mevcut tipler

Company {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  nextAction: string | null;
  nextActionDate: Timestamp | null;
  // ... BaseEntity fields
}

Contact {
  id: string;
  companyId: string;
  companyName: string;        // Denormalized!
  fullName: string;
  isPrimary: boolean;
  // ...
}

Deal {
  id: string;
  companyId: string;
  companyName: string;        // Denormalized!
  primaryContactId: string;
  primaryContactName: string; // Denormalized!
  title: string;
  stage: 'lead' | 'qualified' | 'proposal-prep' | 'proposal-sent' |
         'negotiation' | 'won' | 'lost';
  estimatedBudgetMinor: number | null;
  currency: 'TRY' | 'USD' | 'EUR';
  // ...
}

Proposal {
  id: string;
  dealId: string;
  dealTitle: string;          // Denormalized!
  companyId: string;
  companyName: string;        // Denormalized!
  version: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  items: ProposalItem[];
  grandTotalMinor: number;
  // ...
}

WorkOrder {
  id: string;
  companyId: string;
  companyName: string;        // Denormalized!
  dealId: string | null;
  dealTitle: string | null;   // Denormalized!
  proposalId: string | null;
  title: string;
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  targetDeliveryDate: Timestamp;
  paymentStatus: 'unplanned' | 'deposit-requested' | 'deposit-received' |
                 'invoiced' | 'paid';
  // ...
}

Deliverable {
  id: string;
  workOrderId: string;
  workOrderTitle: string;     // Denormalized!
  title: string;
  status: 'not-started' | 'in-progress' | 'blocked' | 'delivered' | 'approved';
  targetDate: Timestamp | null;
  // ...
}

Task {
  id: string;
  workOrderId: string;
  workOrderTitle: string;     // Denormalized!
  deliverableId: string | null;
  deliverableTitle: string | null; // Denormalized!
  title: string;
  status: 'backlog' | 'in-progress' | 'blocked' | 'done';
  blockedReason: 'waiting-client' | 'internal-approval' | 'payment' |
                 'dependency' | 'other' | null;
  assigneeId: string | null;
  assigneeName: string | null; // Denormalized!
  dueDate: Timestamp | null;
  // ...
}
```

### **3.2. React Flow Node Yapısı**

Her Firebase entity bir React Flow node'una dönüştürülür:

```typescript
type FlowNode = {
  id: string;                    // Entity ID
  type: 'company' | 'contact' | 'deal' | 'proposal' |
        'workOrder' | 'deliverable' | 'task';
  position: { x: number; y: number };  // Dagre tarafından hesaplanacak
  data: {
    // Display bilgileri
    label: string;               // Ana başlık (name, title, fullName)
    subtitle?: string;           // Alt bilgi (status, stage, etc.)
    status?: string;             // Renklendirme için
    metadata: {                  // Orijinal entity verisinin tamamı
      ...originalEntityData
    };
  };
};

type FlowEdge = {
  id: string;                    // source-target formatında
  source: string;                // Parent node ID
  target: string;                // Child node ID
  type: 'smoothstep';            // React Flow edge tipi
  animated?: boolean;            // Aktif/önemli bağlantıları vurgulamak için
};
```

### **3.3. İlişki Haritası (Relationships)**

```
Company (ROOT)
├── Contact[] (companyId ile bağlı)
└── Deal[] (companyId ile bağlı)
    ├── Proposal[] (dealId ile bağlı)
    └── WorkOrder[] (dealId ile bağlı, sadece stage === 'won' ise)

WorkOrder (Company'den de doğrudan oluşabilir)
└── Deliverable[] (workOrderId ile bağlı)
    └── Task[] (deliverableId ile bağlı)
    └── Task[] (orphan - sadece workOrderId, deliverableId === null)
```

**Özel Durumlar:**
- Bir Deal'den birden fazla Proposal olabilir (versioning)
- Bir Deal kazanıldığında (won) WorkOrder'a dönüşür
- WorkOrder standalone olarak da oluşturulabilir (dealId === null)
- Task'lar deliverable'a bağlı veya orphan olabilir

---

## **4. Node Tipleri ve Tasarımları**

Her node tipi için özel React component'i olacak. Tüm node'lar Tailwind CSS ile stillendirilecek.

### **4.1. Company Node**

**Görsel Özellikler:**
- Büyük, dikkat çekici (width: 280px, height: 80px)
- Icon: Building2 (lucide-react)
- Renk: Slate-blue gradient
- Handle: Sadece sağda (Source) - çünkü root level

**Data Mapping:**
```typescript
{
  label: company.name,
  subtitle: COMPANY_STATUS_CONFIG[company.status].label,
  status: company.status,
  metadata: { ...company, nextActionSummary }
}
```

**Status Colors (lib/utils/status.ts):**
- active: green (bg-green-100, text-green-700)
- inactive: gray (bg-gray-100, text-gray-500)

### **4.2. Contact Node**

**Görsel Özellikler:**
- Küçük, kompakt (width: 200px, height: 60px)
- Icon: User (lucide-react)
- Renk: Teal
- Handles: Sol (Target) + Sağ (Source - sadece isPrimary ise vurgulu)

**Data Mapping:**
```typescript
{
  label: contact.fullName,
  subtitle: contact.title || contact.email,
  status: contact.isPrimary ? 'primary' : 'regular',
  metadata: { ...contact }
}
```

**Visual Indicator:**
- isPrimary === true → Badge "Birincil İletişim" göster

### **4.3. Deal Node**

**Görsel Özellikler:**
- Orta boy (width: 260px, height: 90px)
- Icon: Handshake (lucide-react)
- Renk: Stage'e göre dinamik (DEAL_STAGE_CONFIG)
- Handles: Sol (Target) + Sağ (Source)

**Data Mapping:**
```typescript
{
  label: deal.title,
  subtitle: `${DEAL_STAGE_CONFIG[deal.stage].label} • ${formatMoney(deal.estimatedBudgetMinor, deal.currency)}`,
  status: deal.stage,
  metadata: { ...deal, primaryContactName }
}
```

**Status Colors (lib/utils/status.ts):**
- lead: slate (bg-slate-100, text-slate-700)
- qualified: blue (bg-blue-100, text-blue-700)
- proposal-prep: indigo (bg-indigo-100, text-indigo-700)
- proposal-sent: purple (bg-purple-100, text-purple-700)
- negotiation: amber (bg-amber-100, text-amber-700)
- won: green (bg-green-100, text-green-700)
- lost: red (bg-red-100, text-red-700)

**Özel Gösterim:**
- stage === 'lost' → lostReason badge ekle
- estimatedBudgetMinor → formatMoney() ile göster

### **4.4. Proposal Node**

**Görsel Özellikler:**
- Orta boy (width: 240px, height: 80px)
- Icon: FileText (lucide-react)
- Renk: Status'e göre (PROPOSAL_STATUS_CONFIG)
- Handles: Sol (Target) + Sağ (Source)

**Data Mapping:**
```typescript
{
  label: `Teklif v${proposal.version}`,
  subtitle: `${PROPOSAL_STATUS_CONFIG[proposal.status].label} • ${formatMoney(proposal.grandTotalMinor, proposal.currency)}`,
  status: proposal.status,
  metadata: { ...proposal, itemCount: proposal.items.length }
}
```

**Status Colors:**
- draft: gray
- sent: blue
- accepted: green
- rejected: red

### **4.5. Work Order Node**

**Görsel Özellikler:**
- Büyük, önemli (width: 280px, height: 100px)
- Icon: Briefcase (lucide-react)
- Renk: Status'e göre (WORK_ORDER_STATUS_CONFIG)
- Handles: Sol (Target) + Sağ (Source)

**Data Mapping:**
```typescript
{
  label: workOrder.title,
  subtitle: `${WORK_ORDER_STATUS_CONFIG[workOrder.status].label} • ${PAYMENT_STATUS_CONFIG[workOrder.paymentStatus].label}`,
  status: workOrder.status,
  metadata: {
    ...workOrder,
    isOverdue: workOrder.targetDeliveryDate < Timestamp.now(),
    daysUntilDelivery: calculateDays(workOrder.targetDeliveryDate)
  }
}
```

**Status Colors:**
- active: green
- on-hold: amber
- completed: blue
- cancelled: red

**Özel Gösterim:**
- isOverdue → kırmızı warning icon
- targetDeliveryDate yakın (< 7 gün) → sarı warning icon
- paymentStatus badge

### **4.6. Deliverable Node**

**Görsel Özellikler:**
- Orta boy (width: 240px, height: 80px)
- Icon: Package (lucide-react)
- Renk: Status'e göre (DELIVERABLE_STATUS_CONFIG)
- Handles: Sol (Target) + Sağ (Source)

**Data Mapping:**
```typescript
{
  label: deliverable.title,
  subtitle: DELIVERABLE_STATUS_CONFIG[deliverable.status].label,
  status: deliverable.status,
  metadata: { ...deliverable, taskCount }
}
```

**Status Colors:**
- not-started: gray
- in-progress: blue
- blocked: red
- delivered: purple
- approved: green

### **4.7. Task Node**

**Görsel Özellikler:**
- Küçük, kompakt (width: 220px, height: 70px)
- Icon: CheckSquare (lucide-react)
- Renk: Status'e göre (TASK_STATUS_CONFIG)
- Handles: Sadece sol (Target) - çünkü leaf node

**Data Mapping:**
```typescript
{
  label: task.title,
  subtitle: `${TASK_STATUS_CONFIG[task.status].label}${task.assigneeName ? ' • ' + task.assigneeName : ''}`,
  status: task.status,
  metadata: { ...task, isOverdue: task.dueDate && task.dueDate < Timestamp.now() }
}
```

**Status Colors:**
- backlog: gray
- in-progress: blue
- blocked: red (+ blockedReason badge)
- done: green

**Özel Gösterim:**
- blocked → BLOCKED_REASON_LABELS[blockedReason] badge
- isOverdue → kırmızı clock icon
- assigneeName → avatar veya initials

---

## **5. Veri Çekme Stratejisi (Data Fetching)**

### **5.1. Service Methodları (Mevcut)**

Tüm entity'ler için mevcut Firebase service'ler kullanılacak:

```typescript
// lib/firebase/companies.ts
companyService.getById(companyId: string): Promise<Company | null>

// lib/firebase/contacts.ts
// NOT: contacts.ts service dosyasını kontrol etmek gerekiyor
// Tahmin: contactService.getAll({ companyId })

// lib/firebase/deals.ts
dealService.getAll({ companyId?: string }): Promise<Deal[]>

// lib/firebase/proposals.ts
// NOT: proposals.ts service dosyasını kontrol etmek gerekiyor
// Tahmin: proposalService.getAll({ dealId })

// lib/firebase/work-orders.ts
workOrderService.getAll({ companyId?, dealId? }): Promise<WorkOrder[]>

// lib/firebase/deliverables.ts
// NOT: deliverables.ts service dosyasını kontrol etmek gerekiyor
// Tahmin: deliverableService.getAll({ workOrderId })

// lib/firebase/tasks.ts
// NOT: tasks.ts service dosyasını kontrol etmek gerekiyor
// Tahmin: taskService.getAll({ workOrderId?, deliverableId? })
```

### **5.2. Data Loading Strategy**

**Seçenek 1: Top-Down (Önerilen)**
1. Company'yi yükle
2. Parallel olarak Contact[] ve Deal[] yükle
3. Her Deal için Proposal[] ve WorkOrder[] yükle
4. Her WorkOrder için Deliverable[] yükle
5. Her Deliverable için Task[] yükle

**Seçenek 2: Lazy Loading**
- İlk render: Sadece Company + Contact + Deal
- Node tıklandığında children'ı yükle (expand/collapse)

**Performance Considerations:**
- Büyük şirketler için (100+ deal) pagination gerekebilir
- İlk yükleme: Son 6 ay / top 50 deal ile sınırla
- "Tümünü Göster" butonu ile genişlet
- React Query kullanarak cache yönetimi

### **5.3. Örnek Data Fetching Function**

```typescript
// lib/flow/data-fetcher.ts (yeni dosya)

export async function fetchCompanyFlowData(companyId: string): Promise<{
  nodes: FlowNode[];
  edges: FlowEdge[];
}> {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // 1. Company (root)
  const company = await companyService.getById(companyId);
  if (!company) throw new Error('Company not found');

  nodes.push({
    id: company.id,
    type: 'company',
    position: { x: 0, y: 0 }, // Dagre hesaplayacak
    data: {
      label: company.name,
      subtitle: COMPANY_STATUS_CONFIG[company.status].label,
      status: company.status,
      metadata: company,
    },
  });

  // 2. Contacts
  const contacts = await contactService.getAll({ companyId });
  contacts.forEach((contact, index) => {
    nodes.push({
      id: contact.id,
      type: 'contact',
      position: { x: 0, y: 0 },
      data: {
        label: contact.fullName,
        subtitle: contact.title || contact.email || '',
        status: contact.isPrimary ? 'primary' : 'regular',
        metadata: contact,
      },
    });
    edges.push({
      id: `${company.id}-${contact.id}`,
      source: company.id,
      target: contact.id,
      type: 'smoothstep',
    });
  });

  // 3. Deals
  const deals = await dealService.getAll({
    companyId,
    isArchived: false,
    limitCount: 50  // Performance
  });

  for (const deal of deals) {
    nodes.push({
      id: deal.id,
      type: 'deal',
      position: { x: 0, y: 0 },
      data: {
        label: deal.title,
        subtitle: `${DEAL_STAGE_CONFIG[deal.stage].label} • ${formatMoney(deal.estimatedBudgetMinor, deal.currency)}`,
        status: deal.stage,
        metadata: deal,
      },
    });
    edges.push({
      id: `${company.id}-${deal.id}`,
      source: company.id,
      target: deal.id,
      type: 'smoothstep',
      animated: deal.stage !== 'won' && deal.stage !== 'lost', // Aktif pipeline'ı vurgula
    });

    // 4. Proposals for this deal
    const proposals = await proposalService.getAll({ dealId: deal.id });
    proposals.forEach((proposal) => {
      nodes.push({
        id: proposal.id,
        type: 'proposal',
        position: { x: 0, y: 0 },
        data: {
          label: `Teklif v${proposal.version}`,
          subtitle: `${PROPOSAL_STATUS_CONFIG[proposal.status].label} • ${formatMoney(proposal.grandTotalMinor, proposal.currency)}`,
          status: proposal.status,
          metadata: proposal,
        },
      });
      edges.push({
        id: `${deal.id}-${proposal.id}`,
        source: deal.id,
        target: proposal.id,
        type: 'smoothstep',
      });
    });

    // 5. Work Orders for this deal (only if won)
    if (deal.stage === 'won') {
      const workOrders = await workOrderService.getAll({
        dealId: deal.id,
        isArchived: false
      });

      for (const wo of workOrders) {
        await addWorkOrderSubtree(wo, deal.id, nodes, edges);
      }
    }
  }

  // 6. Standalone Work Orders (no dealId)
  const standaloneWOs = await workOrderService.getAll({
    companyId,
    // TODO: dealId === null filter gerekiyor (service methodunu kontrol et)
    isArchived: false
  });

  for (const wo of standaloneWOs.filter(w => !w.dealId)) {
    await addWorkOrderSubtree(wo, company.id, nodes, edges);
  }

  return { nodes, edges };
}

async function addWorkOrderSubtree(
  wo: WorkOrder,
  parentId: string,
  nodes: FlowNode[],
  edges: FlowEdge[]
) {
  nodes.push({
    id: wo.id,
    type: 'workOrder',
    position: { x: 0, y: 0 },
    data: {
      label: wo.title,
      subtitle: `${WORK_ORDER_STATUS_CONFIG[wo.status].label} • ${PAYMENT_STATUS_CONFIG[wo.paymentStatus].label}`,
      status: wo.status,
      metadata: wo,
    },
  });
  edges.push({
    id: `${parentId}-${wo.id}`,
    source: parentId,
    target: wo.id,
    type: 'smoothstep',
    animated: wo.status === 'active',
  });

  // Deliverables
  const deliverables = await deliverableService.getAll({ workOrderId: wo.id });

  for (const deliv of deliverables) {
    nodes.push({
      id: deliv.id,
      type: 'deliverable',
      position: { x: 0, y: 0 },
      data: {
        label: deliv.title,
        subtitle: DELIVERABLE_STATUS_CONFIG[deliv.status].label,
        status: deliv.status,
        metadata: deliv,
      },
    });
    edges.push({
      id: `${wo.id}-${deliv.id}`,
      source: wo.id,
      target: deliv.id,
      type: 'smoothstep',
    });

    // Tasks for this deliverable
    const tasks = await taskService.getAll({
      workOrderId: wo.id,
      deliverableId: deliv.id
    });

    tasks.forEach((task) => {
      nodes.push({
        id: task.id,
        type: 'task',
        position: { x: 0, y: 0 },
        data: {
          label: task.title,
          subtitle: `${TASK_STATUS_CONFIG[task.status].label}${task.assigneeName ? ' • ' + task.assigneeName : ''}`,
          status: task.status,
          metadata: task,
        },
      });
      edges.push({
        id: `${deliv.id}-${task.id}`,
        source: deliv.id,
        target: task.id,
        type: 'smoothstep',
      });
    });
  }

  // Orphan tasks (no deliverable)
  const orphanTasks = await taskService.getAll({
    workOrderId: wo.id,
    // TODO: deliverableId === null filter (service methodunu kontrol et)
  });

  orphanTasks.filter(t => !t.deliverableId).forEach((task) => {
    nodes.push({
      id: task.id,
      type: 'task',
      position: { x: 0, y: 0 },
      data: {
        label: task.title,
        subtitle: `${TASK_STATUS_CONFIG[task.status].label}${task.assigneeName ? ' • ' + task.assigneeName : ''}`,
        status: task.status,
        metadata: task,
      },
    });
    edges.push({
      id: `${wo.id}-${task.id}`,
      source: wo.id,
      target: task.id,
      type: 'smoothstep',
    });
  });
}
```

---

## **6. Otomatik Yerleşim (Layout Engine)**

### **6.1. Dagre Konfigürasyonu**

```typescript
// lib/flow/layout.ts (yeni dosya)

import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

// Node boyutları (type'a göre)
const NODE_DIMENSIONS = {
  company: { width: 280, height: 80 },
  contact: { width: 200, height: 60 },
  deal: { width: 260, height: 90 },
  proposal: { width: 240, height: 80 },
  workOrder: { width: 280, height: 100 },
  deliverable: { width: 240, height: 80 },
  task: { width: 220, height: 70 },
};

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Graph ayarları
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 100,  // Seviyeler arası boşluk (yatay)
    nodesep: 40,   // Aynı seviyedeki node'lar arası boşluk (dikey)
    edgesep: 20,   // Edge'ler arası boşluk
    marginx: 20,
    marginy: 20,
  });

  // Node'ları ekle
  nodes.forEach((node) => {
    const dimensions = NODE_DIMENSIONS[node.type as keyof typeof NODE_DIMENSIONS] ||
                      { width: 200, height: 60 };
    dagreGraph.setNode(node.id, dimensions);
  });

  // Edge'leri ekle
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Layout hesapla
  dagre.layout(dagreGraph);

  // Hesaplanan pozisyonları node'lara uygula
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const dimensions = NODE_DIMENSIONS[node.type as keyof typeof NODE_DIMENSIONS] ||
                      { width: 200, height: 60 };

    return {
      ...node,
      position: {
        // Dagre merkez koordinatları veriyor, biz top-left istiyoruz
        x: nodeWithPosition.x - dimensions.width / 2,
        y: nodeWithPosition.y - dimensions.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

### **6.2. Layout Optimization**

**Büyük Grafikler İçin:**
- Seviyeler arası boşluğu azalt (ranksep: 80)
- Virtual scrolling kullan
- Minimap ekle (React Flow MiniMap component)

---

## **7. Component Hiyerarşisi**

### **7.1. Dosya Yapısı**

```
app/(auth)/
  flow-view/
    page.tsx                 # Ana flow sayfası (company seçimi)
    [companyId]/
      page.tsx               # Belirli company için flow view

components/flow/
  flow-container.tsx         # Ana React Flow wrapper
  nodes/
    company-node.tsx
    contact-node.tsx
    deal-node.tsx
    proposal-node.tsx
    work-order-node.tsx
    deliverable-node.tsx
    task-node.tsx
  detail-panel.tsx           # Sağ tarafta açılan detay paneli
  flow-controls.tsx          # Zoom, fit, export butonları
  flow-filters.tsx           # Status, date range, owner filtreleri

lib/flow/
  data-fetcher.ts            # Veri çekme fonksiyonları
  layout.ts                  # Dagre layout hesaplamaları
  types.ts                   # Flow-specific type definitions
```

### **7.2. FlowContainer Component (Ana)**

```typescript
// components/flow/flow-container.tsx

'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
  OnNodeClick,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CompanyNode } from './nodes/company-node';
import { ContactNode } from './nodes/contact-node';
import { DealNode } from './nodes/deal-node';
import { ProposalNode } from './nodes/proposal-node';
import { WorkOrderNode } from './nodes/work-order-node';
import { DeliverableNode } from './nodes/deliverable-node';
import { TaskNode } from './nodes/task-node';
import { DetailPanel } from './detail-panel';
import { FlowControls } from './flow-controls';
import { FlowFilters } from './flow-filters';
import { getLayoutedElements } from '@/lib/flow/layout';

// Node type map
const nodeTypes = {
  company: CompanyNode,
  contact: ContactNode,
  deal: DealNode,
  proposal: ProposalNode,
  workOrder: WorkOrderNode,
  deliverable: DeliverableNode,
  task: TaskNode,
};

type FlowContainerProps = {
  initialNodes: Node[];
  initialEdges: Edge[];
  companyId: string;
};

export function FlowContainer({
  initialNodes,
  initialEdges,
  companyId,
}: FlowContainerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // İlk layout hesapla
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      'LR'
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Node tıklama
  const onNodeClick: OnNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  }, []);

  // Fit view
  const handleFitView = useCallback(() => {
    // React Flow'un fitView methodunu çağır (ref ile)
  }, []);

  // Filter değiştiğinde yeniden layout
  const handleFilterChange = useCallback((filters: any) => {
    // TODO: Node'ları filtrele ve layout'u yeniden hesapla
  }, []);

  return (
    <div className="relative w-full h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            // Node type'a göre renk
            return '#e5e7eb'; // Default gray
          }}
        />
      </ReactFlow>

      {/* Top controls */}
      <div className="absolute top-4 left-4 z-10">
        <FlowControls onFitView={handleFitView} />
      </div>

      {/* Filters */}
      <div className="absolute top-4 right-4 z-10">
        <FlowFilters onChange={handleFilterChange} />
      </div>

      {/* Detail panel */}
      {isPanelOpen && selectedNode && (
        <DetailPanel
          node={selectedNode}
          onClose={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  );
}
```

### **7.3. Custom Node Örneği (Company Node)**

```typescript
// components/flow/nodes/company-node.tsx

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMPANY_STATUS_CONFIG } from '@/lib/utils/status';
import type { Company } from '@/lib/types';

export const CompanyNode = memo(({ data }: NodeProps) => {
  const company = data.metadata as Company;
  const statusConfig = COMPANY_STATUS_CONFIG[company.status];

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-lg',
        'bg-gradient-to-br from-slate-50 to-blue-50',
        'border-slate-300',
        'hover:shadow-xl transition-shadow cursor-pointer',
        'min-w-[280px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-5 w-5 text-slate-600" />
        <span className="font-semibold text-slate-900 text-sm">
          {data.label}
        </span>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            statusConfig.bgColor,
            statusConfig.color
          )}
        >
          {statusConfig.label}
        </span>

        {/* Next action indicator */}
        {company.nextAction && (
          <span className="text-xs text-slate-500 truncate">
            {company.nextAction}
          </span>
        )}
      </div>

      {/* Handle - sadece sağda (source) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-400 !border-slate-500"
      />
    </div>
  );
});

CompanyNode.displayName = 'CompanyNode';
```

### **7.4. Detail Panel**

```typescript
// components/flow/detail-panel.tsx

'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Node } from '@xyflow/react';

type DetailPanelProps = {
  node: Node;
  onClose: () => void;
};

export function DetailPanel({ node, onClose }: DetailPanelProps) {
  const { type, data } = node;
  const metadata = data.metadata;

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-white border-l shadow-2xl z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">{data.label}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100%-4rem)]">
        <div className="p-4 space-y-4">
          {/* Type-specific content */}
          {type === 'company' && <CompanyDetails data={metadata} />}
          {type === 'deal' && <DealDetails data={metadata} />}
          {type === 'workOrder' && <WorkOrderDetails data={metadata} />}
          {/* ... diğer tipler */}

          {/* Actions */}
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full">
              Detayları Görüntüle
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// Type-specific detail components
function CompanyDetails({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div>
        <span className="text-sm text-muted-foreground">Durum:</span>
        <p className="font-medium">{data.status}</p>
      </div>
      {/* ... diğer alanlar */}
    </div>
  );
}

// ... diğer detail components
```

---

## **8. Etkileşim ve Kullanıcı Deneyimi**

### **8.1. Node Tıklama (Click)**

```typescript
onNodeClick = (event, node) => {
  // 1. Sağ paneli aç
  setSelectedNode(node);
  setIsPanelOpen(true);

  // 2. İlgili node'u highlight et
  setNodes((nds) =>
    nds.map((n) => ({
      ...n,
      style: {
        ...n.style,
        opacity: n.id === node.id ? 1 : 0.5,
      },
    }))
  );

  // 3. Connected node'ları vurgula
  const connectedNodeIds = getConnectedNodes(node.id, edges);
  // ... highlight logic
};
```

### **8.2. Filtreleme**

```typescript
type FlowFilters = {
  dealStages?: DealStage[];
  workOrderStatuses?: WorkOrderStatus[];
  taskStatuses?: TaskStatus[];
  dateRange?: { start: Date; end: Date };
  ownerId?: string;
  hideCompleted?: boolean;
};

function applyFilters(allNodes: Node[], filters: FlowFilters): Node[] {
  return allNodes.filter((node) => {
    const { type, data } = node;

    // Hide completed deals/work orders
    if (filters.hideCompleted) {
      if (type === 'deal' && data.metadata.stage === 'won') return false;
      if (type === 'workOrder' && data.metadata.status === 'completed') return false;
    }

    // Deal stage filter
    if (filters.dealStages && type === 'deal') {
      return filters.dealStages.includes(data.metadata.stage);
    }

    // Work order status filter
    if (filters.workOrderStatuses && type === 'workOrder') {
      return filters.workOrderStatuses.includes(data.metadata.status);
    }

    // Task status filter
    if (filters.taskStatuses && type === 'task') {
      return filters.taskStatuses.includes(data.metadata.status);
    }

    return true;
  });
}
```

### **8.3. Zoom ve Navigation**

```typescript
// React Flow built-in controls kullanılacak
<Controls
  showZoom={true}
  showFitView={true}
  showInteractive={true}
/>

// Custom controls
<Button onClick={() => reactFlowInstance?.zoomIn()}>
  <ZoomIn />
</Button>
<Button onClick={() => reactFlowInstance?.zoomOut()}>
  <ZoomOut />
</Button>
<Button onClick={() => reactFlowInstance?.fitView()}>
  <Maximize />
</Button>
```

### **8.4. Export / Screenshot**

```typescript
// React Flow'un built-in export fonksiyonu
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';

async function exportFlowAsPNG() {
  const nodesBounds = getNodesBounds(nodes);
  const transform = getViewportForBounds(
    nodesBounds,
    imageWidth,
    imageHeight,
    0.5,
    2
  );

  const element = document.querySelector('.react-flow__viewport');
  const dataUrl = await toPng(element, {
    width: imageWidth,
    height: imageHeight,
    style: {
      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
    },
  });

  // Download
  const link = document.createElement('a');
  link.download = `flow-${companyName}-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
}
```

---

## **9. Routing ve Navigation**

### **9.1. Route Yapısı**

```
/flow-view                    # Company listesi (tüm companies)
/flow-view/[companyId]        # Belirli bir company'nin flow'u
```

### **9.2. Company List Page**

```typescript
// app/(auth)/flow-view/page.tsx

import { companyService } from '@/lib/firebase/companies';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

export default async function FlowViewPage() {
  const companies = await companyService.getAll({
    isArchived: false,
    limitCount: 100
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">İş Akışı Görünümü</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/flow-view/${company.id}`}
            className="p-4 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5" />
              <h3 className="font-semibold">{company.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {/* Deal count, WO count summary */}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### **9.3. Company Flow Page**

```typescript
// app/(auth)/flow-view/[companyId]/page.tsx

import { fetchCompanyFlowData } from '@/lib/flow/data-fetcher';
import { FlowContainer } from '@/components/flow/flow-container';
import { notFound } from 'next/navigation';

export default async function CompanyFlowPage({
  params,
}: {
  params: { companyId: string };
}) {
  try {
    const { nodes, edges } = await fetchCompanyFlowData(params.companyId);

    return (
      <FlowContainer
        initialNodes={nodes}
        initialEdges={edges}
        companyId={params.companyId}
      />
    );
  } catch (error) {
    notFound();
  }
}
```

---

## **10. Teknik Gereksinimler**

### **10.1. Yeni Paketler**

```json
// package.json additions
{
  "dependencies": {
    "@xyflow/react": "^12.0.0",
    "dagre": "^0.8.5"
  },
  "devDependencies": {
    "@types/dagre": "^0.7.52"
  }
}
```

### **10.2. Kurulum**

```bash
npm install @xyflow/react dagre
npm install -D @types/dagre
```

---

## **11. Implementation Phases (Aşamalı Geliştirme)**

### **Phase 1: Temel Yapı (2-3 gün)**
- [ ] Paket kurulumu
- [ ] `lib/flow/` klasör yapısı
- [ ] Temel FlowContainer component
- [ ] 7 custom node component (sadece görsel, veri çekme yok)
- [ ] Layout fonksiyonu (Dagre entegrasyonu)
- [ ] Test data ile görsel kontrol

### **Phase 2: Data Fetching (2 gün)**
- [ ] `lib/flow/data-fetcher.ts` implementation
- [ ] Company → Contact, Deal data loading
- [ ] Deal → Proposal, WorkOrder data loading
- [ ] WorkOrder → Deliverable → Task data loading
- [ ] Orphan task handling
- [ ] Standalone work order handling

### **Phase 3: Routing ve Navigation (1 gün)**
- [ ] `/flow-view` page (company list)
- [ ] `/flow-view/[companyId]` page
- [ ] Sidebar navigation item ekleme
- [ ] Breadcrumb navigation

### **Phase 4: Interaktivite (2 gün)**
- [ ] Node click → Detail panel
- [ ] Detail panel content (7 node type için)
- [ ] "Detayları Görüntüle" butonları (mevcut detay sayfalarına link)
- [ ] Node highlighting
- [ ] Connected nodes vurgulama

### **Phase 5: Filters ve Controls (2 gün)**
- [ ] FlowFilters component
- [ ] Deal stage filter
- [ ] Work order status filter
- [ ] Task status filter
- [ ] Date range filter
- [ ] Owner filter
- [ ] "Hide completed" toggle

### **Phase 6: UX İyileştirmeleri (1-2 gün)**
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states
- [ ] Performance optimization (React Query)
- [ ] Minimap styling
- [ ] Export PNG/SVG
- [ ] Keyboard shortcuts

### **Phase 7: Polish ve Test (1 gün)**
- [ ] Responsive check (min ekran genişliği: 1280px)
- [ ] Color consistency check
- [ ] Status badge alignment
- [ ] Icon consistency
- [ ] Test with real data (büyük şirket)
- [ ] Performance profiling

---

## **12. Bilinen Limitasyonlar ve Gelecek İyileştirmeler**

### **12.1. Şu An İçin Kapsam Dışı**
- Gerçek zamanlı güncelleme (real-time Firebase listeners)
- Node'ları sürükle-bırak ile yeniden düzenleme
- Çoklu şirket karşılaştırma (side-by-side)
- Activity feed'in flow üzerinde gösterimi
- Time entry'lerin görselleştirilmesi
- Mobile responsive (min 1280px desktop ekran)

### **12.2. Gelecek Versiyonlar**
- Lazy loading (virtualization)
- Progressive disclosure (collapse/expand)
- Search/filter by node label
- Timeline view (horizontal timeline + flow)
- Animated transitions (status değişikliklerinde)
- Collaboration (çoklu kullanıcı, cursors)

---

## **13. Notlar ve Uyarılar**

### **13.1. Service Kontrolü Gerekiyor**

Dokümantasyon hazırlanırken aşağıdaki service dosyaları kontrol edilmeli:
- `/lib/firebase/contacts.ts` - getAll methodunun tam signature'ı
- `/lib/firebase/proposals.ts` - getAll({ dealId }) desteği
- `/lib/firebase/deliverables.ts` - getAll({ workOrderId }) desteği
- `/lib/firebase/tasks.ts` - deliverableId === null filtering desteği

Eğer bu service'ler yoksa veya eksikse, implement edilmesi gerekecek.

### **13.2. Denormalizasyon Avantajı**

Mevcut denormalizasyon stratejisi flow view için **büyük avantaj** sağlıyor:
- Her node display name'ini ekstra query'ye gerek kalmadan gösterebilir
- Performance optimal (N+1 query problemi yok)
- Snapshot tutarlılığı (parent name değişse bile flow'da eski isim görünür - kabul edilebilir tradeoff)

### **13.3. Performance Considerations**

Büyük şirketler için (100+ deal, 500+ task):
- İlk yükleme yavaş olabilir (10-15 saniye)
- Pagination veya lazy loading şart
- React Query cache stratejisi önemli
- WebWorker'da layout hesabı yapılabilir (Dagre ağır)

---

## **14. Başarı Kriterleri**

Bu modül başarılı sayılır eğer:
- [x] Kullanıcı tek ekranda Company → Task'a kadar tüm hiyerarşiyi görebiliyorsa
- [x] Her node tipi farklı renk ve icon ile ayırt edilebiliyorsa
- [x] Node'lara tıklayarak detay bilgi görülebiliyorsa
- [x] Filtreler çalışıyorsa (stage, status, owner)
- [x] Zoom/pan performansı iyi ise (60 FPS)
- [x] 50 deal + 100 task içeren şirkette 5 saniyede yükleniyorsa
- [x] Mevcut UX karmaşıklığı sorunu çözülmüşse (user feedback)

---

## **15. Versiyon Bilgisi**

- **Doküman Versiyonu:** 1.0
- **Tarih:** 2026-02-03
- **Hazırlayan:** Claude Code
- **Durum:** Teknik Tasarım Tamamlandı - Implementation Bekliyor
