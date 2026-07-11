"use client";

/* Фото-шапка внутренней страницы — редакционный баннер в стиле главной */
export default function PageHero({ photo, eyebrow, title, sub, children }) {
  return (
    <section
      className={"page-hero" + (photo ? "" : " no-photo")}
      style={photo ? { backgroundImage: `url(${photo})` } : undefined}
    >
      <div className="page-hero-inner">
        {eyebrow ? <span className="page-hero-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {sub ? <p className="page-hero-sub">{sub}</p> : null}
        {children}
      </div>
    </section>
  );
}
