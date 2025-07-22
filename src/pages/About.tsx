import React from 'react';
import { Briefcase, FileText, FileSignature, Sparkles, Wrench, Users, Lightbulb, CalendarCheck, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Is GenDocs free to use?',
    answer: 'Yes! GenDocs offers free access to core features. Premium tools and templates will be available soon.'
  },
  {
    question: 'Can I use GenDocs on my phone?',
    answer: 'Absolutely. GenDocs is fully responsive and works great on all devices.'
  },
  {
    question: 'How secure is my data?',
    answer: 'Your privacy and security are our top priorities. We use industry-standard encryption and never share your data.'
  },
  {
    question: 'What new features are coming?',
    answer: 'We’re working on document analytics, team collaboration, more templates, and much more!'
  }
];

const About: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-0 md:p-4 lg:p-8 flex flex-col dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center">
        <span className="mt-8 md:mt-12 lg:mt-0 p-4 bg-gradient-to-r from-primary to-primary/80 rounded-full mb-6 shadow-lg">
          <Briefcase className="w-14 h-14 text-primary-foreground" />
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-primary drop-shadow-lg tracking-tight text-center dark:text-white">
          About GenDocs
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl text-center mb-8 dark:text-gray-300">
          <span className="font-semibold text-primary dark:text-white">GenDocs</span> is your smart platform for generating <span className="font-semibold text-primary dark:text-white">invoices</span> and <span className="font-semibold text-primary dark:text-white">resumes</span> in seconds. Designed for freelancers, business owners, and job seekers, GenDocs makes professional document creation effortless and beautiful.
        </p>
        {/* Vision Statement */}
        <div className="flex items-center gap-3 bg-primary/10 rounded-lg px-6 py-4 mb-8 shadow dark:bg-gray-800">
          <Lightbulb className="w-7 h-7 text-primary" />
          <span className="text-lg md:text-xl text-primary font-semibold dark:text-white">Our Vision: Empower everyone to create, share, and manage documents with confidence and creativity.</span>
        </div>
        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
          <div className="flex items-start gap-4 bg-white/90 rounded-lg p-5 shadow border border-primary/10 dark:bg-gray-900 dark:border-gray-800">
            <span className="p-2 bg-primary/10 rounded-full"><FileText className="w-7 h-7 text-primary" /></span>
            <div>
              <h3 className="text-xl font-bold text-primary mb-1 dark:text-white">Invoice Generator</h3>
              <p className="text-base text-muted-foreground dark:text-gray-300">Create professional invoices with customizable templates, ready to send or print instantly.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-white/90 rounded-lg p-5 shadow border border-primary/10 dark:bg-gray-900 dark:border-gray-800">
            <span className="p-2 bg-primary/10 rounded-full"><FileSignature className="w-7 h-7 text-primary" /></span>
            <div>
              <h3 className="text-xl font-bold text-primary mb-1 dark:text-white">Resume Builder</h3>
              <p className="text-base text-muted-foreground dark:text-gray-300">Build stunning resumes that help you stand out, with easy editing and beautiful layouts.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-white/90 rounded-lg p-5 shadow border border-primary/10 dark:bg-gray-900 dark:border-gray-800">
            <span className="p-2 bg-primary/10 rounded-full"><Sparkles className="w-7 h-7 text-primary" /></span>
            <div>
              <h3 className="text-xl font-bold text-primary mb-1 dark:text-white">Modern & Intuitive</h3>
              <p className="text-base text-muted-foreground dark:text-gray-300">Enjoy a seamless, user-friendly experience on any device, with modern design and real-time previews.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-white/90 rounded-lg p-5 shadow border border-primary/10 dark:bg-gray-900 dark:border-gray-800">
            <span className="p-2 bg-primary/10 rounded-full"><Wrench className="w-7 h-7 text-primary" /></span>
            <div>
              <h3 className="text-xl font-bold text-primary mb-1 dark:text-white">More Tools Coming Soon</h3>
              <p className="text-base text-muted-foreground dark:text-gray-300">Stay tuned for powerful new features: document templates, analytics, team collaboration, and much more!</p>
            </div>
          </div>
        </div>
        {/* Roadmap Section */}
        <div className="w-full bg-primary/5 rounded-xl p-6 mb-8 flex flex-col gap-4 border border-primary/10 shadow dark:bg-gray-800 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl md:text-2xl font-bold text-primary dark:text-white">What’s Next? Our Roadmap</h2>
          </div>
          <ul className="list-disc list-inside text-base md:text-lg text-muted-foreground space-y-1 pl-2 dark:text-gray-300">
            <li>Team collaboration & shared workspaces</li>
            <li>Advanced analytics for your documents</li>
            <li>More beautiful templates for invoices, resumes, and more</li>
            <li>Integration with popular business tools</li>
            <li>AI-powered document suggestions & autofill</li>
            <li>And much more based on your feedback!</li>
          </ul>
        </div>
        {/* Main Content Sections */}
        <div className="w-full bg-white/80 rounded-xl shadow-xl p-6 md:p-10 flex flex-col gap-8 border border-primary/10 dark:bg-gray-900 dark:border-gray-800">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 dark:text-white">Our Mission</h2>
            <p className="text-base md:text-lg text-muted-foreground dark:text-gray-300">
              We believe in simplifying your workflow. GenDocs is built with modern technology and a user-first approach, making document generation fast, intuitive, and beautiful. Our mission is to save you time and help you present your best self—whether you’re sending an invoice or applying for your dream job.
            </p>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 dark:text-white">What Makes GenDocs Special?</h2>
            <ul className="list-disc list-inside text-base md:text-lg text-muted-foreground space-y-2 pl-2 dark:text-gray-300">
              <li>⚡ <span className="font-medium text-primary dark:text-white">Instant Document Creation:</span> Generate invoices and resumes in seconds.</li>
              <li>🎨 <span className="font-medium text-primary dark:text-white">Modern, Elegant Templates:</span> Stand out with stylish, professional designs.</li>
              <li>🔒 <span className="font-medium text-primary dark:text-white">Secure & Private:</span> Your data is protected with industry best practices.</li>
              <li>🌐 <span className="font-medium text-primary dark:text-white">Multi-language Support:</span> Switch between English and Urdu seamlessly.</li>
              <li>📱 <span className="font-medium text-primary dark:text-white">Mobile Friendly:</span> Use GenDocs on any device, anywhere.</li>
              <li>📝 <span className="font-medium text-primary dark:text-white">Easy Editing:</span> Update and customize your documents anytime.</li>
              <li>☁️ <span className="font-medium text-primary dark:text-white">Cloud Access:</span> Access your documents from anywhere, anytime.</li>
              <li>🚀 <span className="font-medium text-primary dark:text-white">Future-Ready:</span> Exciting new tools and features are on the way!</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 dark:text-white">How It Works</h2>
            <ol className="list-decimal list-inside text-base md:text-lg text-muted-foreground space-y-1 pl-2 dark:text-gray-300">
              <li>Sign up and choose your document type (Invoice or Resume).</li>
              <li>Fill in your details using our simple, guided forms.</li>
              <li>Preview your document in real-time with beautiful templates.</li>
              <li>Download, print, or share your document instantly.</li>
            </ol>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 dark:text-white">Join Our Community</h2>
            <p className="text-base md:text-lg text-muted-foreground flex items-center gap-2 dark:text-gray-300">
              <Users className="w-5 h-5 text-primary" />
              We’re passionate about helping you succeed. Explore GenDocs, share your feedback, and become part of a growing community that values simplicity, style, and productivity. <br />
              <span className="font-semibold text-primary dark:text-white">Your success is our inspiration!</span>
            </p>
          </div>
        </div>
        {/* FAQ Section */}
        <div className="w-full mt-10 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h2 className="text-xl md:text-2xl font-bold text-primary dark:text-white">Frequently Asked Questions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white/90 rounded-lg p-5 shadow border border-primary/10 dark:bg-gray-900 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-primary mb-2 dark:text-white">{faq.question}</h3>
                <p className="text-base text-muted-foreground dark:text-gray-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Call to Action */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/90 text-white px-6 py-3 rounded-full shadow-lg text-lg font-semibold animate-pulse dark:bg-primary dark:text-white">
            <Sparkles className="w-6 h-6" />
            Exciting new tools & features coming soon—stay tuned!
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 