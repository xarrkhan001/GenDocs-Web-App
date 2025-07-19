import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { signOut } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  User, 
  PlusCircle, 
  Globe, 
  LogOut,
  Receipt,
  Briefcase,
  TrendingUp
} from 'lucide-react';

interface DashboardStats {
  totalInvoices: number;
  totalResumes: number;
  recentInvoices: any[];
  recentResumes: any[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalResumes: 0,
    recentInvoices: [],
    recentResumes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [invoicesResult, resumesResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
      ]);

      setStats({
        totalInvoices: invoicesResult.data?.length || 0,
        totalResumes: resumesResult.data?.length || 0,
        recentInvoices: invoicesResult.data?.slice(0, 5) || [],
        recentResumes: resumesResult.data?.slice(0, 5) || []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'english' ? 'urdu' : 'english');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-primary/80 rounded-lg">
              <Briefcase className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Business Tools
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleLanguage}>
              <Globe className="w-4 h-4 mr-2" />
              {language === 'english' ? 'اردو' : 'English'}
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              {t('signOut', language)}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {t('welcomeBack', language)}, {user?.user_metadata?.full_name || user?.email}!
          </h2>
          <p className="text-muted-foreground">
            Manage your invoices and resumes with our professional tools
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalInvoices', language)}</p>
                  <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalResumes', language)}</p>
                  <p className="text-2xl font-bold">{stats.totalResumes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                  <p className="text-2xl font-bold">{stats.totalInvoices + stats.totalResumes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/40">
            <CardContent 
              className="p-8 text-center"
              onClick={() => navigate('/invoice')}
            >
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('invoiceGenerator', language)}</h3>
              <p className="text-muted-foreground mb-4">
                Create professional invoices with auto-calculation and PDF export
              </p>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                <PlusCircle className="w-4 h-4 mr-2" />
                {t('createInvoice', language)}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/40">
            <CardContent 
              className="p-8 text-center"
              onClick={() => navigate('/resume')}
            >
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('resumeBuilder', language)}</h3>
              <p className="text-muted-foreground mb-4">
                Build beautiful resumes in English or Urdu with multiple templates
              </p>
              <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                <PlusCircle className="w-4 h-4 mr-2" />
                {t('createResume', language)}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                {t('recentInvoices', language)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentInvoices.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentInvoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/invoice/${invoice.id}`)}
                    >
                      <div>
                        <p className="font-medium">{invoice.client_name}</p>
                        <p className="text-sm text-muted-foreground">
                          #{invoice.invoice_number}
                        </p>
                      </div>
                      <p className="text-sm font-medium">${invoice.total_amount}</p>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => navigate('/invoices')}>
                    View All Invoices
                  </Button>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No invoices yet. Create your first invoice!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('recentResumes', language)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentResumes.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentResumes.map((resume) => (
                    <div 
                      key={resume.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/resume/${resume.id}`)}
                    >
                      <div>
                        <p className="font-medium">{resume.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {resume.language === 'urdu' ? 'اردو' : 'English'}
                        </p>
                      </div>
                      <p className="text-sm font-medium capitalize">{resume.template_id}</p>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => navigate('/resumes')}>
                    View All Resumes
                  </Button>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No resumes yet. Create your first resume!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;