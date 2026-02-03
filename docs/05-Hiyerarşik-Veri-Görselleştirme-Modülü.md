# **Hiyerarşik Veri Görselleştirme Modülü \- Teknik Tasarım Dokümanı**

## **1\. Genel Bakış**

Bu modül, Next.js uygulaması içerisinde hiyerarşik (parent-child) ilişkiye sahip verilerin, **React Flow** kütüphanesi kullanılarak soldan sağa (Left-to-Right) akan dinamik bir ağaç yapısında görselleştirilmesini sağlar. Modül, düğümlerin (nodes) otomatik yerleşimini hesaplar ve kullanıcıya sürükle-bırak yöntemiyle ilişkileri yeniden düzenleme imkanı tanır.

## **2\. Mimari Bileşenler**

Sistem üç ana katmandan oluşur:

1. **Veri Dönüştürme Katmanı (Data Transformation Layer):** Ham veriyi graph yapısına çevirir.
2. **Yerleşim Motoru (Layout Engine):** Dagre.js kullanarak düğümlerin X/Y koordinatlarını hesaplar.
3. **Görünüm Katmanı (View Layer):** React Flow bileşenleri ve özel düğüm (Custom Node) tasarımları.

## **3\. Veri Yapısı (Data Model)**

Sistem, veritabanından gelen ilişkisel veriyi (Flat Data) görselleştirme motorunun anlayacağı Graph objelerine dönüştürür.

### **3.1. Giriş Verisi (Input)**

Backend veya API'den beklenen jenerik veri formatı:

interface GenericItem {  
 id: string;  
 parentId: string | null; // Kök düğüm için null  
 label: string;  
 type: 'root' | 'category' | 'leaf'; // İsteğe bağlı görsel varyasyonlar için  
 metadata?: any; // Ekstra bilgiler  
}

### **3.2. Dahili State Yapısı (React Flow State)**

Uygulama state'i içinde tutulacak yapı:

- **Nodes:** { id, position: {x, y}, data: { label }, type }
- **Edges:** { id, source, target, type: 'smoothstep' }

## **4\. Otomatik Yerleşim Stratejisi (Layout Strategy)**

Düğümlerin manuel konumlandırılması yerine, deterministik bir otomatik yerleşim algoritması kullanılır.

- **Kütüphane:** dagre (Directed Acyclic Graph Layout).
- **Yönelim:** rankdir: 'LR' (Soldan Sağa).
- **Algoritma Adımları:**
  1. Yeni bir dagre.graphlib.Graph() örneği oluşturulur.
  2. Graph yönü ('LR') ve düğümler arası varsayılan boşluklar (ranksep, nodesep) ayarlanır.
  3. Tüm düğümler (nodes) graph örneğine genişlik ve yükseklik bilgileriyle eklenir.
  4. Tüm kenarlar (edges) graph örneğine eklenir.
  5. dagre.layout(graph) çalıştırılarak koordinatlar hesaplanır.
  6. Hesaplanan x ve y değerleri React Flow düğümlerine geri yazılır.

## **5\. Bileşen Hiyerarşisi**

### **5.1. GraphContainer (Main Wrapper)**

- React Flow instance'ını barındırır.
- useNodesState ve useEdgesState hooklarını yönetir.
- Yerleşim hesaplama fonksiyonunu (getLayoutedElements) tetikler.
- Pencere boyutu değiştiğinde veya veri güncellendiğinde fitView ile görünümü ortalar.

### **5.2. CustomNode (Özel Düğüm Bileşeni)**

Standart kutular yerine özelleştirilmiş UI bileşeni.

- **Handle Yapısı:**
  - Target Handle (Giriş): Düğümün sol tarafında (Position.Left). Sadece "Kök" (Root) düğümde gizlenir.
  - Source Handle (Çıkış): Düğümün sağ tarafında (Position.Right). Sadece en uç (Leaf) düğümlerde gizlenebilir (opsiyonel).
- **Styling:** Tailwind CSS ile dinamik stillendirme (aktif, pasif, seçili durumları).

## **6\. Etkileşim ve Olaylar (Interactions)**

### **6.1. Bağlantı Oluşturma / Değiştirme (Re-parenting)**

Kullanıcı bir düğümün çıkış noktasından tutup başka bir düğümün giriş noktasına bıraktığında:

1. **Event:** onConnect tetiklenir.
2. **Validasyon:** Döngüsel bağımlılık (Cycle detection) kontrolü yapılır. (Bir parent kendi child'ına bağlanamaz).
3. **Aksiyon:**
   - Eski Edge silinir (Bir child'ın tek parent'ı olduğu senaryosu varsayılırsa).
   - Yeni Edge oluşturulur.
   - Layout fonksiyonu tekrar çalıştırılarak ağaç yapısı yeni hiyerarşiye göre yeniden çizilir.

### **6.2. Düğüm Seçimi**

- Bir düğüme tıklandığında onNodeClick olayı yakalanır ve seçili ID parent komponente iletilir (örneğin bir yan panel açmak için).

## **7\. Teknik Gereksinimler ve Paketler**

- **Çekirdek:** react, next
- **Görselleştirme:** @xyflow/react
- **Algoritma:** dagre
- **Stil:** tailwindcss
- **İkonlar:** lucide-react (Düğüm içi ikonlar için)

## **8\. Örnek Yerleşim Fonksiyonu (Pseudo-Code)**

const getLayoutedElements \= (nodes, edges, direction \= 'LR') \=\> {  
 const dagreGraph \= new dagre.graphlib.Graph();  
 dagreGraph.setDefaultEdgeLabel(() \=\> ({}));

dagreGraph.setGraph({ rankdir: direction });

nodes.forEach((node) \=\> {  
 dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });  
 });

edges.forEach((edge) \=\> {  
 dagreGraph.setEdge(edge.source, edge.target);  
 });

dagre.layout(dagreGraph);

const layoutedNodes \= nodes.map((node) \=\> {  
 const nodeWithPosition \= dagreGraph.node(node.id);  
 return {  
 ...node,  
 position: {  
 x: nodeWithPosition.x \- nodeWidth / 2,  
 y: nodeWithPosition.y \- nodeHeight / 2,  
 },  
 };  
 });

return { nodes: layoutedNodes, edges };  
};
