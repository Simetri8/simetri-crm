'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Customer, Project, Communication } from '@/lib/types';
import { customerService } from '@/lib/firebase/customers';
import { projectService } from '@/lib/firebase/projects';
import { communicationService } from '@/lib/firebase/communications';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { CommunicationFormDialog } from '@/components/communications/communication-form-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Edit, Building2, Mail, Phone, Calendar, MessageSquare, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CUSTOMER_TEMPERATURE_COLORS, CUSTOMER_TEMPERATURE_LABELS, PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '@/lib/utils/status';
import Link from 'next/link';

const COMMUNICATION_TYPE_LABELS: Record<string, string> = {
  phone: 'Telefon',
  email: 'E-posta',
  meeting: 'Toplanti',
  other: 'Diger',
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [communicationDialogOpen, setCommunicationDialogOpen] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customerData, projectsData, communicationsData] = await Promise.all([
        customerService.getById(customerId),
        projectService.getByCustomer(customerId),
        communicationService.getByCustomer(customerId),
      ]);

      if (!customerData) {
        router.push('/customers');
        return;
      }

      setCustomer(customerData);
      setProjects(projectsData);
      setCommunications(communicationsData);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSuccess = () => {
    loadData();
  };

  const handleAddCommunication = () => {
    setSelectedCommunication(null);
    setCommunicationDialogOpen(true);
  };

  const handleEditCommunication = (communication: Communication) => {
    setSelectedCommunication(communication);
    setCommunicationDialogOpen(true);
  };

  const handleCommunicationSuccess = () => {
    loadData();
  };

  if (loading) {
    return <div>Yukleniyor...</div>;
  }

  if (!customer) {
    return <div>Musteri bulunamadi.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
            <Badge className={CUSTOMER_TEMPERATURE_COLORS[customer.temperature]}>
              {CUSTOMER_TEMPERATURE_LABELS[customer.temperature]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{customer.company}</p>
        </div>
        <Button variant="outline" onClick={() => setCustomerDialogOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Duzenle
        </Button>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Firma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{customer.company}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-posta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={`mailto:${customer.email}`} className="font-medium text-primary hover:underline">
              {customer.email}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={`tel:${customer.phone}`} className="font-medium text-primary hover:underline">
              {customer.phone}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Son Iletisim
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {customer.lastContactDate
                ? format(customer.lastContactDate.toDate(), 'd MMMM yyyy', { locale: tr })
                : 'Henuz iletisim yok'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {customer.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <h3 className="text-xl font-semibold">Projeler</h3>
            <Badge variant="secondary">{projects.length}</Badge>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/projects">
              Tum Projeler
            </Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Bu musteriye ait proje bulunmuyor.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="hover:bg-muted/50 transition-colors">
                <Link href={`/projects/${project.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <Badge className={PROJECT_STATUS_COLORS[project.status]}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Communications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-xl font-semibold">Iletisim Gecmisi</h3>
            <Badge variant="secondary">{communications.length}</Badge>
          </div>
          <Button onClick={handleAddCommunication}>
            <Plus className="mr-2 h-4 w-4" />
            Gorusme Ekle
          </Button>
        </div>

        {communications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Bu musteriye ait iletisim kaydi bulunmuyor.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {communications.map((comm) => (
              <Card
                key={comm.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleEditCommunication(comm)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {COMMUNICATION_TYPE_LABELS[comm.type]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(comm.date.toDate(), 'd MMMM yyyy', { locale: tr })}
                        </span>
                      </div>
                      <p className="text-sm">{comm.summary}</p>
                      {comm.nextAction && (
                        <p className="text-sm text-muted-foreground">
                          Sonraki: {comm.nextAction}
                          {comm.nextActionDate && (
                            <span className="ml-1">
                              ({format(comm.nextActionDate.toDate(), 'd MMM yyyy', { locale: tr })})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Customer Edit Dialog */}
      <CustomerFormDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        customer={customer}
        onSuccess={handleCustomerSuccess}
      />

      {/* Communication Dialog */}
      <CommunicationFormDialog
        open={communicationDialogOpen}
        onOpenChange={setCommunicationDialogOpen}
        communication={selectedCommunication}
        preselectedCustomerId={customerId}
        onSuccess={handleCommunicationSuccess}
      />
    </div>
  );
}
