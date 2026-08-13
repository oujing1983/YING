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
    <div className={`max-w-2xl ${centered ? "mx-auto text-center" : ""} mb-10 md:mb-14`}>
      {eyebrow && (
        <span className="mb-3 inline-block text-[18px] font-semibold leading-[30px] tracking-[0.06em] text-tech-blue md:text-[22px]">
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
