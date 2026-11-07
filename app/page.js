import Link from "next/link";
import { FileText, ShieldCheck, UserCheck, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  {
    number: "02",
    title: "Verify Records",
    description: "Check registered property records and their immutable blockchain verification details.",
    href: "/verify",
    linkText: "Verify Property",
    icon: ShieldCheck,
  },
  {
    number: "03",
    title: "Applicant Portal",
    description: "Log in to your secure dashboard to submit and track your verification applications.",
    href: "/login",
    linkText: "Access Portal",
    icon: UserCheck,
  },
  {
    number: "04",
    title: "Staff Administration",
    description: "Authorized staff can review applications and manage the blockchain verification process.",
    href: "/admin/login",
    linkText: "Staff Login",
    icon: ShieldAlert,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900 text-lg font-bold text-white shadow-sm">
              LV
            </div>
            <div>
              <p className="font-bold tracking-tight text-slate-900">
                Land Verification
              </p>
              <p className="text-xs font-medium text-slate-500">
                Secure Registry System
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/verify" className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 sm:inline-block">
              Verify
            </Link>
            <Link href="/login" className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-800 hover:shadow">
              Login
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-900/80"></div>
        
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-200 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-400"></span>
              Digital Property Verification
            </div>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl text-slate-50">
              A more secure way to <span className="text-blue-400">verify land records.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Submit property documents for staff review and verify registered property records through immutable blockchain technology.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-900/30">
                Login <ArrowRight size={18} />
              </Link>
              <Link href="/verify" className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-6 py-3.5 font-semibold text-slate-200 backdrop-blur-sm transition-all hover:bg-slate-700 hover:text-white">
                Verify Property
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2 size={16} className="text-blue-400" /> Applications are subject to staff review.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-2xl backdrop-blur-md sm:p-8 relative">
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-blue-600/20 blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-indigo-600/20 blur-2xl"></div>
            
            <p className="text-sm font-semibold tracking-wide text-blue-400 uppercase">Verification Process</p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              From application to registry
            </h2>
            <div className="mt-8 space-y-6">
              {[
                ["1", "Submit documents", "Provide property details and files via the secure portal."],
                ["2", "Staff review", "Authorized staff carefully review your submitted application."],
                ["3", "Blockchain registration", "Approved properties are permanently registered on Sepolia."],
                ["4", "Public verification", "Anyone can instantly check registered records and transaction details."],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-4 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-sm font-bold text-blue-300 transition-colors group-hover:bg-blue-500/20 group-hover:border-blue-400/50">
                    {number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
            System Services
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Select a portal to continue
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Property applications must be reviewed and approved by authorized personnel before being committed to the blockchain registry.
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.number} href={feature.href} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
              <div className="mt-6 flex items-center font-semibold text-blue-700 group-hover:text-blue-800">
                {feature.linkText} 
                <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-[10px] font-bold text-white">
              LV
            </div>
            <p className="text-sm font-semibold text-slate-900">Land Verification System</p>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} All rights reserved. Built for secure property registry.
          </p>
        </div>
      </footer>
    </main>
  );
}

