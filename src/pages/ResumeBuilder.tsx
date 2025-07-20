import React, { useState, useRef } from 'react';
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
            const personal = typeof data.personal_info === 'string' ? JSON.parse(data.personal_info) : {};
            setPersonalInfo(personal);
            if (personal.profileImageUrl) setProfileImageUrl(personal.profileImageUrl);
            setExperiences(typeof data.experience === 'string' ? JSON.parse(data.experience) : [{ id: '1', company: '', position: '', startDate: '', endDate: '', description: '' }]);
            setEducations(typeof data.education === 'string' ? JSON.parse(data.education) : [{ id: '1', institution: '', degree: '', startDate: '', endDate: '' }]);
            setSkills(typeof data.skills === 'string' ? JSON.parse(data.skills) : ['']);
            setCertifications(typeof data.certifications === 'string' ? JSON.parse(data.certifications) : Array.isArray(data.certifications) ? data.certifications : ['']);
            setLanguages(typeof data.languages === 'string' ? JSON.parse(data.languages) : Array.isArray(data.languages) ? data.languages : ['']);
            const lang = String(data.language);
            setLanguage(lang === 'english' || lang === 'urdu' ? lang : 'english');
            const tmpl = String(data.template_id);
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
    if (!resumeRef.current) return;

    try {
      // Use a higher scale for HD quality
      const canvas = await html2canvas(resumeRef.current, {
        scale: 4, // Increased from 2 to 4 for higher resolution
        useCORS: true,
        allowTaint: true
      });

      // Custom page size: 210mm x 380mm (taller than A4)
      const imgWidth = 210;
      const pageHeight = 380;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // [width, height] in mm
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [imgWidth, pageHeight], compress: true });

      if (imgHeight <= pageHeight) {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      } else {
        let position = 0;
        const pagePxHeight = Math.floor((pageHeight * canvas.height) / imgHeight);
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        pageCanvas.width = canvas.width;

        let pageCount = 0;
        while (position < canvas.height) {
          const cropHeight = Math.min(pagePxHeight, canvas.height - position);
          if (cropHeight <= 0) break;

          pageCanvas.height = cropHeight;
          pageCtx && pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
          pageCtx && pageCtx.drawImage(
            canvas,
            0, position,
            canvas.width, cropHeight,
            0, 0,
            canvas.width, cropHeight
          );
          const pageImgData = pageCanvas.toDataURL('image/png');
          if (position > 0) pdf.addPage();
          pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, (cropHeight * imgWidth) / canvas.width, undefined, 'FAST');
          position += pagePxHeight;
          pageCount++;
        }

        // Remove last page if it's blank
        if (pdf.getNumberOfPages() > 1) {
          const lastPage = pdf.getNumberOfPages();
          pdf.setPage(lastPage);
          if (position >= canvas.height) {
            pdf.deletePage(lastPage);
          }
        }
      }

      pdf.save(`resume-${personalInfo.fullName || 'draft'}.pdf`);
      toast({
        title: "PDF Downloaded",
        description: "Resume has been downloaded as PDF.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isUrdu = language === 'urdu';

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
              <h2 className="hidden md:block text-sm font-semibold text-blue-700 mt-1 tracking-wide uppercase mb-2">{personalInfo.title}</h2>
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
                  <Select value={template} onValueChange={(value: 'modern' | 'classic' | 'minimal') => setTemplate(value)}>
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
                <div ref={resumeRef} className="resume-preview bg-white p-4 text-black overflow-auto max-h-[297mm] sm:max-h-[297mm]" style={{ 
                  direction: isUrdu ? 'rtl' : 'ltr', 
                  fontSize: '11px',
                  lineHeight: '1.3',
                  pageBreakAfter: 'avoid',
                  pageBreakInside: 'avoid',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  {template === 'modern' && (
                    <div
                      className="space-y-3"
                      style={{
                        fontSize: '13px',
                        lineHeight: '1.25',
                        maxWidth: '800px',
                        margin: '0 auto',
                        background: '#f9fafb', // gray-50
                        borderRadius: '18px',
                        boxShadow: '0 2px 16px 0 rgba(30, 64, 175, 0.12)',
                        color: '#1e293b',
                        padding: '36px 24px',
                        position: 'relative',
                        minHeight: 200
                      }}
                    >
                      {/* Professional Header */}
                      <section
                        className="flex flex-col sm:flex-row items-center sm:items-start mb-2 gap-4 sm:gap-6 text-center sm:text-left"
                      >
                        {profileImageUrl && (
                          <img
                            src={profileImageUrl}
                            alt="Profile"
                            className="w-24 h-24 sm:w-[140px] sm:h-[140px] rounded-full object-cover border-4 border-orange-400 shadow-md bg-white flex-shrink-0 mx-auto sm:mx-0"
                            style={{ marginTop: '-18px' }}
                          />
                        )}
                        <div className="flex-1 flex flex-col items-center sm:items-start justify-center mt-2 sm:mt-0 gap-1">
                          <h1
                            className="text-lg sm:text-xl font-bold tracking-wide mb-0.5"
                            style={{ letterSpacing: '0.04em', color: '#f59e42' }}
                          >
                            {personalInfo.fullName || (isUrdu ? 'آپ کا نام' : 'Your Name')}
                          </h1>
                          {personalInfo.title && (
                            <h2
                              className="text-xs sm:text-sm font-medium tracking-wide mb-0.5"
                              style={{ letterSpacing: '0.03em', color: '#fb923c' }}
                            >
                              {personalInfo.title}
                            </h2>
                          )}
                          <div className="flex flex-col sm:flex-row flex-wrap items-center sm:items-center gap-1 sm:gap-2 text-xs mt-1" style={{ color: '#64748b' }}>
                            {personalInfo.email && <span>{personalInfo.email}</span>}
                            {personalInfo.phone && <span>{personalInfo.phone}</span>}
                            {personalInfo.address && <span>{personalInfo.address}</span>}
                          </div>
                        </div>
                      </section>
                      {/* Professional Summary Section */}
                      {personalInfo.summary && (
                        <section className="mb-1">
                          <h3
                            className="text-lg font-bold mb-0.5 uppercase"
                            style={{ letterSpacing: '0.04em', color: '#f59e42' }} // orange-400
                          >
                            {isUrdu ? 'پیشہ ورانہ خلاصہ' : 'Professional Summary'}
                          </h3>
                          <p className="leading-relaxed text-xs mt-0.5" style={{ color: '#334155' }}>
                            {personalInfo.summary}
                          </p>
                        </section>
                      )}
                      {/* Experience Section */}
                      {experiences.some(exp => exp.company) && (
                        <section className="mb-1">
                          <h3
                            className="text-lg font-bold mb-0.5 uppercase"
                            style={{ letterSpacing: '0.04em', color: '#f59e42' }} // orange-400
                          >
                            {isUrdu ? 'تجربہ' : 'Work Experience'}
                          </h3>
                          <div className="space-y-1 mt-1">
                            {experiences.filter(exp => exp.company).map((exp, index) => (
                              <div key={exp.id}>
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-base" style={{ color: '#0f172a' }}>{exp.position}</span>
                                  <span className="text-xs" style={{ color: '#64748b' }}>{exp.startDate} - {exp.endDate || (isUrdu ? 'موجودہ' : 'Present')}</span>
                                </div>
                                <div className="font-medium text-xs mt-0.5" style={{ color: '#475569' }}>
                                  {exp.company}
                                </div>
                                {exp.description && (
                                  <p className="leading-relaxed text-xs mt-0.5" style={{ color: '#334155' }}>{exp.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Education Section */}
                      {educations.some(edu => edu.institution) && (
                        <section className="mb-1">
                          <h3
                            className="text-lg font-bold mb-0.5 uppercase"
                            style={{ letterSpacing: '0.04em', color: '#f59e42' }} // orange-400
                          >
                            {isUrdu ? 'تعلیم' : 'Education'}
                          </h3>
                          <div className="space-y-1 mt-1">
                            {educations.filter(edu => edu.institution).map((edu) => (
                              <div key={edu.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                <div>
                                  <span className="font-semibold text-base" style={{ color: '#0f172a' }}>{edu.degree}</span>
                                  <div className="font-medium text-xs mt-0.5" style={{ color: '#475569' }}>
                                    {edu.institution}
                                  </div>
                                </div>
                                <span className="text-xs mt-0.5 sm:mt-0" style={{ color: '#64748b' }}>{edu.startDate} - {edu.endDate}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Skills Section */}
                      {skills.some(skill => skill.trim()) && (
                        <section className="mb-1">
                          <h3
                            className="text-lg font-bold mb-0.5 uppercase"
                            style={{ letterSpacing: '0.04em', color: '#f59e42' }} // orange-400
                          >
                            {isUrdu ? 'مہارات' : 'Skills'}
                          </h3>
                          <div className="mt-0.5 text-xs flex flex-wrap gap-2">
                            {skills.filter(skill => skill.trim()).map((skill, index) => (
                              <span
                                key={index}
                                style={{
                                  background: 'none',
                                  color: '#1e293b', // normal text color
                                  padding: '0 0.2em',
                                  borderRadius: '0',
                                  fontSize: '1em',
                                  letterSpacing: '0.01em',
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Certifications Section */}
                      {certifications.some(cert => cert.trim()) && (
                        <section className="mb-1">
                          <h3
                            className="text-lg font-bold mb-0.5 uppercase"
                            style={{ letterSpacing: '0.04em', color: '#f59e42' }} // orange-400
                          >
                            {isUrdu ? 'سرٹیفیکیشنز' : 'Certifications'}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-0.5 text-xs">
                            {certifications.filter(cert => cert.trim()).map((cert, idx) => (
                              <span
                                key={idx}
                                style={{
                                  background: 'none',
                                  color: '#1e293b', // normal text color
                                  padding: '0 0.2em',
                                  borderRadius: '0',
                                  fontSize: '1em',
                                  letterSpacing: '0.01em',
                                }}
                              >
                                {cert}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Languages Section */}
                      {languages.some(lang => lang.trim()) && (
                        <div className="page-break">
                          <section className="mb-1">
                            <h3
                              className="text-lg font-bold mb-0.5 uppercase"
                              style={{ letterSpacing: '0.04em', color: '#f59e42' }} // orange-400
                            >
                              {isUrdu ? 'زبانیں' : 'Languages'}
                            </h3>
                            <div className="mt-0.5 text-xs flex flex-wrap gap-2">
                              {languages.filter(lang => lang.trim()).map((lang, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    background: 'none',
                                    color: '#1e293b', // normal text color
                                    padding: '0 0.2em',
                                    borderRadius: '0',
                                    fontSize: '1em',
                                    letterSpacing: '0.01em',
                                  }}
                                >
                                  {lang}
                                </span>
                              ))}
                            </div>
                          </section>
                        </div>
                      )}
                    </div>
                  )}
                  {template === 'classic' && (
                    <div className="space-y-6" style={{fontFamily: 'Georgia, Times, serif', color: '#222', maxWidth: '800px', margin: '0 auto'}}>
                      {/* Header */}
                      <section className="text-center mb-4">
                        <h1 className="text-2xl font-bold mb-0.5" style={{color: '#38bdf8'}}>{personalInfo.fullName || (isUrdu ? 'آپ کا نام' : 'Your Name')}</h1>
                        {personalInfo.title && (
                          <h2 className="text-base font-semibold mb-1" style={{color: '#38bdf8'}}>{personalInfo.title}</h2>
                        )}
                        <div className="flex flex-wrap justify-center gap-2 text-xs mt-1" style={{color: '#444'}}>
                          {personalInfo.email && <span>{personalInfo.email}</span>}
                          {personalInfo.phone && <span>{personalInfo.phone}</span>}
                          {personalInfo.address && <span>{personalInfo.address}</span>}
                        </div>
                      </section>
                      {/* Summary */}
                      {personalInfo.summary && (
                        <section className="mb-4">
                          <h3 className="text-base font-bold uppercase tracking-wider border-b pb-1 mb-1" style={{color: '#38bdf8', borderColor: '#4b5563', textAlign: 'left'}}>{isUrdu ? 'پیشہ ورانہ خلاصہ' : 'Professional Summary'}</h3>
                          <p className="text-xs italic" style={{textAlign: 'left'}}>{personalInfo.summary}</p>
                        </section>
                      )}
                      {/* Experience */}
                      {experiences.some(exp => exp.company) && (
                        <section className="mb-4">
                          <h3 className="text-base font-bold uppercase tracking-wider border-b pb-1 mb-1" style={{color: '#38bdf8', borderColor: '#4b5563', textAlign: 'left'}}>{isUrdu ? 'تجربہ' : 'Work Experience'}</h3>
                          <div className="space-y-2">
                            {experiences.filter(exp => exp.company).map((exp, index) => (
                              <div key={exp.id}>
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-sm" style={{textAlign: 'left'}}>{exp.position}</span>
                                  <span className="text-xs text-gray-500">{exp.startDate} - {exp.endDate || (isUrdu ? 'موجودہ' : 'Present')}</span>
                                </div>
                                <div className="text-gray-600 text-xs font-medium" style={{textAlign: 'left'}}>{exp.company}</div>
                                {exp.description && <p className="text-xs mt-1 italic" style={{textAlign: 'left'}}>{exp.description}</p>}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Education */}
                      {educations.some(edu => edu.institution) && (
                        <section className="mb-4">
                          <h3 className="text-base font-bold uppercase tracking-wider border-b pb-1 mb-1" style={{color: '#38bdf8', borderColor: '#4b5563', textAlign: 'left'}}>{isUrdu ? 'تعلیم' : 'Education'}</h3>
                          <div className="space-y-2">
                            {educations.filter(edu => edu.institution).map((edu) => (
                              <div key={edu.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                <div>
                                  <span className="font-semibold text-sm" style={{textAlign: 'left'}}>{edu.degree}</span>
                                  <div className="text-gray-600 text-xs font-medium mt-1" style={{textAlign: 'left'}}>{edu.institution}</div>
                                </div>
                                <span className="text-xs text-gray-500 mt-1 sm:mt-0">{edu.startDate} - {edu.endDate}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Skills */}
                      {skills.some(skill => skill.trim()) && (
                        <section className="mb-4">
                          <h3 className="text-base font-bold uppercase tracking-wider border-b pb-1 mb-1" style={{color: '#38bdf8', borderColor: '#4b5563', textAlign: 'left'}}>{isUrdu ? 'مہارات' : 'Skills'}</h3>
                          <div className="text-xs" style={{textAlign: 'left'}}>
                            {skills.filter(skill => skill.trim()).join(', ')}
                          </div>
                        </section>
                      )}
                      {/* Certifications */}
                      {certifications.some(cert => cert.trim()) && (
                        <section className="mb-4">
                          <h3 className="text-base font-bold uppercase tracking-wider border-b pb-1 mb-1" style={{color: '#38bdf8', borderColor: '#4b5563', textAlign: 'left'}}>{isUrdu ? 'سرٹیفیکیشنز' : 'Certifications'}</h3>
                          <div className="text-xs" style={{textAlign: 'left'}}>
                            {certifications.filter(cert => cert.trim()).join(', ')}
                          </div>
                        </section>
                      )}
                      {/* Languages */}
                      {languages.some(lang => lang.trim()) && (
                        <section className="mb-4">
                          <h3 className="text-base font-bold uppercase tracking-wider border-b pb-1 mb-1" style={{color: '#38bdf8', borderColor: '#4b5563', textAlign: 'left'}}>{isUrdu ? 'زبانیں' : 'Languages'}</h3>
                          <div className="text-xs" style={{textAlign: 'left'}}>
                            {languages.filter(lang => lang.trim()).join(', ')}
                          </div>
                        </section>
                      )}
                    </div>
                  )}
                  {template === 'minimal' && (
                    <div className="space-y-2" style={{fontFamily: 'Arial, sans-serif', color: '#222', fontSize: '13px', lineHeight: '1.3', maxWidth: '800px', margin: '0 auto'}}>
                      {/* Header */}
                      <section className="text-center mb-1">
                        <h1 className="text-xl font-bold mb-0.5" style={{color: '#4b5563'}}>{personalInfo.fullName || (isUrdu ? 'آپ کا نام' : 'Your Name')}</h1>
                        {personalInfo.title && (
                          <h2 className="text-sm font-semibold mb-0.5" style={{color: '#6b7280'}}>{personalInfo.title}</h2>
                        )}
                        <div className="flex flex-wrap justify-center items-center gap-1 text-xs mt-0.5" style={{color: '#444'}}>
                          {personalInfo.email && <span>{personalInfo.email}</span>}
                          {personalInfo.phone && <span>{personalInfo.phone}</span>}
                          {personalInfo.address && <span>{personalInfo.address}</span>}
                        </div>
                      </section>
                      {/* Summary */}
                      {personalInfo.summary && (
                        <section>
                          <h3 className="text-base font-bold mb-0.5" style={{color: '#4b5563'}}>{isUrdu ? 'پیشہ ورانہ خلاصہ' : 'Professional Summary'}</h3>
                          <p className="text-xs mt-0.5">{personalInfo.summary}</p>
                        </section>
                      )}
                      {/* Experience */}
                      {experiences.some(exp => exp.company) && (
                        <section>
                          <h3 className="text-base font-bold mb-0.5" style={{color: '#4b5563'}}>{isUrdu ? 'تجربہ' : 'Work Experience'}</h3>
                          <div className="space-y-1">
                            {experiences.filter(exp => exp.company).map((exp, index) => (
                              <div key={exp.id}>
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-xs">{exp.position}</span>
                                  <span className="text-xs text-gray-500">{exp.startDate} - {exp.endDate || (isUrdu ? 'موجودہ' : 'Present')}</span>
                                </div>
                                <div className="text-gray-600 text-xs font-medium">{exp.company}</div>
                                {exp.description && <p className="text-xs mt-0.5">{exp.description}</p>}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Education */}
                      {educations.some(edu => edu.institution) && (
                        <section>
                          <h3 className="text-base font-bold mb-0.5" style={{color: '#4b5563'}}>{isUrdu ? 'تعلیم' : 'Education'}</h3>
                          <div className="space-y-1">
                            {educations.filter(edu => edu.institution).map((edu) => (
                              <div key={edu.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                <div>
                                  <span className="font-semibold text-xs">{edu.degree}</span>
                                  <div className="text-gray-600 text-xs font-medium mt-0.5">{edu.institution}</div>
                                </div>
                                <span className="text-xs text-gray-500 mt-0.5 sm:mt-0">{edu.startDate} - {edu.endDate}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Skills */}
                      {skills.some(skill => skill.trim()) && (
                        <section>
                          <h3 className="text-base font-bold mb-0.5" style={{color: '#4b5563'}}>{isUrdu ? 'مہارات' : 'Skills'}</h3>
                          <div className="text-xs">
                            {skills.filter(skill => skill.trim()).map((skill, index) => (
                              <span key={index}>{skill}{index < skills.filter(skill => skill.trim()).length - 1 ? ' | ' : ''}</span>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Certifications */}
                      {certifications.some(cert => cert.trim()) && (
                        <section>
                          <h3 className="text-base font-bold mb-0.5" style={{color: '#4b5563'}}>{isUrdu ? 'سرٹیفیکیشنز' : 'Certifications'}</h3>
                          <div className="text-xs">
                            {certifications.filter(cert => cert.trim()).map((cert, idx) => (
                              <span key={idx}>{cert}{idx < certifications.filter(cert => cert.trim()).length - 1 ? ' | ' : ''}</span>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Languages */}
                      {languages.some(lang => lang.trim()) && (
                        <section>
                          <h3 className="text-base font-bold mb-0.5" style={{color: '#4b5563'}}>{isUrdu ? 'زبانیں' : 'Languages'}</h3>
                          <div className="text-xs">
                            {languages.filter(lang => lang.trim()).map((lang, idx) => (
                              <span key={idx}>{lang}{idx < languages.filter(lang => lang.trim()).length - 1 ? ' | ' : ''}</span>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  )}
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