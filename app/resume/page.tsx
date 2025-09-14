'use client';

import { resumeParser } from '@/lib/resume-parser';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ResumePage() {
  const [activeSection, setActiveSection] = useState('overview');
  
  const personal = resumeParser.getPersonalInfo();
  const summary = resumeParser.getSummary();
  const experience = resumeParser.getAllExperience();
  const skillCategories = resumeParser.getSkillCategories();
  const accomplishments = resumeParser.getKeyAccomplishments();
  const strengths = resumeParser.getStrengths();
  const education = resumeParser.getEducation();
  const projects = resumeParser.getProjects();

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'experience', label: 'Experience' },
    { id: 'skills', label: 'Technical Skills' },
    { id: 'accomplishments', label: 'Key Accomplishments' },
    { id: 'education', label: 'Education' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/30 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">{personal.name}</h1>
            <p className="text-xl text-primary mb-4">{personal.title}</p>
            <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
              <span className="flex items-center gap-2">
                📍 {personal.location}
              </span>
              <span className="flex items-center gap-2">
                📧 {personal.email}
              </span>
              <span className="flex items-center gap-2">
                🌐 {personal.website}
              </span>
              <span className="flex items-center gap-2">
                📞 {personal.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Sections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sections.map((section) => (
                    <Button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      variant={activeSection === section.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      size="sm"
                    >
                      {section.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeSection === 'overview' && (
              <div className="space-y-8">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Professional Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {summary}
                    </div>
                  </CardContent>
                </Card>

                {/* Strengths */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Core Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      {strengths.map((strength, index) => (
                        <div key={index} className="text-center">
                          <h3 className="text-lg font-semibold text-primary mb-3">{strength.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">{strength.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-primary font-mono">{resumeParser.getYearsOfExperience()}+</div>
                      <div className="text-sm text-muted-foreground">Years Experience</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-primary font-mono">{experience.length}</div>
                      <div className="text-sm text-muted-foreground">Positions</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-primary font-mono">
                        {Object.values(skillCategories).flat().length}
                      </div>
                      <div className="text-sm text-muted-foreground">Technologies</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-primary font-mono">{projects.length}</div>
                      <div className="text-sm text-muted-foreground">Projects</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeSection === 'experience' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground mb-6">Professional Experience</h2>
                {experience.map((exp, index) => (
                  <Card key={exp.id}>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <div>
                          <CardTitle className="text-xl">{exp.title}</CardTitle>
                          <div className="text-lg text-primary">{exp.company}</div>
                          <div className="text-sm text-muted-foreground">{exp.location}</div>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <Badge variant="secondary">
                            {resumeParser.formatDateRange(exp.startDate, exp.endDate)}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{exp.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {exp.achievements.map((achievement, achIndex) => (
                          <li key={achIndex} className="flex items-start gap-3">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-muted-foreground text-sm">{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeSection === 'skills' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground mb-6">Technical Skills</h2>
                {Object.entries(skillCategories).map(([category, skills]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-xl text-primary">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeSection === 'accomplishments' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground mb-6">Key Accomplishments</h2>
                {accomplishments.map((accomplishment, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-xl text-primary">{accomplishment.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{accomplishment.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeSection === 'education' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground mb-6">Education & Projects</h2>
                
                {/* Education */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl text-primary">Education</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {education.map((edu, index) => (
                        <div key={index} className="border-l-2 border-primary pl-4">
                          <h4 className="font-semibold text-foreground">{edu.degree}</h4>
                          <p className="text-muted-foreground">{edu.institution}</p>
                          <p className="text-sm text-muted-foreground">{edu.dateRange}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Projects */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl text-primary">Notable Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {projects.map((project, index) => (
                        <Card key={index} className="border-2">
                          <CardHeader>
                            <CardTitle className="text-base">{project.name}</CardTitle>
                            <CardDescription>{project.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Badge variant="outline" className="text-xs">
                              {project.dateRange} • {project.location}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}