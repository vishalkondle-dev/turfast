import { LoginForm } from "./login-form";
import Link from "next/link";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex relative bg-gradient-to-br from-brand to-accent p-10 text-white flex-col justify-between">
        <div className="absolute inset-0 opacity-25 mix-blend-overlay" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&q=80)", backgroundSize: "cover" }} />
        <Link href="/" className="relative font-extrabold text-2xl">Turfast</Link>
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">Book Your Game.<br />Own Your Time.</h1>
          <p className="mt-3 text-white/85 max-w-sm">Thousands of slots across football, cricket, badminton and more — booked in seconds.</p>
        </div>
        <div className="relative text-white/70 text-sm">© Turfast · Sports Marketplace</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="md:hidden font-extrabold text-2xl block mb-6"><span className="text-brand">Turf</span>ast</Link>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-muted mt-1">Sign in with a one-time code sent to your email.</p>
          <div className="mt-6"><LoginForm /></div>
        </div>
      </div>
    </div>
  );
}
