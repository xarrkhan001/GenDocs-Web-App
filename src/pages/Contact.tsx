import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import { Mail, User, MessageCircle, Send } from 'lucide-react';

const SERVICE_ID = 'service_qxzx728'; // TODO: Replace with your EmailJS service ID
const TEMPLATE_ID = 'template_4bqpc6u'; // TODO: Replace with your EmailJS template ID
const USER_ID = 'XevHLxA7eZt7iHF4y'; // TODO: Replace with your EmailJS user/public key

const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          from_name: form.name,
          from_email: form.email,
          message: form.message,
        },
        USER_ID
      );
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="w-full max-w-lg bg-white/90 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 border border-primary/10 dark:bg-gray-900 dark:border-gray-800">
        <span className="p-4 bg-gradient-to-r from-primary to-primary/80 rounded-full mb-2 shadow-lg">
          <Mail className="w-10 h-10 text-primary-foreground" />
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-primary drop-shadow-lg tracking-tight text-center dark:text-white">Contact Us</h1>
        <p className="text-lg text-muted-foreground mb-4 max-w-xl text-center dark:text-gray-300">
          Have questions or feedback? Fill out the form below and we’ll get back to you soon!
        </p>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              className="pl-10 border-2 border-primary/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary w-full bg-white/80 text-base dark:bg-gray-800 dark:text-white dark:border-gray-700"
              required
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
              className="pl-10 border-2 border-primary/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary w-full bg-white/80 text-base dark:bg-gray-800 dark:text-white dark:border-gray-700"
              required
            />
          </div>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-4 text-primary/60 w-5 h-5" />
            <textarea
              name="message"
              placeholder="Your Message"
              value={form.message}
              onChange={handleChange}
              className="pl-10 border-2 border-primary/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary w-full bg-white/80 text-base dark:bg-gray-800 dark:text-white dark:border-gray-700"
              rows={4}
              required
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/80 transition font-semibold text-lg shadow-md disabled:opacity-60 disabled:cursor-not-allowed dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
            disabled={status === 'sending'}
          >
            <Send className="w-5 h-5" />
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>
          {status === 'success' && (
            <div className="text-green-600 text-center mt-2 font-semibold animate-pulse dark:text-green-400">Thank you for contacting us! Your message has been sent.</div>
          )}
          {status === 'error' && (
            <div className="text-red-600 text-center mt-2 font-semibold dark:text-red-400">Something went wrong. Please try again.</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Contact; 