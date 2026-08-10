interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
}

export default function SectionTitle({
  eyebrow,
  title,
  description,
  centered = true,
}: SectionTitleProps) {
  return (
    <div className={`max-w-2xl ${centered ? "mx-auto text-center" : ""} mb-14 md:mb-18`}>
      {eyebrow && (
        <span className="inline-block text-xs font-semibold text-tech-blue uppercase tracking-widest mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="section-title">{title}</h2>
      {description && (
        <p className="section-subtitle">{description}</p>
      )}
    </div>
  );
}
