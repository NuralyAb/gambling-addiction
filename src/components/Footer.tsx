export default function Footer() {
  return (
    <footer className="border-t border-dark-border py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
        <p>SafeBet AI — AI-платформа помощи при игровой зависимости</p>
        <p className="mt-1">
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
