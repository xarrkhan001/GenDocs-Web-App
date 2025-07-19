import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

const ResumeBuilder: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const resumeRef = useRef<HTMLDivElement>(null);

  const [language, setLanguage] = useState<'english' | 'urdu'>('english');
  const [template, setTemplate] = useState<'modern' | 'classic' | 'minimal'>('modern');
  
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    title: '',
    summary: ''
  });

  const [experiences, setExperiences] = useState<Experience[]>([
    { id: '1', company: '', position: '', startDate: '', endDate: '', description: '' }
  ]);

  const [educations, setEducations] = useState<Education[]>([
    { id: '1', institution: '', degree: '', startDate: '', endDate: '' }
  ]);

  const [skills, setSkills] = useState<string[]>(['']);

  const [saving, setSaving] = useState(false);

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

  const saveResume = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const resumeData = {
        user_id: user.id,
        title: personalInfo.title || `${personalInfo.fullName}'s Resume`,
        language: language,
        template_id: template,
        personal_info: JSON.stringify(personalInfo),
        experience: JSON.stringify(experiences),
        education: JSON.stringify(educations),
        skills: JSON.stringify(skills.filter(skill => skill.trim() !== ''))
      };

      const { data, error } = await supabase
        .from('resumes')
        .insert(resumeData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Resume Saved",
        description: "Your resume has been saved successfully.",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error saving resume:', error);
      toast({
        title: "Error",
        description: "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = async () => {
    if (!resumeRef.current) return;

    try {
      const canvas = await html2canvas(resumeRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Resume Builder</h1>
          </div>
          <div className="flex gap-2">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </div>

          {/* Resume Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{isUrdu ? 'پیش منظر' : 'Preview'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={resumeRef} className="bg-white p-8 text-black min-h-[800px]" style={{ direction: isUrdu ? 'rtl' : 'ltr' }}>
                  {template === 'modern' && (
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="text-center border-b-4 border-blue-600 pb-4">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                          {personalInfo.fullName || (isUrdu ? 'آپ کا نام' : 'Your Name')}
                        </h1>
                        {personalInfo.title && (
                          <h2 className="text-xl text-blue-600 mb-3">{personalInfo.title}</h2>
                        )}
                        <div className="flex justify-center gap-4 text-sm text-gray-600">
                          {personalInfo.email && <span>{personalInfo.email}</span>}
                          {personalInfo.phone && <span>{personalInfo.phone}</span>}
                          {personalInfo.address && <span>{personalInfo.address}</span>}
                        </div>
                      </div>

                      {/* Summary */}
                      {personalInfo.summary && (
                        <div>
                          <h3 className="text-lg font-semibold text-blue-600 mb-2 border-b border-gray-300">
                            {isUrdu ? 'خلاصہ' : 'PROFESSIONAL SUMMARY'}
                          </h3>
                          <p className="text-gray-700 leading-relaxed">{personalInfo.summary}</p>
                        </div>
                      )}

                      {/* Experience */}
                      {experiences.some(exp => exp.company) && (
                        <div>
                          <h3 className="text-lg font-semibold text-blue-600 mb-3 border-b border-gray-300">
                            {isUrdu ? 'تجربہ' : 'WORK EXPERIENCE'}
                          </h3>
                          <div className="space-y-4">
                            {experiences.filter(exp => exp.company).map((exp) => (
                              <div key={exp.id}>
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-semibold text-gray-800">{exp.position}</h4>
                                  <span className="text-sm text-gray-600">
                                    {exp.startDate} - {exp.endDate || (isUrdu ? 'موجودہ' : 'Present')}
                                  </span>
                                </div>
                                <p className="text-blue-600 font-medium mb-2">{exp.company}</p>
                                {exp.description && (
                                  <p className="text-gray-700 text-sm leading-relaxed">{exp.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {educations.some(edu => edu.institution) && (
                        <div>
                          <h3 className="text-lg font-semibold text-blue-600 mb-3 border-b border-gray-300">
                            {isUrdu ? 'تعلیم' : 'EDUCATION'}
                          </h3>
                          <div className="space-y-3">
                            {educations.filter(edu => edu.institution).map((edu) => (
                              <div key={edu.id}>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold text-gray-800">{edu.degree}</h4>
                                    <p className="text-blue-600">{edu.institution}</p>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {edu.startDate} - {edu.endDate}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {skills.some(skill => skill.trim()) && (
                        <div>
                          <h3 className="text-lg font-semibold text-blue-600 mb-3 border-b border-gray-300">
                            {isUrdu ? 'مہارات' : 'SKILLS'}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {skills.filter(skill => skill.trim()).map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;