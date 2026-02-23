interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-dark-card/90 border border-white/10 rounded-2xl p-6 shadow-card backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}
