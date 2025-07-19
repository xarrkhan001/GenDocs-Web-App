export const translations = {
  english: {
    // Dashboard
    dashboard: 'Dashboard',
    welcomeBack: 'Welcome back',
    invoiceGenerator: 'Invoice Generator',
    resumeBuilder: 'Resume Builder',
    createInvoice: 'Create Invoice',
    createResume: 'Create Resume',
    recentInvoices: 'Recent Invoices',
    recentResumes: 'Recent Resumes',
    totalInvoices: 'Total Invoices',
    totalResumes: 'Total Resumes',
    
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    
    // Invoice
    invoiceTitle: 'Invoice',
    clientName: 'Client Name',
    clientEmail: 'Client Email',
    clientAddress: 'Client Address',
    description: 'Description',
    quantity: 'Quantity',
    price: 'Price',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax',
    addItem: 'Add Item',
    saveInvoice: 'Save Invoice',
    downloadPDF: 'Download PDF',
    
    // Resume
    resumeTitle: 'Resume',
    personalInfo: 'Personal Information',
    education: 'Education',
    experience: 'Experience',
    skills: 'Skills',
    phone: 'Phone',
    address: 'Address',
    degree: 'Degree',
    institution: 'Institution',
    year: 'Year',
    jobTitle: 'Job Title',
    company: 'Company',
    duration: 'Duration',
    addEducation: 'Add Education',
    addExperience: 'Add Experience',
    addSkill: 'Add Skill',
    saveResume: 'Save Resume',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    create: 'Create',
    update: 'Update',
    loading: 'Loading...',
    language: 'Language',
  },
  urdu: {
    // Dashboard
    dashboard: 'ڈیش بورڈ',
    welcomeBack: 'خوش آمدید',
    invoiceGenerator: 'انوائس جنریٹر',
    resumeBuilder: 'ریزیومے بلڈر',
    createInvoice: 'انوائس بنائیں',
    createResume: 'ریزیومے بنائیں',
    recentInvoices: 'حالیہ انوائسز',
    recentResumes: 'حالیہ ریزیومے',
    totalInvoices: 'کل انوائسز',
    totalResumes: 'کل ریزیومے',
    
    // Auth
    signIn: 'سائن ان',
    signUp: 'سائن اپ',
    signOut: 'سائن آؤٹ',
    email: 'ای میل',
    password: 'پاس ورڈ',
    fullName: 'پورا نام',
    alreadyHaveAccount: 'کیا آپ کا اکاؤنٹ ہے؟',
    dontHaveAccount: 'کیا آپ کا اکاؤنٹ نہیں ہے؟',
    
    // Invoice
    invoiceTitle: 'انوائس',
    clientName: 'کلائنٹ کا نام',
    clientEmail: 'کلائنٹ کی ای میل',
    clientAddress: 'کلائنٹ کا پتہ',
    description: 'تفصیلات',
    quantity: 'مقدار',
    price: 'قیمت',
    total: 'کل',
    subtotal: 'ذیلی کل',
    tax: 'ٹیکس',
    addItem: 'آئٹم شامل کریں',
    saveInvoice: 'انوائس محفوظ کریں',
    downloadPDF: 'پی ڈی ایف ڈاؤن لوڈ',
    
    // Resume
    resumeTitle: 'ریزیومے',
    personalInfo: 'ذاتی معلومات',
    education: 'تعلیم',
    experience: 'تجربہ',
    skills: 'مہارتیں',
    phone: 'فون',
    address: 'پتہ',
    degree: 'ڈگری',
    institution: 'ادارہ',
    year: 'سال',
    jobTitle: 'نوکری کا عنوان',
    company: 'کمپنی',
    duration: 'مدت',
    addEducation: 'تعلیم شامل کریں',
    addExperience: 'تجربہ شامل کریں',
    addSkill: 'مہارت شامل کریں',
    saveResume: 'ریزیومے محفوظ کریں',
    
    // Common
    save: 'محفوظ کریں',
    cancel: 'منسوخ',
    edit: 'تبدیل کریں',
    delete: 'حذف کریں',
    view: 'دیکھیں',
    create: 'بنائیں',
    update: 'اپ ڈیٹ',
    loading: 'لوڈ ہو رہا ہے...',
    language: 'زبان',
  }
};

export type TranslationKey = keyof typeof translations.english;

export const t = (key: TranslationKey, language: 'english' | 'urdu' = 'english'): string => {
  return translations[language][key] || translations.english[key];
};