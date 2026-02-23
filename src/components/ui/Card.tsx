interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-dark-card border border-dark-border rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}
