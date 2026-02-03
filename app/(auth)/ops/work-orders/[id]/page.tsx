'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Briefcase,
  CheckCircle,
  Clock,
  AlertTriangle,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/crm/status-badge';
import { DeliverableList } from '@/components/ops/deliverable-list';
import { DeliverableFormDialog } from '@/components/ops/deliverable-form-dialog';
import { TaskList } from '@/components/ops/task-list';
import { TaskFormDialog } from '@/components/ops/task-form-dialog';
import { WorkOrderFormDialog } from '@/components/ops/work-order-form-dialog';
import { workOrderService } from '@/lib/firebase/work-orders';
import { deliverableService } from '@/lib/firebase/deliverables';
import { taskService } from '@/lib/firebase/tasks';
import { companyService } from '@/lib/firebase/companies';
import { dealService } from '@/lib/firebase/deals';
import { userService } from '@/lib/firebase/users';
import { useAuth } from '@/components/auth/auth-provider';
import {
  WORK_ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '@/lib/types';
import {
  WORK_ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/lib/utils/status';
import { cn } from '@/lib/utils';
import type {
  WorkOrder,
  WorkOrderFormData,
  WorkOrderStatus,
  PaymentStatus,
  Deliverable,
  DeliverableFormData,
  DeliverableStatus,
  Task,
  TaskFormData,
  TaskStatus,
  Company,
  Deal,
  User,
} from '@/lib/types';

type DeliverableWithTasks = Deliverable & { tasks: Task[] };

export default function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [deliverables, setDeliverables] = useState<DeliverableWithTasks[]>([]);
  const [orphanTasks, setOrphanTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [editWorkOrderOpen, setEditWorkOrderOpen] = useState(false);
  const [deliverableFormOpen, setDeliverableFormOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);
  const [deleteDeliverable, setDeleteDeliverable] = useState<Deliverable | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const loadWorkOrder = async () => {
    try {
      const wo = await workOrderService.getById(id);
      setWorkOrder(wo);
    } catch (error) {
      console.error('Error loading work order:', error);
      toast.error('Is emri yuklenemedi');
    }
  };

  const loadDeliverables = async () => {
    try {
      const delivs = await deliverableService.getByWorkOrderId(id);
      const tasks = await taskService.getByWorkOrderId(id);

      // Group tasks by deliverableId
      const tasksByDeliverable: Record<string, Task[]> = {};
      const orphans: Task[] = [];

      tasks.forEach((task) => {
        if (task.deliverableId) {
          if (!tasksByDeliverable[task.deliverableId]) {
            tasksByDeliverable[task.deliverableId] = [];
          }
          tasksByDeliverable[task.deliverableId].push(task);
        } else {
          orphans.push(task);
        }
      });

      const deliverablesWithTasks: DeliverableWithTasks[] = delivs.map((d) => ({
        ...d,
        tasks: tasksByDeliverable[d.id] || [],
      }));

      setDeliverables(deliverablesWithTasks);
      setOrphanTasks(orphans);
    } catch (error) {
      console.error('Error loading deliverables:', error);
      toast.error('Teslimatlar yuklenemedi');
    }
  };

  const loadSupportData = async () => {
    try {
      const [companiesData, dealsData, usersData] = await Promise.all([
        companyService.getAll({ status: 'active' }),
        dealService.getAll({ isArchived: false }),
        userService.getAll(),
      ]);
      setCompanies(companiesData);
      setDeals(dealsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading support data:', error);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadWorkOrder(), loadDeliverables(), loadSupportData()]);
      setLoading(false);
    };
    loadAll();
  }, [id]);

  // Work Order handlers
  const handleUpdateWorkOrder = async (data: WorkOrderFormData) => {
    if (!user || !workOrder) return;
    try {
      await workOrderService.update(workOrder.id, data, user.uid);
      toast.success('Is emri guncellendi');
      loadWorkOrder();
    } catch (error) {
      console.error('Error updating work order:', error);
      toast.error('Is emri guncellenemedi');
    }
  };

  const handleStatusChange = async (status: WorkOrderStatus) => {
    if (!user || !workOrder) return;
    try {
      await workOrderService.updateStatus(workOrder.id, status, user.uid);
      toast.success('Durum guncellendi');
      loadWorkOrder();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Durum guncellenemedi');
    }
  };

  const handlePaymentStatusChange = async (paymentStatus: PaymentStatus) => {
    if (!user || !workOrder) return;
    try {
      await workOrderService.updatePaymentStatus(workOrder.id, paymentStatus, user.uid);
      toast.success('Odeme durumu guncellendi');
      loadWorkOrder();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Odeme durumu guncellenemedi');
    }
  };

  // Deliverable handlers
  const handleCreateDeliverable = async (data: DeliverableFormData) => {
    if (!user) return;
    try {
      await deliverableService.add(data, user.uid);
      toast.success('Teslimat eklendi');
      loadDeliverables();
    } catch (error) {
      console.error('Error creating deliverable:', error);
      toast.error('Teslimat eklenemedi');
    }
  };

  const handleUpdateDeliverable = async (data: DeliverableFormData) => {
    if (!user || !editingDeliverable) return;
    try {
      await deliverableService.update(editingDeliverable.id, data, user.uid);
      toast.success('Teslimat guncellendi');
      setEditingDeliverable(null);
      loadDeliverables();
    } catch (error) {
      console.error('Error updating deliverable:', error);
      toast.error('Teslimat guncellenemedi');
    }
  };

  const handleDeliverableStatusChange = async (
    deliverable: Deliverable,
    status: DeliverableStatus
  ) => {
    if (!user) return;
    try {
      await deliverableService.updateStatus(deliverable.id, status, user.uid);
      toast.success('Durum guncellendi');
      loadDeliverables();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Durum guncellenemedi');
    }
  };

  const handleDeleteDeliverable = async () => {
    if (!deleteDeliverable) return;
    try {
      await deliverableService.delete(deleteDeliverable.id);
      toast.success('Teslimat silindi');
      setDeleteDeliverable(null);
      loadDeliverables();
    } catch (error) {
      console.error('Error deleting deliverable:', error);
      toast.error('Teslimat silinemedi');
    }
  };

  // Task handlers
  const handleCreateTask = async (data: TaskFormData) => {
    if (!user) return;
    try {
      await taskService.add(data, user.uid);
      toast.success('Gorev eklendi');
      setSelectedDeliverableId(null);
      loadDeliverables();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Gorev eklenemedi');
    }
  };

  const handleUpdateTask = async (data: TaskFormData) => {
    if (!user || !editingTask) return;
    try {
      await taskService.update(editingTask.id, data, user.uid);
      toast.success('Gorev guncellendi');
      setEditingTask(null);
      loadDeliverables();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Gorev guncellenemedi');
    }
  };

  const handleTaskStatusChange = async (task: Task, status: TaskStatus) => {
    if (!user) return;
    try {
      await taskService.updateStatus(task.id, status, user.uid);
      toast.success('Durum guncellendi');
      loadDeliverables();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Durum guncellenemedi');
    }
  };

  const handleToggleTaskDone = async (task: Task) => {
    if (!user) return;
    const newStatus: TaskStatus = task.status === 'done' ? 'backlog' : 'done';
    await handleTaskStatusChange(task, newStatus);
  };

  const handleDeleteTask = async () => {
    if (!deleteTask) return;
    try {
      await taskService.delete(deleteTask.id);
      toast.success('Gorev silindi');
      setDeleteTask(null);
      loadDeliverables();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Gorev silinemedi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Is emri bulunamadi</p>
        <Link href="/ops/work-orders">
          <Button variant="link">Is emirlerine don</Button>
        </Link>
      </div>
    );
  }

  // Calculate stats
  const totalDeliverables = deliverables.length;
  const completedDeliverables = deliverables.filter(
    (d) => d.status === 'delivered' || d.status === 'approved'
  ).length;
  const blockedDeliverables = deliverables.filter((d) => d.status === 'blocked').length;

  const totalTasks = deliverables.reduce((acc, d) => acc + d.tasks.length, 0) + orphanTasks.length;
  const completedTasks =
    deliverables.reduce((acc, d) => acc + d.tasks.filter((t) => t.status === 'done').length, 0) +
    orphanTasks.filter((t) => t.status === 'done').length;
  const blockedTasks =
    deliverables.reduce((acc, d) => acc + d.tasks.filter((t) => t.status === 'blocked').length, 0) +
    orphanTasks.filter((t) => t.status === 'blocked').length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = workOrder.targetDeliveryDate.toDate();
  const isOverdue = targetDate < today;
  const daysUntilDue = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ops/work-orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{workOrder.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{workOrder.companyName}</span>
              {workOrder.dealTitle && (
                <>
                  <span>•</span>
                  <FileText className="h-4 w-4" />
                  <span>{workOrder.dealTitle}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditWorkOrderOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Duzenle
        </Button>
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Work Order Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Durum:</span>
                <Select value={workOrder.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {WORK_ORDER_STATUS_CONFIG[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Odeme:</span>
                <Select value={workOrder.paymentStatus} onValueChange={handlePaymentStatusChange}>
                  <SelectTrigger className="w-[160px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {PAYMENT_STATUS_CONFIG[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Date */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1 rounded-md text-sm',
                isOverdue
                  ? 'bg-red-100 text-red-800'
                  : daysUntilDue <= 7
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-green-100 text-green-800'
              )}
            >
              <Calendar className="h-4 w-4" />
              <span>
                {format(targetDate, 'dd MMM yyyy', { locale: tr })}
                {isOverdue ? ' (Gecikti!)' : daysUntilDue <= 0 ? ' (Bugun!)' : ` (${daysUntilDue} gun)`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Teslimatlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {completedDeliverables}/{totalDeliverables}
                </span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              {blockedDeliverables > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {blockedDeliverables} engelli
                </Badge>
              )}
            </div>
            {totalDeliverables > 0 && (
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(completedDeliverables / totalDeliverables) * 100}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gorevler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {completedTasks}/{totalTasks}
                </span>
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              {blockedTasks > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {blockedTasks} engelli
                </Badge>
              )}
            </div>
            {totalTasks > 0 && (
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${(completedTasks / totalTasks) * 100}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Genel Ilerleme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </span>
              {(blockedDeliverables > 0 || blockedTasks > 0) && (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {workOrder.scopeSummary || 'Kapsam ozeti eklenmemis'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deliverables & Tasks */}
      <DeliverableList
        deliverables={deliverables}
        onAdd={() => setDeliverableFormOpen(true)}
        onEdit={(d) => setEditingDeliverable(d)}
        onDelete={(d) => setDeleteDeliverable(d)}
        onStatusChange={handleDeliverableStatusChange}
        onAddTask={(d) => {
          setSelectedDeliverableId(d.id);
          setTaskFormOpen(true);
        }}
        renderTasks={(deliverable) => {
          const deliv = deliverables.find((d) => d.id === deliverable.id);
          const tasks = deliv?.tasks || [];
          return (
            <TaskList
              tasks={tasks}
              onAdd={() => {
                setSelectedDeliverableId(deliverable.id);
                setTaskFormOpen(true);
              }}
              onEdit={(t) => setEditingTask(t)}
              onDelete={(t) => setDeleteTask(t)}
              onStatusChange={handleTaskStatusChange}
              onToggleDone={handleToggleTaskDone}
            />
          );
        }}
      />

      {/* Orphan Tasks (no deliverable) */}
      {orphanTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Teslimata Atanmamis Gorevler</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={orphanTasks}
              onAdd={() => {
                setSelectedDeliverableId(null);
                setTaskFormOpen(true);
              }}
              onEdit={(t) => setEditingTask(t)}
              onDelete={(t) => setDeleteTask(t)}
              onStatusChange={handleTaskStatusChange}
              onToggleDone={handleToggleTaskDone}
            />
          </CardContent>
        </Card>
      )}

      {/* Add button for orphan tasks when no orphans exist */}
      {orphanTasks.length === 0 && (
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => {
            setSelectedDeliverableId(null);
            setTaskFormOpen(true);
          }}
        >
          Teslimatsiz Gorev Ekle
        </Button>
      )}

      {/* Edit Work Order Dialog */}
      <WorkOrderFormDialog
        open={editWorkOrderOpen}
        onOpenChange={setEditWorkOrderOpen}
        workOrder={workOrder}
        companies={companies}
        deals={deals}
        onSubmit={handleUpdateWorkOrder}
      />

      {/* Create Deliverable Dialog */}
      <DeliverableFormDialog
        open={deliverableFormOpen}
        onOpenChange={setDeliverableFormOpen}
        workOrderId={id}
        onSubmit={handleCreateDeliverable}
      />

      {/* Edit Deliverable Dialog */}
      <DeliverableFormDialog
        open={!!editingDeliverable}
        onOpenChange={(open) => !open && setEditingDeliverable(null)}
        workOrderId={id}
        deliverable={editingDeliverable}
        onSubmit={handleUpdateDeliverable}
      />

      {/* Delete Deliverable Confirmation */}
      <AlertDialog
        open={!!deleteDeliverable}
        onOpenChange={(open) => !open && setDeleteDeliverable(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Teslimati Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDeliverable?.title} teslimatini silmek istediginizden emin misiniz?
              Bu islem geri alinamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeliverable}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Task Dialog */}
      <TaskFormDialog
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        workOrderId={id}
        deliverableId={selectedDeliverableId}
        deliverables={deliverables}
        users={users}
        onSubmit={handleCreateTask}
      />

      {/* Edit Task Dialog */}
      <TaskFormDialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        workOrderId={id}
        task={editingTask}
        deliverables={deliverables}
        users={users}
        onSubmit={handleUpdateTask}
      />

      {/* Delete Task Confirmation */}
      <AlertDialog open={!!deleteTask} onOpenChange={(open) => !open && setDeleteTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gorevi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTask?.title} gorevini silmek istediginizden emin misiniz?
              Bu islem geri alinamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
