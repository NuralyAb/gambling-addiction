import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-dark-border py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>SafeBet AI — AI-платформа помощи при игровой зависимости</p>
          <div className="flex items-center gap-4">
            <Link href="/about-ai" className="hover:text-slate-300 transition-colors">AI-технологии</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Конфиденциальность</Link>
          </div>
        </div>
        <p className="text-center text-sm text-slate-500 mt-3">
          Если вам нужна срочная помощь, позвоните на горячую линию:{" "}
          <a href="tel:88002000122" className="text-accent hover:underline">
            8-800-2000-122
          </a>{" "}
          (бесплатно, круглосуточно)
        </p>
      </div>
    </footer>
  );
}
