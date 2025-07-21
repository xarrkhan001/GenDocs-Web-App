import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Download, Save, Globe } from 'lucide-react';
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
import { getCroppedImg } from '@/lib/utils'; // We'll add this helper for cropping

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

  const [visiblePages, setVisiblePages] = useState(1);
  const [language, setLanguage] = useState<'english' | 'urdu'>('english');
  const [template, setTemplate] = useState<'modern' | 'classic' | 'minimal'>('modern');
  
  // Load last selected template from localStorage on mount
  React.useEffect(() => {
    const savedTemplate = localStorage.getItem("lastResumeTemplate");
    if (savedTemplate === "modern" || savedTemplate === "classic" || savedTemplate === "minimal") {
      setTemplate(savedTemplate);
    }
  }, []);

  // Save template to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem("lastResumeTemplate", template);
  }, [template]);

  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    title: '',
    summary: '',
    profileImageUrl: ''
  });

  const [experiences, setExperiences] = useState<Experience[]>([
    { id: '1', company: '', position: '', startDate: '', endDate: '', description: '' }
  ]);

  const [educations, setEducations] = useState<Education[]>([
    { id: '1', institution: '', degree: '', startDate: '', endDate: '' }
  ]);

  const [skills, setSkills] = useState<string[]>(['']);
  const [certifications, setCertifications] = useState<string[]>(['']);
  const [languages, setLanguages] = useState<string[]>(['']);

  // Add state for profile image
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  // Add state for cropping
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Add state/refs for classic and minimal pagination
  const [classicSectionHeights, setClassicSectionHeights] = useState<number[]>([]);
  const classicSectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [minimalSectionHeights, setMinimalSectionHeights] = useState<number[]>([]);
  const minimalSectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Helper to upload image to Supabase Storage
  const uploadProfileImage = async (file: File) => {
    if (!user) return null;
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanUserId = (user.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `${cleanUserId}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('profile-images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false // try without upsert first
    });
    if (error) {
      toast({ title: 'Error', description: error.message || 'Image upload failed', variant: 'destructive' });
      return null;
    }
    const { data: publicUrlData } = supabase.storage.from('profile-images').getPublicUrl(fileName);
    return publicUrlData?.publicUrl || null;
  };

  // Helper to get cropped image as blob
  // (We'll add getCroppedImg to src/lib/utils.ts)

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
      // Show preview
      setProfileImageUrl(URL.createObjectURL(croppedBlob));
      // Upload to Supabase
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

  React.useEffect(() => {
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
    // 5. Update downloadPDF to handle all templates
    let selector = '.resume-modern-container';
    if (template === 'classic') selector = '.resume-classic-container';
    if (template === 'minimal') selector = '.resume-minimal-container';
    const pageNodes = document.querySelectorAll(selector);
    if (!pageNodes.length) return;

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: false });

    for (let i = 0; i < pageNodes.length; i++) {
      const node = pageNodes[i];
      // Use a higher scale for HD quality
      const canvas = await html2canvas(node as HTMLElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'NONE');
    }

    pdf.save(`resume-${personalInfo.fullName || 'draft'}.pdf`);
    toast({
      title: 'PDF Downloaded',
      description: 'Resume has been downloaded as PDF.',
    });
  };

  const isUrdu = language === 'urdu';

  // This is an approximate height in pixels for a standard A4 page.
  // It's used for the live preview inside the app to decide where page breaks should occur.
  // The final downloaded PDF will be a true A4 size, regardless of this value.
  const PAGE_HEIGHT = 1050; // px, A4 size for better page break
  const [sectionHeights, setSectionHeights] = useState<number[]>([]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setSectionHeights(sectionRefs.current.map(ref => ref?.offsetHeight || 0));
  }, [personalInfo, experiences, certifications, isUrdu]);

  // 2. useEffect for classic/minimal heights
  useEffect(() => {
    setClassicSectionHeights(classicSectionRefs.current.map(ref => ref?.offsetHeight || 0));
  }, [personalInfo, experiences, certifications, educations, skills, languages, isUrdu, template === 'classic']);
  useEffect(() => {
    setMinimalSectionHeights(minimalSectionRefs.current.map(ref => ref?.offsetHeight || 0));
  }, [personalInfo, experiences, certifications, educations, skills, languages, isUrdu, template === 'minimal']);

  function paginateSections(sections: React.ReactNode[], heights: number[]) {
    let pages: React.ReactNode[][] = [];
    let currentPage: React.ReactNode[] = [];
    let currentHeight = 0;
    for (let i = 0; i < sections.length; i++) {
      if (currentHeight + heights[i] > PAGE_HEIGHT && currentPage.length) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }
      currentPage.push(sections[i]);
      currentHeight += heights[i];
    }
    if (currentPage.length) pages.push(currentPage);
    return pages;
  }

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
        {/* Header */}
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
          {/* Input Form */}
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
                  <Button onClick={addExperience} size="sm">
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
                  <Button onClick={addEducation} size="sm">
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
                  <Button onClick={addSkill} size="sm">
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
                  <Button onClick={addCertification} size="sm">
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
                  <Button onClick={addLanguage} size="sm">
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
                      <img
                        src={profileImageUrl}
                        alt="Profile Preview"
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '3px solid #fbbf24',
                          boxShadow: '0 2px 8px #0003',
                        }}
                      />
                      <Button onClick={() => {
                        setSelectedImage(profileImageUrl);
                        setShowCropper(true);
                      }} type="button">Edit/Crop</Button>
                    </div>
                  )}
                  {/* Cropper Modal */}
                  <Modal open={showCropper} onClose={() => setShowCropper(false)}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 16px #0003', width: 350 }}>
                      <div style={{ position: 'relative', width: 300, height: 300, background: '#333' }}>
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
                        <Button onClick={handleCropSave}>Save</Button>
                      </div>
                    </div>
                  </Modal>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resume Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{isUrdu ? 'پیش منظر' : 'Preview'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={isMobile ? { height: `${PAGE_HEIGHT * 0.45 + 40}px`, overflow: 'hidden' } : {}}>
                  <div
                    ref={resumeRef}
                    className="resume-preview text-black overflow-auto max-h-[297mm] sm:max-h-[297mm]"
                    style={{
                      direction: isUrdu ? 'rtl' : 'ltr',
                      fontSize: '11px',
                      lineHeight: '1.3',
                      pageBreakAfter: 'avoid',
                      pageBreakInside: 'avoid',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      ...(isMobile && {
                        transform: 'scale(0.45)',
                        transformOrigin: 'top left',
                        width: 'calc(100% / 0.45)',
                        height: 'calc(100% / 0.45)',
                        maxHeight: 'none',
                      }),
                    }}
                  >
                    {template === 'modern' && (() => {
                      // Build mainSections array with refs for measurement
                      let sectionIdx = 0;
                      const mainSections = [];
                      if (personalInfo.summary) mainSections.push(
                        <div key="profile-summary" ref={el => sectionRefs.current[sectionIdx++] = el}>
                          <section>
                            <h3 className="text-sm font-bold uppercase mb-1" style={{ color: '#2563eb', letterSpacing: '0.08em', textShadow: '0 1px 4px rgba(17, 24, 39, 0.08)', fontWeight: 800, fontSize: '15px' }}>{isUrdu ? 'پیشہ ورانہ خلاصہ' : 'Profile'}</h3>
                            <p className="text-xs" style={{ color: '#334155' }}>{personalInfo.summary}</p>
                          </section>
                        </div>
                      );
                      if (experiences.some(exp => exp.company)) mainSections.push(
                        <div key="work-experience" ref={el => sectionRefs.current[sectionIdx++] = el}>
                          <section>
                            <h3 className="text-sm font-bold uppercase mb-1" style={{ color: '#2563eb', letterSpacing: '0.08em', textShadow: '0 1px 4px rgba(17, 24, 39, 0.08)', fontWeight: 800, fontSize: '15px' }}>{isUrdu ? 'تجربہ' : 'Work Experience'}</h3>
                            <div className="space-y-2">
                              {experiences.filter(exp => exp.company).map((exp, idx) => (
                                <div key={exp.id} className="mb-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-xs">{exp.position}</span>
                                    <span className="text-xs text-gray-400">{exp.startDate} - {exp.endDate || (isUrdu ? 'موجودہ' : 'Present')}</span>
                                  </div>
                                  <div className="text-xs text-gray-600 font-medium">{exp.company}</div>
                                  {exp.description && <p className="text-xs mt-0.5">{exp.description}</p>}
                                </div>
                              ))}
                            </div>
                          </section>
                        </div>
                      );
                      if (certifications.some(cert => cert.trim())) mainSections.push(
                        <div key="certifications" ref={el => sectionRefs.current[sectionIdx++] = el}>
                          <section>
                            <h3 className="text-sm font-bold uppercase mb-1" style={{ color: '#2563eb', letterSpacing: '0.08em', textShadow: '0 1px 4px rgba(17, 24, 39, 0.08)', fontWeight: 800, fontSize: '15px' }}>{isUrdu ? 'سرٹیفیکیشنز' : 'Certifications'}</h3>
                            <ul className="space-y-1 text-xs">
                              {certifications.filter(cert => cert.trim()).map((cert, idx) => (
                                <li key={idx}>{cert}</li>
                              ))}
                            </ul>
                          </section>
                        </div>
                      );
                      const pages = paginateSections(mainSections, sectionHeights);
                      if (pages.length === 0) {
                        pages.push([]);
                      }
                      const totalPages = pages.length;
                      const pagesToShow = pages.slice(0, visiblePages);

                      return (
                        <>
                          {pagesToShow.map((pageSections, pageIdx) => (
                        <div
                          key={pageIdx}
                          className="resume-modern-container"
                          style={{
                            fontSize: isMobile ? '10px' : '13px',
                            lineHeight: '1.25',
                            maxWidth: '800px',
                            width: '100%',
                            margin: `0 auto`,
                            marginBottom: 0,
                            color: '#1e293b',
                            padding: '0',
                            paddingBottom: 0,
                            position: 'relative',
                            overflow: 'visible',
                            border: '1px solid #e5e7eb',
                            pageBreakAfter: 'always',
                            borderTop: pageIdx > 0 ? 'none' : undefined,
                          }}
                        >
                          {/* Profile Header (spans both columns) - only on first page */}
                          {pageIdx === 0 && (
                            <div
                              className="resume-modern-header"
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: isMobile ? '12px' : '24px',
                                padding: isMobile ? '16px' : '32px 32px 16px 32px',
                                borderBottom: '1px solid #e5e7eb',
                                background: '#172554', // deep navy blue (blue-950)
                                flexWrap: 'wrap',
                              }}
                            >
                              {profileImageUrl && (
                                <img
                                  src={profileImageUrl}
                                  alt="Profile"
                                  className="w-[155px] h-[155px] rounded-full object-cover border-4"
                                  style={{
                                    borderColor: '#60a5fa',
                                    boxShadow: '0 2px 8px #0003',
                                    background: '#fff',
                                    flexShrink: 0,
                                    marginTop: 0,
                                    width: isMobile ? '80px' : '115px',
                                    height: isMobile ? '80px' : '115px',
                                    marginLeft: 0,
                                    marginRight: 0,
                                  }}
                                />
                              )}
                              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                <h1
                                  className="text-xl font-bold tracking-wide mb-0.5 uppercase"
                                  style={{
                                    color: '#fff', // white for name
                                    letterSpacing: '0.08em',
                                    textShadow: '0 1px 4px rgba(17, 24, 39, 0.08)',
                                    fontWeight: 800,
                                    fontSize: isMobile ? '16px' : '20px',
                                    marginBottom: 2,
                                    wordBreak: 'break-word',
                                    textAlign: 'left',
                                  }}
                                >
                                  {personalInfo.fullName || (isUrdu ? 'آپ کا نام' : 'Your Name')}
                                </h1>
                                {personalInfo.title && (
                                  <h2
                                    className="text-sm font-medium tracking-wide mb-0.5 uppercase"
                                    style={{
                                      color: '#fff', // white for job title
                                      letterSpacing: '0.08em',
                                      textShadow: '0 1px 4px rgba(17, 24, 39, 0.08)',
                                      fontWeight: 800,
                                      fontSize: isMobile ? '11px' : '13px',
                                      marginBottom: 2,
                                      wordBreak: 'break-word',
                                      textAlign: 'left',
                                    }}
                                  >
                                    {personalInfo.title}
                                  </h2>
                                )}
                                <div className="flex flex-wrap items-center gap-2 text-xs mt-1" style={{ color: '#e0e7ef', wordBreak: 'break-word', justifyContent: 'flex-start' }}>
                                  {personalInfo.email && <span>{personalInfo.email}</span>}
                                  {personalInfo.phone && <span>{personalInfo.phone}</span>}
                                  {personalInfo.address && <span>{personalInfo.address}</span>}
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Responsive Two-column layout */}
                          <div
                            className="resume-modern-body"
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'stretch',
                              minHeight: 'auto',
                              padding: '0',
                              width: '100%',
                              flexWrap: 'nowrap',
                            }}
                          >
                            {/* Sidebar: On mobile, stack below header and above main content */}
                            {pageIdx === 0 && (
                            <aside
                              className="resume-modern-sidebar"
                              style={{
                                width: '33%',
                                background: '#172554', // deep navy blue (blue-950)
                                color: '#fff', // main text white
                                borderRight: '1px solid #e5e7eb',
                                padding: isMobile ? '16px 12px' : '24px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: isMobile ? '16px' : '24px',
                                minWidth: isMobile ? '120px' : 0,
                                boxSizing: 'border-box',
                                flexShrink: 0,
                              }}
                            >
                              {/* Education */}
                              <section>
                                <h3 className="text-xs font-bold uppercase mb-1" style={{ color: '#fff', letterSpacing: '0.08em', textShadow: '0 1px 4px rgba(17, 24, 39, 0.08)', fontWeight: 800, fontSize: isMobile ? '11px' : '13px' }}>{isUrdu ? 'تعلیم' : 'Education'}</h3>
                                {educations.some(edu => edu.institution) && (
                                  <ul className="space-y-1">
                                    {educations.filter(edu => edu.institution).map((edu) => (
                                      <li key={edu.id}>
                                        <div className="font-semibold text-xs">{edu.degree}</div>
                                        <div className="text-xs" style={{color:'#cbd5e1'}}>{edu.institution}</div>
                                        <div className="text-xs" style={{color:'#94a3b8'}}>{edu.startDate} - {edu.endDate}</div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </section>
                              {/* Skills/Expertise */}
                              <section style={{ marginTop: '24px' }}>
                                <h3 className="text-xs font-bold uppercase mb-1" style={{ color: '#fff', letterSpacing: '0.08em', textShadow: '0 1px 4px rgba(17, 24, 39, 0.08)', fontWeight: 800, fontSize: isMobile ? '11px' : '13px' }}>{isUrdu ? 'مہارتیں' : 'Expertise'}</h3>
                                {skills.some(skill => skill.trim()) && (
                                  <ul className="space-y-1 text-xs">
                                    {skills.filter(skill => skill.trim()).map((skill, idx) => (
                                      <li key={idx} className="flex items-start gap-1"><span className="text-lg" style={{lineHeight:'1',color:'#fff'}}>&bull;</span> <span>{skill}</span></li>
                                    ))}
                                  </ul>
                                )}
                              </section>
                              {/* Languages */}
                              <section style={{ marginTop: '24px' }}>
                                <h3 className="text-xs font-bold uppercase mb-1" style={{ color: '#fff', letterSpacing: '0.08em', textShadow: '0 1px 4px rgba(17, 24, 39, 0.08)', fontWeight: 800, fontSize: isMobile ? '11px' : '13px' }}>{isUrdu ? 'زبانیں' : 'Languages'}</h3>
                                {languages.some(lang => lang.trim()) && (
                                  <ul className="space-y-1 text-xs">
                                    {languages.filter(lang => lang.trim()).map((lang, idx) => (
                                      <li key={idx} className="flex items-start gap-1"><span className="text-lg" style={{lineHeight:'1',color:'#fff'}}>&bull;</span> <span>{lang}</span></li>
                                    ))}
                                  </ul>
                                )}
                              </section>
                            </aside>
                            )}
                            {/* Main Content */}
                            <main
                              className="resume-modern-main"
                              style={{
                                flex: 1,
                                padding: isMobile ? '16px' : '32px 32px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: isMobile ? '12px' : '18px',
                                minWidth: 0,
                                boxSizing: 'border-box',
                              }}
                            >
                              {pageSections}
                            </main>
                          </div>
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
                    
                    {template === 'classic' && (() => {
                      let sectionIdx = 0;
                      const sections = [];

                      // Group header and summary together to prevent page break between them
                      sections.push(
                        <div key="header-summary" ref={el => classicSectionRefs.current[sectionIdx++] = el}>
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
                          <div key="experience" ref={el => classicSectionRefs.current[sectionIdx++] = el} className="mb-5">
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
                          <div key="education" ref={el => classicSectionRefs.current[sectionIdx++] = el} className="mb-5">
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

                      if(skillBasedSections.length > 0) {
                        sections.push(
                          <div key="skill-based" ref={el => classicSectionRefs.current[sectionIdx++] = el} className="flex flex-wrap gap-x-8 gap-y-5">
                            {skillBasedSections}
                          </div>
                        );
                      }

                      const pages = paginateSections(sections, classicSectionHeights);
                      const totalPages = pages.length;
                      const pagesToShow = pages.slice(0, visiblePages);
                      return (
                        <>
                        {pagesToShow.map((pageSections, pageIdx) => (
                        <div key={pageIdx} className="resume-classic-container" style={{ padding: '40px', border: '1px solid #e5e7eb', marginBottom: 0, background: 'white', pageBreakAfter: 'always', fontFamily: 'system-ui, sans-serif' }}>
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

                      // Group header and summary together to prevent page break between them
                      sections.push(
                        <div key="header-summary" ref={el => minimalSectionRefs.current[sectionIdx++] = el}>
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
                          <div key="experience" ref={el => minimalSectionRefs.current[sectionIdx++] = el} className="mb-5">
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
                          <div key="education" ref={el => minimalSectionRefs.current[sectionIdx++] = el} className="mb-5">
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

                      if(skillBasedSections.length > 0) {
                        sections.push(
                          <div key="skill-based" ref={el => minimalSectionRefs.current[sectionIdx++] = el} className="flex flex-wrap gap-x-8 gap-y-5">
                            {skillBasedSections}
                          </div>
                        );
                      }

                      const pages = paginateSections(sections, minimalSectionHeights);
                      const totalPages = pages.length;
                      const pagesToShow = pages.slice(0, visiblePages);
                      return (
                        <>
                          {pagesToShow.map((pageSections, pageIdx) => (
                        <div key={pageIdx} className="resume-minimal-container" style={{ padding: '40px', border: '1px solid #e5e7eb', marginBottom: 0, background: 'white', pageBreakAfter: 'always', fontFamily: 'system-ui, sans-serif' }}>
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
          <Button onClick={saveResume} disabled={saving} className="px-2 py-1 text-xs w-auto">
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