import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

const AllInvoices: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadInvoices();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
        </Card>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">No invoices found.</div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex-1 cursor-pointer" onClick={() => navigate(`/invoice/edit/${invoice.id}`)}>
                  <p className="font-medium">{invoice.client_name}</p>
                  <p className="text-sm text-muted-foreground">#{invoice.invoice_number}</p>
                </div>
                <p className="text-sm font-medium mr-4">${invoice.total_amount}</p>
                <Button size="icon" variant="ghost" onClick={() => navigate(`/invoice/edit/${invoice.id}`)} title="Edit">
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" title="Delete">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <p>Are you sure you want to delete this invoice?</p>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => {
                        setLoading(true);
                        await supabase.from('invoices').delete().eq('id', invoice.id);
                        await loadInvoices();
                        setLoading(false);
                      }}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
        <div className="mt-8">
          <Button variant="outline" onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </div>
    </div>
  );
};

export default AllInvoices; 