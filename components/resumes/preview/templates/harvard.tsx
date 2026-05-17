import React from 'react'
import { TemplateProps, getTemplateVars, parseSkills } from './shared'

export function HarvardTemplate({ resume, scale = 1 }: TemplateProps) {
  const { contact, profile, positions, skills, education, projects, repositories, fontSize, lineHeight, fontFamily, sectionCasing, visibleSections } = getTemplateVars(resume)

  const contactLine = contact
    ? [
        contact.email,
        contact.phone,
        contact.location,
        contact.linkedin,
        contact.website,
      ].filter(Boolean).join(' · ')
    : ''

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: sectionCasing as React.CSSProperties['textTransform'],
    letterSpacing: '0.1em',
    marginBottom: '6px',
    marginTop: '4px',
  }

  const renderSection = (name: string): React.ReactNode => {
    switch (name.toLowerCase()) {
      case 'summary':
        return profile?.summary ? (
          <section key="summary" style={{ marginBottom: '12px' }}>
            <hr style={{ border: 'none', borderTop: '1px solid #333', marginBottom: '4px' }} />
            <h2 style={sectionHeadingStyle}>Summary</h2>
            <div style={{ fontSize: '10px' }} dangerouslySetInnerHTML={{ __html: profile.summary }} />
          </section>
        ) : null

      case 'skills':
        return skills.length > 0 ? (
          <section key="skills" style={{ marginBottom: '12px' }}>
            <hr style={{ border: 'none', borderTop: '1px solid #333', marginBottom: '4px' }} />
            <h2 style={sectionHeadingStyle}>Skills</h2>
            {skills.map(cat => (
              <p key={cat.id} style={{ fontSize: '10px', marginBottom: '2px' }}>
                <strong>{cat.name}:</strong> {parseSkills(cat.skills).join(', ')}
              </p>
            ))}
          </section>
        ) : null

      case 'experience':
        return positions.length > 0 ? (
          <section key="experience" style={{ marginBottom: '12px' }}>
            <hr style={{ border: 'none', borderTop: '1px solid #333', marginBottom: '4px' }} />
            <h2 style={sectionHeadingStyle}>Experience</h2>
            {positions.map(pos => (
              <div key={pos.id} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '10px' }}>{pos.company}</strong>
                  <span style={{ fontSize: '10px', color: '#555' }}>{pos.location ?? ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '10px' }}>{pos.title}</strong>
                  <span style={{ fontSize: '10px', color: '#555' }}>
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
          <section key="education" style={{ marginBottom: '12px' }}>
            <hr style={{ border: 'none', borderTop: '1px solid #333', marginBottom: '4px' }} />
            <h2 style={sectionHeadingStyle}>Education</h2>
            {education.map(edu => (
              <div key={edu.id} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '10px' }}>{edu.institution}</strong>
                  <span style={{ fontSize: '10px', color: '#555' }}>
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
          <section key="projects" style={{ marginBottom: '12px' }}>
            <hr style={{ border: 'none', borderTop: '1px solid #333', marginBottom: '4px' }} />
            <h2 style={sectionHeadingStyle}>Projects</h2>
            {projects.map(proj => (
              <div key={proj.id} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '10px' }}>{proj.name}</strong>
                  <span style={{ fontSize: '10px', color: '#555' }}>
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
          <section key="repositories" style={{ marginBottom: '12px' }}>
            <hr style={{ border: 'none', borderTop: '1px solid #333', marginBottom: '4px' }} />
            <h2 style={sectionHeadingStyle}>Repositories</h2>
            {repositories.map(rr => (
              <div key={rr.id} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <a
                    href={rr.repository.url}
                    style={{ fontSize: '10px', fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
                  >
                    {rr.nameOverride ?? rr.repository.name}
                  </a>
                  <span style={{ fontSize: '10px', color: '#555' }}>
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
        padding: '48px 64px',
        fontFamily,
        fontSize,
        color: '#1a1a1a',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        lineHeight,
        backgroundColor: 'white',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        boxSizing: 'border-box',
      }}
    >
      {contact && (
        <header style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', color: '#1a1a1a' }}>
            {contact.firstName} {contact.lastName}
          </h1>
          <p style={{ fontSize: '10px', color: '#555', letterSpacing: '0.02em' }}>{contactLine}</p>
        </header>
      )}

      {visibleSections.map(({ name }) => renderSection(name))}
    </div>
  )
}
