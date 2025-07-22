import React from 'react';
import { FileText, User, ArrowRight, ShieldCheck, Clock, Sparkles, Mail, Users, FileSignature, UserPlus, Settings, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const testimonials = [
  {
    name: 'Ayesha Khan',
    role: 'Freelancer',
    quote: 'GenDocs made invoicing my clients so easy and professional. Highly recommended!',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    name: 'Ali Raza',
    role: 'Job Seeker',
    quote: 'I built my resume in Urdu and English in minutes. The templates are beautiful!',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    name: 'Sara Malik',
    role: 'Small Business Owner',
    quote: 'Managing invoices and documents is now a breeze. GenDocs saves me hours every week.',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
];

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-16 pb-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
            Create Professional Invoices & Resumes Effortlessly
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 dark:text-gray-300">
            GenDocs empowers you to generate beautiful invoices and standout resumes in minutes. Streamline your business and career with our easy-to-use, modern tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard" className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-primary text-white font-semibold text-lg shadow hover:bg-primary/90 transition dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700">
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link to="/about" className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-primary text-primary font-semibold text-lg bg-white hover:bg-primary/10 transition dark:bg-gray-900 dark:text-primary dark:border-primary dark:hover:bg-primary/10">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 pb-16 px-4">
        {/* Invoice Generator Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-xl transition dark:bg-gray-800 dark:border dark:border-gray-700">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 mb-4 shadow">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-blue-700 dark:text-blue-400">Invoice Generator</h2>
          <p className="text-base text-muted-foreground mb-4 dark:text-gray-300">
            Create, customize, and download professional invoices for your business. Auto-calculation, PDF export, and client management made simple.
          </p>
          <Link to="/dashboard" className="inline-flex items-center px-5 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition dark:bg-blue-700 dark:hover:bg-blue-800">
            Try Invoice Tool <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
        {/* Resume Builder Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-xl transition dark:bg-gray-800 dark:border dark:border-gray-700">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 mb-4 shadow">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-400">Resume Builder</h2>
          <p className="text-base text-muted-foreground mb-4 dark:text-gray-300">
            Build standout resumes in English or Urdu with beautiful templates. Export to PDF and impress employers with a professional look.
          </p>
          <Link to="/dashboard" className="inline-flex items-center px-5 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition dark:bg-green-700 dark:hover:bg-green-800">
            Try Resume Tool <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8 pb-16 px-4">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center hover:shadow-lg transition dark:bg-gray-900 dark:border dark:border-gray-700">
          <ShieldCheck className="w-10 h-10 text-primary mb-3" />
          <h3 className="text-lg font-semibold mb-1 dark:text-gray-100">Secure & Private</h3>
          <p className="text-sm text-muted-foreground dark:text-gray-300">Your documents are safe and private. We use modern security to protect your data.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center hover:shadow-lg transition dark:bg-gray-900 dark:border dark:border-gray-700">
          <Clock className="w-10 h-10 text-primary mb-3" />
          <h3 className="text-lg font-semibold mb-1 dark:text-gray-100">Save Time</h3>
          <p className="text-sm text-muted-foreground dark:text-gray-300">Generate invoices and resumes in minutes, not hours. Focus on what matters most.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center hover:shadow-lg transition dark:bg-gray-900 dark:border dark:border-gray-700">
          <Sparkles className="w-10 h-10 text-primary mb-3" />
          <h3 className="text-lg font-semibold mb-1 dark:text-gray-100">Modern & Easy</h3>
          <p className="text-sm text-muted-foreground dark:text-gray-300">Enjoy a beautiful, intuitive interface designed for everyone—no tech skills needed.</p>
        </div>
      </section>

      {/* Testimonials / Why Choose Us Section */}
      <section className="max-w-5xl mx-auto w-full pb-16 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center dark:bg-gray-900 dark:border dark:border-gray-700">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary dark:text-white">Why People Love GenDocs</h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            {testimonials.map((t, i) => (
              <div key={i} className="flex flex-col items-center max-w-xs">
                <img src={t.avatar} alt={t.name} className="w-16 h-16 rounded-full border-4 border-primary mb-3 shadow" />
                <p className="italic text-muted-foreground mb-2 dark:text-gray-300">"{t.quote}"</p>
                <div className="font-semibold text-primary dark:text-white">{t.name}</div>
                <div className="text-xs text-muted-foreground dark:text-gray-400">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-5xl mx-auto w-full pb-16 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center dark:bg-gray-900 dark:border dark:border-gray-700">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-primary dark:text-white">How GenDocs Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 mb-4 shadow">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-1 dark:text-gray-100">Sign Up</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-300">Create your free GenDocs account in seconds to get started.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 mb-4 shadow">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-1 dark:text-gray-100">Choose Tool</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-300">Select Invoice Generator or Resume Builder as per your need.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 mb-4 shadow">
                <Download className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-1 dark:text-gray-100">Download Document</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-300">Generate, preview, and download your document instantly as PDF.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-primary text-white py-10 px-4 mt-auto dark:bg-gray-900 dark:text-gray-200">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 md:gap-16">
          {/* About/Brand */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2 bg-white/20 rounded-lg">
                <FileText className="w-7 h-7 text-white" />
              </span>
              <span className="text-2xl font-bold tracking-tight">GenDocs</span>
            </div>
            <div className="text-white/90 text-base mb-2">All-in-one platform for generating professional invoices and resumes in minutes.</div>
            <div className="text-white/70 text-sm">Fast, secure, and easy-to-use tools for freelancers, businesses, and job seekers.</div>
          </div>
          {/* Quick Links */}
          <div className="flex-1">
            <div className="font-semibold mb-3 flex items-center gap-2"><Users className="w-5 h-5" /> Quick Links</div>
            <ul className="space-y-2 text-white/90 dark:text-gray-300">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/about" className="hover:underline">About</Link></li>
              <li><Link to="/contact" className="hover:underline">Contact</Link></li>
              <li><a href="mailto:abuzarktk123@gmail.com" className="hover:underline">Support</a></li>
            </ul>
          </div>
          {/* Tools */}
          <div className="flex-1">
            <div className="font-semibold mb-3 flex items-center gap-2"><FileSignature className="w-5 h-5" /> Tools</div>
            <ul className="space-y-2 text-white/90 dark:text-gray-300">
              <li><Link to="/dashboard" className="hover:underline">Invoice Generator</Link></li>
              <li><Link to="/dashboard" className="hover:underline">Resume Builder</Link></li>
            </ul>
          </div>
          {/* Contact */}
          <div className="flex-1">
            <div className="font-semibold mb-3 flex items-center gap-2"><Mail className="w-5 h-5" /> Contact</div>
            <ul className="space-y-2 text-white/90 dark:text-gray-300">
              <li>Email: <a href="mailto:abuzarktk123@gmail.com" className="hover:underline">abuzarktk123@gmail.com</a></li>
              <li>For help & feedback, reach out anytime!</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/20 mt-10 pt-6 text-center text-white/70 dark:text-gray-400 text-xs">
          &copy; {new Date().getFullYear()} GenDocs. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home; 