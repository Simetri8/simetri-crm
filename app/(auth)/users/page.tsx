'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/lib/firebase/users';
import { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, UserPlus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await userService.getAll();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      await userService.addToWhitelist(newEmail, newName);
      toast.success('Kullanıcı whitelist\'e eklendi');
      setNewEmail('');
      setNewName('');
      loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Kullanıcı eklenirken bir hata oluştu');
    }
  };

  const handleRemoveUser = async (id: string, email: string) => {
    if (!confirm(`${email} adresini whitelist'ten çıkarmak istediğinize emin misiniz?`)) return;

    try {
      await userService.removeFromWhitelist(id);
      toast.success('Kullanıcı whitelist\'ten çıkarıldı');
      loadUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Kullanıcı çıkarılırken bir hata oluştu');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h2>
        <p className="text-muted-foreground">
          Sisteme giriş yapabilecek yetkili e-posta adreslerini buradan yönetebilirsiniz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Yeni Yetkili Ekle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="E-posta adresi (örn: personel@şirket.com)"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Input
              placeholder="İsim (opsiyonel)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <UserPlus className="h-4 w-4 mr-2" />
              Ekle
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Yetkili Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İsim</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Eklenme Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Henüz yetkili kullanıcı eklenmemiş.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.displayName || '-'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.createdAt ? format(user.createdAt.toDate(), 'd MMM yyyy HH:mm', { locale: tr }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveUser(user.uid, user.email || '')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
