import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Download, Save, Globe, User, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../resume-print.css';
import Cropper from 'react-easy-crop';
import Modal from '@mui/material/Modal';
import Slider from '@mui/material/Slider';
import { getCroppedImg } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
}

const ResumeBuilder: React.FC<{ editMode?: boolean }> = ({ editMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const resumeRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();
  const isMobile = useIsMobile();
  const { theme } = useTheme();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [visiblePages, setVisiblePages] = useState(1);
  const [language, setLanguage] = useState<'english' | 'urdu'>('english');
  const [template, setTemplate] = useState<'modern' | 'classic' | 'minimal'>('modern');

  useEffect(() => {
    const savedTemplate = localStorage.getItem("lastResumeTemplate");
    if (savedTemplate === "modern" || savedTemplate === "classic" || savedTemplate === "minimal") {
      setTemplate(savedTemplate);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lastResumeTemplate", template);
  }, [template]);

  const [personalInfo, setPersonalInfo] = useState({
    fullName: 'Your Name',
    email: 'your@email.com',
    phone: '+92 300 0000000',
    address: 'Your City, Country',
    title: 'Job Title',
    summary: 'Write a short professional summary about yourself. Example: Passionate developer with 3+ years of experience in web and mobile app development. Skilled in React, Node.js, and UI/UX design.',
    profileImageUrl: ''
  });

  const [experiences, setExperiences] = useState<Experience[]>([
    { id: '1', company: 'Company Name', position: 'Job Position', startDate: '2022-01-01', endDate: '2023-12-31', description: 'Describe your responsibilities and achievements. Example: Built and maintained web applications, collaborated with cross-functional teams, improved performance by 30%.' },
    { id: '2', company: 'NextGen Solutions', position: 'Backend Developer', startDate: '2020-06-01', endDate: '2021-12-31', description: 'Developed REST APIs, optimized database queries, and ensured application security and scalability.' },
    { id: '3', company: 'Creative Studio', position: 'UI/UX Designer', startDate: '2019-01-01', endDate: '2020-05-31', description: 'Designed user interfaces, created wireframes, and improved user experience for mobile and web apps.' }
  ]);

  const [educations, setEducations] = useState<Education[]>([
    { id: '1', institution: 'Your University', degree: 'Your Degree', startDate: '2018-09-01', endDate: '2022-06-30' },
    { id: '2', institution: 'College of Science', degree: 'Intermediate', startDate: '2016-09-01', endDate: '2018-06-30' }
  ]);

  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript', 'Teamwork', 'Problem Solving', 'Communication', 'Node.js', 'Figma', 'Project Management', 'Python', 'SQL']);
  const [certifications, setCertifications] = useState<string[]>(['AWS Certified Developer', 'Google UX Design Certificate', 'Scrum Master', 'Certified React Professional']);
  const [languages, setLanguages] = useState<string[]>(['English', 'Urdu', 'Spanish', 'French', 'Your Language']);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sectionHeights, setSectionHeights] = useState<number[]>([]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const uploadProfileImage = async (file: File) => {
    if (!user) return null;
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanUserId = (user.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `${cleanUserId}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('profile-images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
    if (error) {
      toast({ title: 'Error', description: error.message || 'Image upload failed', variant: 'destructive' });
      return null;
    }
    const { data: publicUrlData } = supabase.storage.from('profile-images').getPublicUrl(fileName);
    return publicUrlData?.publicUrl || null;
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setShowCropper(true);
    }
  };

  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
    if (croppedBlob) {
      setProfileImageUrl(URL.createObjectURL(croppedBlob));
      const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
      const url = await uploadProfileImage(file);
      if (url) {
        setProfileImageUrl(url);
        setPersonalInfo((prev) => ({ ...prev, profileImageUrl: url }));
      }
    }
    setShowCropper(false);
    setSelectedImage(null);
  };

  useEffect(() => {
    if (editMode && id && user) {
      setLoading(true);
      supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (data) {
            const resumeData = data as any;
            const personal = typeof resumeData.personal_info === 'string' ? JSON.parse(resumeData.personal_info) : {};
            setPersonalInfo(personal);
            if (personal.profileImageUrl) setProfileImageUrl(personal.profileImageUrl);
            setExperiences(typeof resumeData.experience === 'string' ? JSON.parse(resumeData.experience) : [{ id: '1', company: '', position: '', startDate: '', endDate: '', description: '' }]);
            setEducations(typeof resumeData.education === 'string' ? JSON.parse(resumeData.education) : [{ id: '1', institution: '', degree: '', startDate: '', endDate: '' }]);
            setSkills(typeof resumeData.skills === 'string' ? JSON.parse(resumeData.skills) : ['']);
            setCertifications(typeof resumeData.certifications === 'string' ? JSON.parse(resumeData.certifications) : Array.isArray(resumeData.certifications) ? resumeData.certifications : ['']);
            setLanguages(typeof resumeData.languages === 'string' ? JSON.parse(resumeData.languages) : Array.isArray(resumeData.languages) ? resumeData.languages : ['']);
            const lang = String(resumeData.language);
            setLanguage(lang === 'english' || lang === 'urdu' ? lang : 'english');
            const tmpl = String(resumeData.template_id);
            setTemplate(tmpl === 'modern' || tmpl === 'classic' || tmpl === 'minimal' ? tmpl : 'modern');
          } else if (error) {
            toast({ title: 'Error', description: 'Resume not found', variant: 'destructive' });
            navigate('/resumes');
          }
          setLoading(false);
        });
    }
  }, [editMode, id, user]);

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    setExperiences([...experiences, newExp]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setExperiences(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      startDate: '',
      endDate: ''
    };
    setEducations([...educations, newEdu]);
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducations(educations.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const removeEducation = (id: string) => {
    setEducations(educations.filter(edu => edu.id !== id));
  };

  const addSkill = () => {
    setSkills([...skills, '']);
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addCertification = () => setCertifications([...certifications, '']);
  const updateCertification = (index: number, value: string) => {
    const newCerts = [...certifications];
    newCerts[index] = value;
    setCertifications(newCerts);
  };
  const removeCertification = (index: number) => setCertifications(certifications.filter((_, i) => i !== index));
  const addLanguage = () => setLanguages([...languages, '']);
  const updateLanguage = (index: number, value: string) => {
    const newLangs = [...languages];
    newLangs[index] = value;
    setLanguages(newLangs);
  };
  const removeLanguage = (index: number) => setLanguages(languages.filter((_, i) => i !== index));

  const saveResume = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const resumeData = {
        user_id: user.id,
        title: personalInfo.title || `${personalInfo.fullName}'s Resume`,
        language: language,
        template_id: template,
        personal_info: JSON.stringify({ ...personalInfo, profileImageUrl }),
        experience: JSON.stringify(experiences),
        education: JSON.stringify(educations),
        skills: JSON.stringify(skills.filter(skill => skill.trim() !== '')),
        certifications: JSON.stringify(certifications.filter(cert => cert.trim() !== '')),
        languages: JSON.stringify(languages.filter(lang => lang.trim() !== ''))
      };
      let data, error;
      if (editMode && id) {
        ({ data, error } = await supabase
          .from('resumes')
          .update(resumeData)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from('resumes')
          .insert(resumeData)
          .select()
          .single());
      }
      if (error) throw error;
      toast({
        title: editMode ? 'Resume Updated' : 'Resume Saved',
        description: editMode ? 'Your resume has been updated successfully.' : 'Your resume has been saved successfully.',
      });
      navigate('/');
    } catch (error) {
      console.error('Error saving resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to save resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = async () => {
    let selector = '.resume-modern-container';
    if (template === 'classic') selector = '.resume-classic-container';
    if (template === 'minimal') selector = '.resume-minimal-container';
    const pageNodes = document.querySelectorAll(selector);
    if (!pageNodes.length) return;

    let pdf = null;
    for (let i = 0; i < pageNodes.length; i++) {
      const node = pageNodes[i];
      const rect = node.getBoundingClientRect();
      const widthPx = Math.round(rect.width);
      const heightPx = Math.round(rect.height);
      const widthMm = widthPx / 3.779528;
      const heightMm = heightPx / 3.779528;
      const canvas = await html2canvas(node as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: template === 'modern' ? '#1e293b' : '#ffffff',
        width: widthPx,
        height: heightPx,
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      if (i === 0) {
        pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [widthMm, heightMm], compress: false });
      } else {
        pdf.addPage([widthMm, heightMm], 'p');
      }
      pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);
    }
    if (pdf) {
      pdf.save(`resume-${personalInfo.fullName || 'draft'}.pdf`);
      toast({
        title: 'PDF Downloaded',
        description: 'Resume has been downloaded as PDF.',
      });
    }
  };

  const isUrdu = language === 'urdu';
  const PAGE_HEIGHT = 1050;

  useEffect(() => {
    setSectionHeights(sectionRefs.current.map(ref => ref?.offsetHeight || 0));
  }, [personalInfo, experiences, certifications, isUrdu]);

  function countWordsFromNode(node) {
    if (!node) return 0;
    if (typeof node === 'string') {
      return node.trim().split(/\s+/).filter(Boolean).length;
    }
    if (Array.isArray(node)) {
      return node.reduce((sum, child) => sum + countWordsFromNode(child), 0);
    }
    if (typeof node === 'object' && node.props) {
      let words = 0;
      if (node.props.children) words += countWordsFromNode(node.props.children);
      ['label', 'title', 'alt', 'placeholder'].forEach(key => {
        if (typeof node.props[key] === 'string') {
          words += node.props[key].trim().split(/\s+/).filter(Boolean).length;
        }
      });
      return words;
    }
    return 0;
  }

  function paginateSectionsByWords(sections, maxWordsPerPage = 110) {
    let pages = [];
    let currentPage = [];
    let currentWords = 0;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionWords = countWordsFromNode(section);
      if (currentWords + sectionWords > maxWordsPerPage && currentPage.length) {
        pages.push(currentPage);
        currentPage = [];
        currentWords = 0;
      }
      currentPage.push(section);
      currentWords += sectionWords;
    }
    if (currentPage.length) pages.push(currentPage);
    return pages;
  }

  useEffect(() => {
    const wasDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
    return () => {
      if (wasDark) document.documentElement.classList.add('dark');
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container w-full max-w-full px-1 sm:px-4 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline ml-2">Back to Dashboard</span>
            </Button>
            <h1 className="text-xl md:text-xl font-bold tracking-tight drop-shadow mb-1">{personalInfo.fullName || (isUrdu ? 'آپ کا نام' : 'Your Name')}</h1>
            {personalInfo.title && (
              <h2 className="hidden md:block text-sm font-semibold text-black mt-1 tracking-wide uppercase mb-2">{personalInfo.title}</h2>
            )}
          </div>
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              onClick={() => setLanguage(language === 'english' ? 'urdu' : 'english')}
            >
              <Globe className="w-4 h-4 mr-2" />
              {language === 'english' ? 'اردو' : 'English'}
            </Button>
            <Button onClick={saveResume} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={downloadPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'english' ? 'urdu' : 'english')}
              className="px-2 py-1 text-xs"
            >
              <Globe className="w-3 h-3 mr-1" />
              {language === 'english' ? 'اردو' : 'English'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {isUrdu ? 'ٹیمپلیٹ' : 'Template'}
                  <Select value={template} onValueChange={(value: 'modern' | 'classic' | 'minimal') => {
                    setTemplate(value);
                    setVisiblePages(1);
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isUrdu ? 'ذاتی معلومات' : 'Personal Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">{isUrdu ? 'پورا نام' : 'Full Name'} *</Label>
                  <Input
                    id="fullName"
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo({...personalInfo, fullName: e.target.value})}
                    placeholder={isUrdu ? 'اپنا پورا نام درج کریں' : 'Enter your full name'}
                    style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
                  />
                </div>
                <div>
                  <Label htmlFor="title">{isUrdu ? 'عہدہ' : 'Job Title'}</Label>
                  <Input
                    id="title"
                    value={personalInfo.title}
                    onChange={(e) => setPersonalInfo({...personalInfo, title: e.target.value})}
                    placeholder={isUrdu ? 'جیسے ڈیولپر، ڈیزائنر' : 'e.g. Software Developer, Designer'}
                    style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">{isUrdu ? 'ای میل' : 'Email'}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{isUrdu ? 'فون نمبر' : 'Phone'}</Label>
                    <Input
                      id="phone"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                      placeholder="+92 300 1234567"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">{isUrdu ? 'پتہ' : 'Address'}</Label>
                  <Input
                    id="address"
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo({...personalInfo, address: e.target.value})}
                    placeholder={isUrdu ? 'اپنا پتہ درج کریں' : 'Enter your address'}
                    style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
                  />
                </div>
                <div>
                  <Label htmlFor="summary">{isUrdu ? 'خلاصہ' : 'Professional Summary'}</Label>
                  <Textarea
                    id="summary"
                    value={personalInfo.summary}
                    onChange={(e) => setPersonalInfo({...personalInfo, summary: e.target.value})}
                    placeholder={isUrdu ? 'اپنے بارے میں مختصر تعارف' : 'Brief description about yourself'}
                    rows={3}
                    style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {isUrdu ? 'تجربہ' : 'Work Experience'}
                  <Button onClick={addExperience} size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    {isUrdu ? 'شامل کریں' : 'Add'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {experiences.map((exp, index) => (
                  <div key={exp.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{isUrdu ? `تجربہ ${index + 1}` : `Experience ${index + 1}`}</h4>
                      {experiences.length > 1 && (
                        <Button variant="outline" size="sm" onClick={() => removeExperience(exp.id)}>
                          {isUrdu ? 'ہٹائیں' : 'Remove'}
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{isUrdu ? 'کمپنی' : 'Company'}</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          placeholder={isUrdu ? 'کمپنی کا نام' : 'Company name'}
                          style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
                        />
                      </div>
                      <div>
                        <Label>{isUrdu ? 'عہدہ' : 'Position'}</Label>
                        <Input
                          value={exp.position}
                          onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                          placeholder={isUrdu ? 'آپ کا عہدہ' : 'Your position'}
                          style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{isUrdu ? 'شروعات' : 'Start Date'}</Label>
                        <Input
                          type="date"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>{isUrdu ? 'اختتام' : 'End Date'}</Label>
                        <Input
                          type="date"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{isUrdu ? 'تفصیل' : 'Description'}</Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                        placeholder={isUrdu ? 'اس کام کی تفصیل' : 'Describe your responsibilities'}
                        rows={2}
                        style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {isUrdu ? 'تعلیم' : 'Education'}
                  <Button onClick={addEducation} size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    {isUrdu ? 'شامل کریں' : 'Add'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {educations.map((edu, index) => (
                  <div key={edu.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{isUrdu ? `تعلیم ${index + 1}` : `Education ${index + 1}`}</h4>
                      {educations.length > 1 && (
                        <Button variant="outline" size="sm" onClick={() => removeEducation(edu.id)}>
                          {isUrdu ? 'ہٹائیں' : 'Remove'}
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{isUrdu ? 'ادارہ' : 'Institution'}</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                          placeholder={isUrdu ? 'یونیورسٹی/کالج' : 'University/College'}
                          style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
                        />
                      </div>
                      <div>
                        <Label>{isUrdu ? 'ڈگری' : 'Degree'}</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                          placeholder={isUrdu ? 'بیچلرز/ماسٹرز' : 'Bachelor/Master'}
                          style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{isUrdu ? 'شروعات' : 'Start Date'}</Label>
                        <Input
                          type="date"
                          value={edu.startDate}
                          onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>{isUrdu ? 'اختتام' : 'End Date'}</Label>
                        <Input
                          type="date"
                          value={edu.endDate}
                          onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {isUrdu ? 'مہارات' : 'Skills'}
                  <Button onClick={addSkill} size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    {isUrdu ? 'شامل کریں' : 'Add'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {skills.map((skill, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={skill}
                      onChange={(e) => updateSkill(index, e.target.value)}
                      placeholder={isUrdu ? 'مہارت کا نام' : 'Skill name'}
                      style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
                    />
                    {skills.length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => removeSkill(index)}>
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {isUrdu ? 'سرٹیفیکیشنز' : 'Certifications'}
                  <Button onClick={addCertification} size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    {isUrdu ? 'شامل کریں' : 'Add'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={cert}
                      onChange={(e) => updateCertification(index, e.target.value)}
                      placeholder={isUrdu ? 'سرٹیفیکیشن کا نام' : 'Certification name'}
                      style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
                    />
                    {certifications.length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => removeCertification(index)}>
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {isUrdu ? 'زبانیں' : 'Languages'}
                  <Button onClick={addLanguage} size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    {isUrdu ? 'شامل کریں' : 'Add'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {languages.map((lang, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={lang}
                      onChange={(e) => updateLanguage(index, e.target.value)}
                      placeholder={isUrdu ? 'زبان' : 'Language'}
                      style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
                    />
                    {languages.length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => removeLanguage(index)}>
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            {template === 'modern' && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <input type="file" accept="image/*" onChange={handleProfileImageChange} />
                  {profileImageUrl && (
                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar style={{ width: isMobile ? '60px' : '115px', height: isMobile ? '60px' : '115px', border: '4px solid #3b82f6', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', background: '#fff', flexShrink: 0, marginTop: 0, marginLeft: 0, marginRight: 0 }}>
                        <AvatarImage src={profileImageUrl || undefined} alt="Profile" />
                        <AvatarFallback>
                          <User className="w-10 h-10 text-blue-500" />
                        </AvatarFallback>
                      </Avatar>
                      <Button onClick={() => {
                        setSelectedImage(profileImageUrl);
                        setShowCropper(true);
                      }} type="button" className="bg-blue-600 text-white hover:bg-blue-700">Edit/Crop</Button>
                    </div>
                  )}
                  <Modal open={showCropper} onClose={() => setShowCropper(false)}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 16px rgba(0, 0, 0, 0.3)', width: isMobile ? '300px' : '350px' }}>
                      <div style={{ position: 'relative', width: isMobile ? '250px' : '300px', height: isMobile ? '250px' : '300px', background: '#333' }}>
                        <Cropper
                          image={selectedImage || ''}
                          crop={crop}
                          zoom={zoom}
                          aspect={1}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropComplete}
                          cropShape="round"
                          showGrid={false}
                        />
                      </div>
                      <div style={{ marginTop: 16 }}>
                        <Slider
                          value={zoom}
                          min={1}
                          max={3}
                          step={0.1}
                          onChange={(_, value) => setZoom(Number(value))}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                        <Button variant="outline" onClick={() => setShowCropper(false)}>Cancel</Button>
                        <Button onClick={handleCropSave} className="bg-blue-600 text-white hover:bg-blue-700">Save</Button>
                      </div>
                    </div>
                  </Modal>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>{isUrdu ? 'پیش منظر' : 'Preview'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100px' }}>
                  <div
                    ref={resumeRef}
                    className="resume-preview text-black overflow-auto"
                    style={{
                      direction: isUrdu ? 'rtl' : 'ltr',
                      fontSize: isMobile ? '10px' : '11px',
                      lineHeight: '1.3',
                      pageBreakAfter: 'avoid',
                      pageBreakInside: 'avoid',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      width: isMobile ? '320px' : '520px',
                      minHeight: isMobile ? '400px' : '540px',
                      maxWidth: '100%',
                      margin: '0 auto',
                      boxShadow: isMobile ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.2)',
                      borderRadius: isMobile ? '0' : '12px',
                      border: isMobile ? 'none' : '1px solid #3b82f6',
                      background: isMobile ? 'transparent' : template === 'modern' ? 'linear-gradient(to bottom, #1e293b, #334155)' : '#fff',
                      overflow: 'hidden',
                    }}
                  >
                    {template === 'modern' && (() => {
                      let sectionIdx = 0;
                      const sections = [];
                      sections.push(
                        <div key="header-summary" ref={el => sectionRefs.current[sectionIdx++] = el}>
                          <div className="mb-6 flex items-start gap-4 flex-col md:flex-row">
                            {profileImageUrl && (
                              <Avatar style={{ width: isMobile ? '80px' : '120px', height: isMobile ? '80px' : '120px', border: '4px solid #3b82f6', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', background: '#fff', borderRadius: '50%', flexShrink: 0 }}>
                                <AvatarImage src={profileImageUrl || undefined} alt="Profile" />
                                <AvatarFallback>
                                  <User className="w-10 h-10 text-blue-500" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="text-center md:text-left">
                              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>{personalInfo.fullName || (isUrdu ? 'آپ کا نام' : 'Your Name')}</h1>
                              {personalInfo.title && <p className="text-base font-semibold mt-1" style={{ color: '#93c5fd', fontFamily: "'Inter', sans-serif" }}>{personalInfo.title}</p>}
                              <div className="text-sm mt-3 space-y-1" style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif" }}>
                                {personalInfo.email && (
                                  <div className="flex items-center gap-2 justify-center md:justify-start">
                                    <Mail className="w-4 h-4 text-blue-500" />
                                    <span>{personalInfo.email}</span>
                                  </div>
                                )}
                                {personalInfo.phone && (
                                  <div className="flex items-center gap-2 justify-center md:justify-start">
                                    <Phone className="w-4 h-4 text-blue-500" />
                                    <span>{personalInfo.phone}</span>
                                  </div>
                                )}
                                {personalInfo.address && (
                                  <div className="flex items-center gap-2 justify-center md:justify-start">
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                    <span>{personalInfo.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {personalInfo.summary && (
                            <div className="mb-6 bg-white/5 p-4 rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                              <h2 className="text-lg font-extrabold uppercase tracking-wider pb-1 mb-3" style={{ color: '#e2e8f0', borderBottom: '2px solid', borderImage: 'linear-gradient(to right, #3b82f6, #93c5fd) 1', fontFamily: "'Inter', sans-serif" }}>{isUrdu ? 'خلاصہ' : 'Summary'}</h2>
                              <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif" }}>{personalInfo.summary}</p>
                            </div>
                          )}
                        </div>
                      );
                      if (experiences.some(e => e.company)) {
                        sections.push(
                          <div key="experience" ref={el => sectionRefs.current[sectionIdx++] = el} className="mb-6 bg-white/5 p-4 rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                            <h2 className="text-lg font-extrabold uppercase tracking-wider pb-1 mb-3" style={{ color: '#e2e8f0', borderBottom: '2px solid', borderImage: 'linear-gradient(to right, #3b82f6, #93c5fd) 1', fontFamily: "'Inter', sans-serif" }}>{isUrdu ? 'تجربہ' : 'Work Experience'}</h2>
                            {experiences.filter(e => e.company).map(exp => (
                              <div key={exp.id} className="mb-4">
                                <div className="flex flex-col md:flex-row justify-between items-baseline">
                                  <h3 className="text-md font-semibold" style={{ color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>{exp.position}</h3>
                                  <span className="text-xs font-mono" style={{ color: '#93c5fd' }}>{exp.startDate} - {exp.endDate || (isUrdu ? 'موجودہ' : 'Present')}</span>
                                </div>
                                <p className="text-sm font-medium" style={{ color: '#e2e8f0', fontFamily: "'Inter', sans-serif" }}>{exp.company}</p>
                                <p className="text-sm mt-1 leading-relaxed" style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif" }}>{exp.description}</p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      if (educations.some(e => e.institution)) {
                        sections.push(
                          <div key="education" ref={el => sectionRefs.current[sectionIdx++] = el} className="mb-6 bg-white/5 p-4 rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                            <h2 className="text-lg font-extrabold uppercase tracking-wider pb-1 mb-3" style={{ color: '#e2e8f0', borderBottom: '2px solid', borderImage: 'linear-gradient(to right, #3b82f6, #93c5fd) 1', fontFamily: "'Inter', sans-serif" }}>{isUrdu ? 'تعلیم' : 'Education'}</h2>
                            {educations.filter(e => e.institution).map(edu => (
                              <div key={edu.id} className="mb-3">
                                <div className="flex flex-col md:flex-row justify-between items-baseline">
                                  <h3 className="text-md font-semibold" style={{ color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>{edu.degree}</h3>
                                  <span className="text-xs font-mono" style={{ color: '#93c5fd' }}>{edu.startDate} - {edu.endDate}</span>
                                </div>
                                <p className="text-sm" style={{ color: '#e2e8f0', fontFamily: "'Inter', sans-serif" }}>{edu.institution}</p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      if (skills.some(s => s.trim())) {
                        sections.push(
                          <div key="skills" ref={el => sectionRefs.current[sectionIdx++] = el} className="mb-6 bg-white/5 p-4 rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                            <h2 className="text-lg font-extrabold uppercase tracking-wider pb-1 mb-3" style={{ color: '#e2e8f0', borderBottom: '2px solid', borderImage: 'linear-gradient(to right, #3b82f6, #93c5fd) 1', fontFamily: "'Inter', sans-serif" }}>{isUrdu ? 'مہارات' : 'Skills'}</h2>
                            <ul className="list-disc list-inside text-sm space-y-1" style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif" }}>
                              {skills.filter(s => s.trim()).map((skill, i) => <li key={i}>{skill}</li>)}
                            </ul>
                          </div>
                        );
                      }
                      if (certifications.some(c => c.trim())) {
                        sections.push(
                          <div key="certifications" ref={el => sectionRefs.current[sectionIdx++] = el} className="mb-6 bg-white/5 p-4 rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                            <h2 className="text-lg font-extrabold uppercase tracking-wider pb-1 mb-3" style={{ color: '#e2e8f0', borderBottom: '2px solid', borderImage: 'linear-gradient(to right, #3b82f6, #93c5fd) 1', fontFamily: "'Inter', sans-serif" }}>{isUrdu ? 'سرٹیفیکیشنز' : 'Certifications'}</h2>
                            <ul className="list-disc list-inside text-sm space-y-1" style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif" }}>
                              {certifications.filter(c => c.trim()).map((cert, i) => <li key={i}>{cert}</li>)}
                            </ul>
                          </div>
                        );
                      }
                      if (languages.some(l => l.trim())) {
                        sections.push(
                          <div key="languages" ref={el => sectionRefs.current[sectionIdx++] = el} className="mb-6 bg-white/5 p-4 rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                            <h2 className="text-lg font-extrabold uppercase tracking-wider pb-1 mb-3" style={{ color: '#e2e8f0', borderBottom: '2px solid', borderImage: 'linear-gradient(to right, #3b82f6, #93c5fd) 1', fontFamily: "'Inter', sans-serif" }}>{isUrdu ? 'زبانیں' : 'Languages'}</h2>
                            <ul className="list-disc list-inside text-sm space-y-1" style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif" }}>
                              {languages.filter(l => l.trim()).map((lang, i) => <li key={i}>{lang}</li>)}
                            </ul>
                          </div>
                        );
                      }
                      const pages = paginateSectionsByWords(sections, 110);
                      const totalPages = pages.length;
                      const pagesToShow = pages.slice(0, visiblePages);
                      return (
                        <>
                          {pagesToShow.map((pageSections, pageIdx) => (
                            <div
                              key={pageIdx}
                              className="resume-modern-container"
                              style={{
                                padding: isMobile ? '20px' : '48px',
                                border: isMobile ? 'none' : '1px solid #3b82f6',
                                marginBottom: 0,
                                background: 'linear-gradient(to bottom, #1e293b, #334155)',
                                pageBreakAfter: 'always',
                                fontFamily: "'Inter', sans-serif",
                                boxShadow: isMobile ? 'none' : '0 6px 24px rgba(0, 0, 0, 0.25)',
                                borderRadius: isMobile ? '0' : '10px',
                                maxWidth: isMobile ? '320px' : '800px',
                                width: '100%',
                                margin: '0 auto',
                                color: '#cbd5e1',
                              }}
                            >
                              {pageSections}
                            </div>
                          ))}
                          {totalPages > visiblePages && (
                            <div className="text-center py-4">
                              <Button onClick={() => setVisiblePages(p => p + 1)} className="bg-blue-600 text-white hover:bg-blue-700">
                                {isUrdu ? 'نیا صفحہ شامل کریں' : 'Add New Page'}
                              </Button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {template === 'classic' && (() => {
                      let sectionIdx = 0;
                      const sections = [];
                      sections.push(
                        <div key="header-summary" ref={el => sectionRefs.current[sectionIdx++] = el}>
                          <div className="mb-6">
                            <div className="text-center">
                              <h1 className="text-4xl font-bold text-orange-600 tracking-tight">{personalInfo.fullName}</h1>
                              {personalInfo.title && <p className="text-xl text-orange-600 mt-1 font-medium">{personalInfo.title}</p>}
                            </div>
                            <div className="text-center text-sm text-gray-500 mt-4 flex justify-center items-center flex-wrap gap-x-4 gap-y-1">
                              {personalInfo.email && <span>{personalInfo.email}</span>}
                              {personalInfo.phone && <span>{personalInfo.phone}</span>}
                              {personalInfo.address && <span>{personalInfo.address}</span>}
                            </div>
                          </div>
                          {personalInfo.summary && (
                            <div className="mb-5">
                              <h2 className="text-lg font-bold uppercase tracking-wider text-orange-600 border-b-2 border-orange-300 pb-1 mb-2">{isUrdu ? 'خلاصہ' : 'Summary'}</h2>
                              <p className="text-sm text-gray-700 leading-relaxed">{personalInfo.summary}</p>
                            </div>
                          )}
                        </div>
                      );
                      if (experiences.some(e => e.company)) {
                        sections.push(
                          <div key="experience" ref={el => sectionRefs.current[sectionIdx++] = el} className="mb-5">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-orange-600 border-b-2 border-orange-300 pb-1 mb-2">{isUrdu ? 'تجربہ' : 'Work Experience'}</h2>
                            {experiences.filter(e => e.company).map(exp => (
                              <div key={exp.id} className="mb-3">
                                <div className="flex justify-between items-baseline">
                                  <h3 className="text-md font-semibold text-gray-800">{exp.position}</h3>
                                  <span className="text-xs text-gray-500 font-mono">{exp.startDate} - {exp.endDate || (isUrdu ? 'موجودہ' : 'Present')}</span>
                                </div>
                                <p className="text-sm text-gray-600 font-medium">{exp.company}</p>
                                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{exp.description}</p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      if (educations.some(e => e.institution)) {
                        sections.push(
                          <div key="education" ref={el => sectionRefs.current[sectionIdx++] = el} className="mb-5">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-orange-600 border-b-2 border-orange-300 pb-1 mb-2">{isUrdu ? 'تعلیم' : 'Education'}</h2>
                            {educations.filter(e => e.institution).map(edu => (
                              <div key={edu.id} className="mb-2">
                                <div className="flex justify-between items-baseline">
                                  <h3 className="text-md font-semibold text-gray-800">{edu.degree}</h3>
                                  <span className="text-xs text-gray-500 font-mono">{edu.startDate} - {edu.endDate}</span>
                                </div>
                                <p className="text-sm text-gray-600">{edu.institution}</p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      const skillBasedSections = [];
                      if (skills.some(s => s.trim())) {
                        skillBasedSections.push(
                          <div key="skills" className="flex-1 min-w-[48%]">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-orange-600 border-b-2 border-orange-300 pb-1 mb-2">{isUrdu ? 'مہارات' : 'Skills'}</h2>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {skills.filter(s => s.trim()).map((skill, i) => <li key={i}>{skill}</li>)}
                            </ul>
                          </div>
                        );
                      }
                      if (certifications.some(c => c.trim())) {
                        skillBasedSections.push(
                          <div key="certifications" className="flex-1 min-w-[48%]">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-orange-600 border-b-2 border-orange-300 pb-1 mb-2">{isUrdu ? 'سرٹیفیکیشنز' : 'Certifications'}</h2>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {certifications.filter(c => c.trim()).map((cert, i) => <li key={i}>{cert}</li>)}
                            </ul>
                          </div>
                        );
                      }
                      if (languages.some(l => l.trim())) {
                        skillBasedSections.push(
                          <div key="languages" className="flex-1 min-w-[48%]">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-orange-600 border-b-2 border-orange-300 pb-1 mb-2">{isUrdu ? 'زبانیں' : 'Languages'}</h2>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {languages.filter(l => l.trim()).map((lang, i) => <li key={i}>{lang}</li>)}
                            </ul>
                          </div>
                        );
                      }
                      if (skillBasedSections.length > 0) {
                        sections.push(
                          <div key="skill-based" ref={el => sectionRefs.current[sectionIdx++] = el} className="flex flex-wrap gap-x-8 gap-y-5">
                            {skillBasedSections}
                          </div>
                        );
                      }
                      const classicPages = paginateSectionsByWords(sections, 110);
                      const totalPages = classicPages.length;
                      const pagesToShow = classicPages.slice(0, visiblePages);
                      return (
                        <>
                          {pagesToShow.map((pageSections, pageIdx) => (
                            <div key={pageIdx} className="resume-classic-container" style={{ padding: '40px', border: isMobile ? 'none' : '1px solid #e5e7eb', marginBottom: 0, background: 'white', pageBreakAfter: 'always', fontFamily: 'system-ui, sans-serif' }}>
                              {pageSections}
                            </div>
                          ))}
                          {totalPages > visiblePages && (
                            <div className="text-center py-4">
                              <Button onClick={() => setVisiblePages(p => p + 1)}>
                                {isUrdu ? 'نیا صفحہ شامل کریں' : 'Add New Page'}
                              </Button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {template === 'minimal' && (() => {
                      let sectionIdx = 0;
                      const sections = [];
                      sections.push(
                        <div key="header-summary" ref={el => sectionRefs.current[sectionIdx++] = el}>
                          <div className="mb-6">
                            <div className="text-center">
                              <h1 className="text-4xl font-bold text-black tracking-tight">{personalInfo.fullName}</h1>
                              {personalInfo.title && <p className="text-xl text-black mt-1 font-medium">{personalInfo.title}</p>}
                            </div>
                            <div className="text-center text-sm text-gray-500 mt-4 flex justify-center items-center flex-wrap gap-x-4 gap-y-1">
                              {personalInfo.email && <span>{personalInfo.email}</span>}
                              {personalInfo.phone && <span>{personalInfo.phone}</span>}
                              {personalInfo.address && <span>{personalInfo.address}</span>}
                            </div>
                          </div>
                          {personalInfo.summary && (
                            <div className="mb-5">
                              <h2 className="text-lg font-bold uppercase tracking-wider text-black border-b-2 border-gray-300 pb-1 mb-2">{isUrdu ? 'خلاصہ' : 'Summary'}</h2>
                              <p className="text-sm text-gray-700 leading-relaxed">{personalInfo.summary}</p>
                            </div>
                          )}
                        </div>
                      );
                      if (experiences.some(e => e.company)) {
                        sections.push(
                          <div key="experience" ref={el => sectionRefs.current[sectionIdx++] = el} className="mb-5">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-black border-b-2 border-gray-300 pb-1 mb-2">{isUrdu ? 'تجربہ' : 'Work Experience'}</h2>
                            {experiences.filter(e => e.company).map(exp => (
                              <div key={exp.id} className="mb-3">
                                <div className="flex justify-between items-baseline">
                                  <h3 className="text-md font-semibold text-gray-800">{exp.position}</h3>
                                  <span className="text-xs text-gray-500 font-mono">{exp.startDate} - {exp.endDate || (isUrdu ? 'موجودہ' : 'Present')}</span>
                                </div>
                                <p className="text-sm text-gray-600 font-medium">{exp.company}</p>
                                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{exp.description}</p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      if (educations.some(e => e.institution)) {
                        sections.push(
                          <div key="education" ref={el => sectionRefs.current[sectionIdx++] = el} className="mb-5">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-black border-b-2 border-gray-300 pb-1 mb-2">{isUrdu ? 'تعلیم' : 'Education'}</h2>
                            {educations.filter(e => e.institution).map(edu => (
                              <div key={edu.id} className="mb-2">
                                <div className="flex justify-between items-baseline">
                                  <h3 className="text-md font-semibold text-gray-800">{edu.degree}</h3>
                                  <span className="text-xs text-gray-500 font-mono">{edu.startDate} - {edu.endDate}</span>
                                </div>
                                <p className="text-sm text-gray-600">{edu.institution}</p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      const skillBasedSections = [];
                      if (skills.some(s => s.trim())) {
                        skillBasedSections.push(
                          <div key="skills" className="flex-1 min-w-[48%]">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-black border-b-2 border-gray-300 pb-1 mb-2">{isUrdu ? 'مہارات' : 'Skills'}</h2>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {skills.filter(s => s.trim()).map((skill, i) => <li key={i}>{skill}</li>)}
                            </ul>
                          </div>
                        );
                      }
                      if (certifications.some(c => c.trim())) {
                        skillBasedSections.push(
                          <div key="certifications" className="flex-1 min-w-[48%]">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-black border-b-2 border-gray-300 pb-1 mb-2">{isUrdu ? 'سرٹیفیکیشنز' : 'Certifications'}</h2>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {certifications.filter(c => c.trim()).map((cert, i) => <li key={i}>{cert}</li>)}
                            </ul>
                          </div>
                        );
                      }
                      if (languages.some(l => l.trim())) {
                        skillBasedSections.push(
                          <div key="languages" className="flex-1 min-w-[48%]">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-black border-b-2 border-gray-300 pb-1 mb-2">{isUrdu ? 'زبانیں' : 'Languages'}</h2>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {languages.filter(l => l.trim()).map((lang, i) => <li key={i}>{lang}</li>)}
                            </ul>
                          </div>
                        );
                      }
                      if (skillBasedSections.length > 0) {
                        sections.push(
                          <div key="skill-based" ref={el => sectionRefs.current[sectionIdx++] = el} className="flex flex-wrap gap-x-8 gap-y-5">
                            {skillBasedSections}
                          </div>
                        );
                      }
                      const minimalPages = paginateSectionsByWords(sections, 110);
                      const totalPages = minimalPages.length;
                      const pagesToShow = minimalPages.slice(0, visiblePages);
                      return (
                        <>
                          {pagesToShow.map((pageSections, pageIdx) => (
                            <div key={pageIdx} className="resume-minimal-container" style={{ padding: '40px', border: isMobile ? 'none' : '1px solid #e5e7eb', marginBottom: 0, background: 'white', pageBreakAfter: 'always', fontFamily: 'system-ui, sans-serif' }}>
                              {pageSections}
                            </div>
                          ))}
                          {totalPages > visiblePages && (
                            <div className="text-center py-4">
                              <Button onClick={() => setVisiblePages(p => p + 1)}>
                                {isUrdu ? 'نیا صفحہ شامل کریں' : 'Add New Page'}
                              </Button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-8 mb-2 md:hidden">
          <Button onClick={saveResume} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 text-xs w-auto">
            <Save className="w-3 h-3 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={downloadPDF} variant="outline" className="px-2 py-1 text-xs w-auto">
            <Download className="w-3 h-3 mr-1" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;