import React from 'react'
import { TemplateProps, getTemplateVars, parseSkills } from './shared'

export function BauhausTemplate({ resume, scale = 1 }: TemplateProps) {
  const { contact, profile, positions, skills, education, projects, repositories, fontSize, lineHeight, fontFamily, sectionCasing, visibleSections } = getTemplateVars(resume)

  const contactItems = contact
    ? [
        contact.email,
        contact.phone,
        contact.location,
        contact.linkedin,
        contact.website,
      ].filter((v): v is string => Boolean(v))
    : []

  const leftHeadingStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase' as React.CSSProperties['textTransform'],
    letterSpacing: '0.1em',
    marginBottom: '3px',
  }

  const rightHeadingStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: sectionCasing as React.CSSProperties['textTransform'],
    letterSpacing: '0.08em',
    marginBottom: '3px',
  }

  // Left column: skills only
  const renderLeftSection = (name: string): React.ReactNode => {
    if (name.toLowerCase() !== 'skills') return null
    return skills.length > 0 ? (
      <section key="skills" style={{ marginTop: '20px' }}>
        <h2 style={leftHeadingStyle}>Skills</h2>
        <div style={{ borderTop: '1px solid #aaa', marginBottom: '6px' }} />
        {skills.map(cat => (
          <div key={cat.id} style={{ marginBottom: '6px' }}>
            <p style={{ fontSize: '9px', fontWeight: 600, color: '#333', marginBottom: '1px' }}>{cat.name}</p>
            <p style={{ fontSize: '9px', color: '#555' }}>{parseSkills(cat.skills).join(', ')}</p>
          </div>
        ))}
      </section>
    ) : null
  }

  // Right column: summary, experience, education, projects, repositories
  const renderRightSection = (name: string): React.ReactNode => {
    switch (name.toLowerCase()) {
      case 'summary':
        return profile?.summary ? (
          <section key="summary" style={{ marginBottom: '14px' }}>
            <h2 style={rightHeadingStyle}>Summary</h2>
            <div style={{ borderTop: '1px solid #ccc', marginBottom: '6px' }} />
            <div style={{ fontSize: '10px' }} dangerouslySetInnerHTML={{ __html: profile.summary }} />
          </section>
        ) : null

      case 'experience':
        return positions.length > 0 ? (
          <section key="experience" style={{ marginBottom: '14px' }}>
            <h2 style={rightHeadingStyle}>Experience</h2>
            <div style={{ borderTop: '1px solid #ccc', marginBottom: '6px' }} />
            {positions.map(pos => (
              <div key={pos.id} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '10px' }}>{pos.company}</strong>
                  <span style={{ fontSize: '9px', color: '#555' }}>{pos.location ?? ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '10px', color: '#333' }}>{pos.title}</span>
                  <span style={{ fontSize: '9px', color: '#555' }}>
                    {pos.startDate} &ndash; {pos.current ? 'Present' : pos.endDate}
                  </span>
                </div>
                <ul style={{ paddingLeft: '14px', margin: 0 }}>
                  {pos.bullets
                    .filter(b => !b.hidden)
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(bullet => (
                      <li
                        key={bullet.id}
                        style={{ fontSize: '10px', marginBottom: '2px' }}
                        dangerouslySetInnerHTML={{ __html: bullet.content }}
                      />
                    ))}
                </ul>
              </div>
            ))}
          </section>
        ) : null

      case 'education':
        return education.length > 0 ? (
          <section key="education" style={{ marginBottom: '14px' }}>
            <h2 style={rightHeadingStyle}>Education</h2>
            <div style={{ borderTop: '1px solid #ccc', marginBottom: '6px' }} />
            {education.map(edu => (
              <div key={edu.id} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '10px' }}>{edu.institution}</strong>
                  <span style={{ fontSize: '9px', color: '#555' }}>
                    {edu.startDate} &ndash; {edu.current ? 'Present' : edu.endDate}
                  </span>
                </div>
                {edu.degree && <p style={{ fontSize: '10px', color: '#333' }}>{edu.degree}</p>}
              </div>
            ))}
          </section>
        ) : null

      case 'projects':
        return projects.length > 0 ? (
          <section key="projects" style={{ marginBottom: '14px' }}>
            <h2 style={rightHeadingStyle}>Projects</h2>
            <div style={{ borderTop: '1px solid #ccc', marginBottom: '6px' }} />
            {projects.map(proj => (
              <div key={proj.id} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '10px' }}>{proj.name}</strong>
                  <span style={{ fontSize: '9px', color: '#555' }}>
                    {proj.startDate} &ndash; {proj.current ? 'Present' : proj.endDate}
                  </span>
                </div>
                {proj.achievements && (
                  <div
                    style={{ fontSize: '10px', color: '#333', marginTop: '2px' }}
                    dangerouslySetInnerHTML={{ __html: proj.achievements }}
                  />
                )}
              </div>
            ))}
          </section>
        ) : null

      case 'repositories':
        return repositories.length > 0 ? (
          <section key="repositories" style={{ marginBottom: '14px' }}>
            <h2 style={rightHeadingStyle}>Repositories</h2>
            <div style={{ borderTop: '1px solid #ccc', marginBottom: '6px' }} />
            {repositories.map(rr => (
              <div key={rr.id} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <a
                    href={rr.repository.url}
                    style={{ fontSize: '10px', fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
                  >
                    {rr.nameOverride ?? rr.repository.name}
                  </a>
                  <span style={{ fontSize: '9px', color: '#555' }}>
                    {[
                      rr.repository.language,
                      rr.repository.stars > 0 ? `★ ${rr.repository.stars}` : null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                </div>
                {(rr.descriptionOverride ?? rr.repository.description) && (
                  <p style={{ fontSize: '10px', color: '#333', marginTop: '2px' }}>
                    {rr.descriptionOverride ?? rr.repository.description}
                  </p>
                )}
              </div>
            ))}
          </section>
        ) : null

      default:
        return null
    }
  }

  return (
    <div
      style={{
        width: '816px',
        minHeight: '1056px',
        padding: '48px 0px',
        fontFamily,
        fontSize,
        color: '#1a1a1a',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        lineHeight,
        backgroundColor: 'white',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      {/* Left column */}
      <div
        style={{
          width: '245px',
          flexShrink: 0,
          padding: '0 24px',
          backgroundColor: '#f8f8f8',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {contact && (
          <div>
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#1a1a1a',
                lineHeight: 1.1,
                wordBreak: 'break-word',
                marginBottom: '12px',
              }}
            >
              {contact.firstName}{'\n'}{contact.lastName}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {contactItems.map((item, i) => (
                <span key={i} style={{ fontSize: '9px', color: '#555' }}>{item}</span>
              ))}
            </div>
          </div>
        )}
        {visibleSections.map(({ name }) => renderLeftSection(name))}
      </div>

      {/* Right column */}
      <div style={{ flex: 1, padding: '0 32px' }}>
        {visibleSections.map(({ name }) => renderRightSection(name))}
      </div>
    </div>
  )
}
