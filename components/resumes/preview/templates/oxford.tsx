import React from 'react'
import { TemplateProps, getTemplateVars, parseSkills } from './shared'

export function OxfordTemplate({ resume, scale = 1 }: TemplateProps) {
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
    fontSize: '12px',
    fontWeight: 700,
    textTransform: sectionCasing as React.CSSProperties['textTransform'],
    letterSpacing: '0.02em',
    marginBottom: '4px',
    borderBottom: '2px solid #333',
    paddingBottom: '2px',
  }

  const renderSection = (name: string): React.ReactNode => {
    switch (name.toLowerCase()) {
      case 'summary':
        return profile?.summary ? (
          <section key="summary" style={{ marginBottom: '14px' }}>
            <h2 style={sectionHeadingStyle}>Summary</h2>
            <div style={{ fontSize: '10px', marginTop: '6px' }} dangerouslySetInnerHTML={{ __html: profile.summary }} />
          </section>
        ) : null

      case 'skills':
        return skills.length > 0 ? (
          <section key="skills" style={{ marginBottom: '14px' }}>
            <h2 style={sectionHeadingStyle}>Skills</h2>
            <div style={{ marginTop: '6px' }}>
              {skills.map(cat => (
                <p key={cat.id} style={{ fontSize: '10px', marginBottom: '2px' }}>
                  <strong>{cat.name}:</strong> {parseSkills(cat.skills).join(', ')}
                </p>
              ))}
            </div>
          </section>
        ) : null

      case 'experience':
        return positions.length > 0 ? (
          <section key="experience" style={{ marginBottom: '14px' }}>
            <h2 style={sectionHeadingStyle}>Experience</h2>
            <div style={{ marginTop: '6px' }}>
              {positions.map(pos => (
                <div key={pos.id} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '11px' }}>{pos.company}</strong>
                    <span style={{ fontSize: '10px', color: '#555' }}>{pos.location ?? ''}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '10px' }}>{pos.title}</span>
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
            </div>
          </section>
        ) : null

      case 'education':
        return education.length > 0 ? (
          <section key="education" style={{ marginBottom: '14px' }}>
            <h2 style={sectionHeadingStyle}>Education</h2>
            <div style={{ marginTop: '6px' }}>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '11px' }}>{edu.institution}</strong>
                    <span style={{ fontSize: '10px', color: '#555' }}>
                      {edu.startDate} &ndash; {edu.current ? 'Present' : edu.endDate}
                    </span>
                  </div>
                  {edu.degree && <p style={{ fontSize: '10px', color: '#333' }}>{edu.degree}</p>}
                </div>
              ))}
            </div>
          </section>
        ) : null

      case 'projects':
        return projects.length > 0 ? (
          <section key="projects" style={{ marginBottom: '14px' }}>
            <h2 style={sectionHeadingStyle}>Projects</h2>
            <div style={{ marginTop: '6px' }}>
              {projects.map(proj => (
                <div key={proj.id} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '11px' }}>{proj.name}</strong>
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
            </div>
          </section>
        ) : null

      case 'repositories':
        return repositories.length > 0 ? (
          <section key="repositories" style={{ marginBottom: '14px' }}>
            <h2 style={sectionHeadingStyle}>Repositories</h2>
            <div style={{ marginTop: '6px' }}>
              {repositories.map(rr => (
                <div key={rr.id} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <a
                      href={rr.repository.url}
                      style={{ fontSize: '11px', fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
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
            </div>
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
        padding: '56px 72px',
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
        <header style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#1a1a1a' }}>
            {contact.firstName} {contact.lastName}
          </h1>
          <hr style={{ border: 'none', borderTop: '1px solid #999', marginBottom: '8px' }} />
          <p style={{ fontSize: '10px', color: '#555' }}>{contactLine}</p>
        </header>
      )}

      {visibleSections.map(({ name }) => renderSection(name))}
    </div>
  )
}
