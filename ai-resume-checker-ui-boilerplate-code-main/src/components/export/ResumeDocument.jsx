import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";

const themeConfigs = {
  modern: {
    font: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    ink: "#111418",
    inkMuted: "#5C6470",
    accent: "#2F4A3A",
    accentSoft: "#E6EFE8",
    hairline: "#E5E5DF",
    bg: "#FFFFFF",
    headerAlign: "left",
    isCentered: false,
    nameSize: 26,
    sectionSpacing: 18,
  },
  executive: {
    font: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    ink: "#111418",
    inkMuted: "#4B5563",
    accent: "#1B365D",
    accentSoft: "#EBF0F7",
    hairline: "#94A3B8",
    bg: "#FFFFFF",
    headerAlign: "center",
    isCentered: true,
    nameSize: 28,
    sectionSpacing: 16,
  },
  tech: {
    font: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    ink: "#0F172A",
    inkMuted: "#64748B",
    accent: "#0284C7",
    accentSoft: "#F0F9FF",
    hairline: "#E2E8F0",
    bg: "#FFFFFF",
    headerAlign: "left",
    isCentered: false,
    nameSize: 24,
    sectionSpacing: 14,
  },
};

function buildStyles(templateKey = "modern") {
  const cfg = themeConfigs[templateKey] || themeConfigs.modern;

  return StyleSheet.create({
    page: {
      paddingTop: cfg.isCentered ? 48 : 54,
      paddingBottom: 48,
      paddingHorizontal: 52,
      fontSize: 10,
      color: cfg.ink,
      fontFamily: cfg.font,
      backgroundColor: cfg.bg,
      lineHeight: 1.45,
    },

    // header
    headerWrap: {
      marginBottom: cfg.isCentered ? 16 : 20,
      alignItems: cfg.isCentered ? "center" : "flex-start",
    },
    name: {
      fontSize: cfg.nameSize,
      fontFamily: cfg.fontBold,
      letterSpacing: cfg.isCentered ? 0.5 : -0.5,
      color: cfg.ink,
      lineHeight: 1.15,
      marginBottom: 4,
      textAlign: cfg.headerAlign,
    },
    title: {
      fontSize: 11.5,
      fontFamily: cfg.font,
      color: cfg.accent,
      letterSpacing: 0.3,
      lineHeight: 1.3,
      marginBottom: 8,
      textAlign: cfg.headerAlign,
    },
    contactRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: cfg.isCentered ? "center" : "flex-start",
      fontSize: 9.25,
      color: cfg.inkMuted,
      marginTop: 2,
    },
    contactItem: {
      marginRight: 12,
      marginBottom: 3,
    },
    link: {
      color: cfg.accent,
      textDecoration: "none",
    },
    rule: {
      marginTop: 10,
      width: "100%",
      height: cfg.isCentered ? 1.2 : 0.8,
      backgroundColor: cfg.hairline,
    },

    // sections
    section: {
      marginTop: cfg.sectionSpacing,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: cfg.isCentered ? "center" : "flex-start",
      marginBottom: 8,
    },
    sectionHeaderText: {
      fontSize: 9,
      fontFamily: cfg.fontBold,
      letterSpacing: 1.5,
      color: cfg.accent,
      textTransform: "uppercase",
    },
    sectionHeaderLine: {
      flex: 1,
      height: 0.6,
      backgroundColor: cfg.hairline,
      marginLeft: 10,
    },

    // summary
    summary: {
      fontSize: 9.75,
      lineHeight: 1.5,
      color: cfg.ink,
      textAlign: cfg.isCentered ? "justify" : "left",
    },

    // experience
    expItem: {
      marginBottom: 12,
    },
    expHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 1,
    },
    expRole: {
      fontSize: 10.75,
      fontFamily: cfg.fontBold,
      color: cfg.ink,
    },
    expPeriod: {
      fontSize: 9,
      fontFamily: cfg.fontItalic,
      color: cfg.inkMuted,
    },
    expCompanyLine: {
      fontSize: 9.5,
      color: cfg.inkMuted,
      marginBottom: 4,
    },
    expCompany: {
      color: cfg.accent,
      fontFamily: cfg.fontBold,
    },

    // bullets
    bullet: {
      flexDirection: "row",
      marginBottom: 3,
      paddingLeft: 4,
    },
    bulletDot: {
      width: 3.5,
      height: 3.5,
      borderRadius: 2,
      backgroundColor: cfg.accent,
      marginTop: 4.5,
      marginRight: 7,
    },
    bulletText: {
      flex: 1,
      fontSize: 9.5,
      lineHeight: 1.45,
      color: cfg.ink,
    },

    // projects
    projItem: {
      marginBottom: 10,
    },
    projHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      flexWrap: "wrap",
      marginBottom: 2,
    },
    projName: {
      fontSize: 10.25,
      fontFamily: cfg.fontBold,
      color: cfg.ink,
      marginRight: 6,
    },
    projTech: {
      fontSize: 8.75,
      fontFamily: cfg.font,
      color: cfg.accent,
    },
    projDesc: {
      fontSize: 9.25,
      lineHeight: 1.45,
      color: cfg.ink,
    },
    projLinks: {
      flexDirection: "row",
      marginTop: 2,
    },
    projLink: {
      fontSize: 8.75,
      color: cfg.accent,
      textDecoration: "none",
      marginRight: 10,
    },

    // education
    eduItem: {
      marginBottom: 8,
    },
    eduRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    eduDegree: {
      fontSize: 10.25,
      fontFamily: cfg.fontBold,
      color: cfg.ink,
    },
    eduSchool: {
      fontSize: 9.5,
      color: cfg.accent,
      marginTop: 1,
    },
    eduMeta: {
      fontSize: 8.75,
      fontFamily: cfg.fontItalic,
      color: cfg.inkMuted,
    },

    // skills
    skillsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 2,
    },
    skillChip: {
      fontSize: 8.75,
      fontFamily: cfg.font,
      backgroundColor: cfg.accentSoft,
      color: cfg.accent,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 4,
      marginRight: 5,
      marginBottom: 5,
    },

    // certifications
    certItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 4,
      fontSize: 9.5,
    },
    certName: {
      fontFamily: cfg.fontBold,
      color: cfg.ink,
    },
    certMeta: {
      fontSize: 8.75,
      color: cfg.inkMuted,
    },

    // two-column layout
    twoCol: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    colHalf: {
      width: "48%",
    },
    pillLine: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 2,
    },
    pill: {
      fontSize: 8.5,
      backgroundColor: cfg.hairline,
      color: cfg.ink,
      paddingHorizontal: 6,
      paddingVertical: 2.5,
      borderRadius: 4,
      marginRight: 4,
      marginBottom: 4,
    },

    // footer
    footer: {
      position: "absolute",
      bottom: 20,
      left: 52,
      right: 52,
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 8,
      color: cfg.inkMuted,
      paddingTop: 6,
      borderTopWidth: 0.5,
      borderTopColor: cfg.hairline,
    },
  });
}

function SectionHeader({ children, styles, isCentered }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{children}</Text>
      {!isCentered && <View style={styles.sectionHeaderLine} />}
    </View>
  );
}

function Bullet({ children, styles }) {
  return (
    <View style={styles.bullet} wrap={false}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function ContactItem({ children, href, styles }) {
  if (href) {
    return (
      <Link src={href} style={[styles.contactItem, styles.link]}>
        {children}
      </Link>
    );
  }
  return <Text style={styles.contactItem}>{children}</Text>;
}

function shortenUrl(url) {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

export function ResumeDocument({ user, version, title, template = "modern" }) {
  const styles = buildStyles(template);
  const cfg = themeConfigs[template] || themeConfigs.modern;

  const p = version?.parsedSections || {};
  const basics = p.basics || {};

  const displayName = basics.name?.trim() || user?.name || "Your Name";
  const displayEmail = basics.email?.trim() || user?.email || "";

  return (
    <Document title={title || displayName || "Resume"} author={displayName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerWrap}>
          <Text style={styles.name}>{displayName}</Text>
          {basics.title ? (
            <Text style={styles.title}>{basics.title}</Text>
          ) : null}

          <View style={styles.contactRow}>
            {basics.location ? (
              <ContactItem styles={styles}>{basics.location}</ContactItem>
            ) : null}
            {displayEmail ? (
              <ContactItem href={`mailto:${displayEmail}`} styles={styles}>
                {displayEmail}
              </ContactItem>
            ) : null}
            {basics.phone ? (
              <ContactItem styles={styles}>{basics.phone}</ContactItem>
            ) : null}
            {(basics.links || []).map((l, i) => (
              <ContactItem key={i} href={l.url} styles={styles}>
                {l.label || shortenUrl(l.url || "")}
              </ContactItem>
            ))}
          </View>

          <View style={styles.rule} />
        </View>

        {/* Summary */}
        {p.summary ? (
          <View style={styles.section}>
            <SectionHeader styles={styles} isCentered={cfg.isCentered}>
              Summary
            </SectionHeader>
            <Text style={styles.summary}>{p.summary}</Text>
          </View>
        ) : null}

        {/* Experience */}
        {p.experience?.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader styles={styles} isCentered={cfg.isCentered}>
              Experience
            </SectionHeader>
            {p.experience.map((exp, i) => (
              <View key={i} style={styles.expItem} wrap={false}>
                <View style={styles.expHeader}>
                  <Text style={styles.expRole}>{exp.role || "Role"}</Text>
                  {exp.period ? (
                    <Text style={styles.expPeriod}>{exp.period}</Text>
                  ) : null}
                </View>
                {(exp.company || exp.location) && (
                  <Text style={styles.expCompanyLine}>
                    {exp.company ? (
                      <Text style={styles.expCompany}>{exp.company}</Text>
                    ) : null}
                    {exp.company && exp.location ? "  ·  " : ""}
                    {exp.location || ""}
                  </Text>
                )}
                {(exp.bullets || []).map((b, j) => (
                  <Bullet key={j} styles={styles}>
                    {b.replace(/^[-*•]\s*/, "")}
                  </Bullet>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Projects */}
        {p.projects?.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader styles={styles} isCentered={cfg.isCentered}>
              Projects
            </SectionHeader>
            {p.projects.map((proj, i) => (
              <View key={i} style={styles.projItem} wrap={false}>
                <View style={styles.projHeader}>
                  <Text style={styles.projName}>{proj.name}</Text>
                  {proj.tech?.length ? (
                    <Text style={styles.projTech}>{proj.tech.join(" · ")}</Text>
                  ) : null}
                </View>
                {proj.summary || proj.description ? (
                  <Text style={styles.projDesc}>{proj.summary || proj.description}</Text>
                ) : null}
                {proj.links?.length ? (
                  <View style={styles.projLinks}>
                    {proj.links.map((l, j) => (
                      <Link key={j} src={l.url} style={styles.projLink}>
                        {l.label || shortenUrl(l.url || "")}
                      </Link>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Education */}
        {p.education?.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader styles={styles} isCentered={cfg.isCentered}>
              Education
            </SectionHeader>
            {p.education.map((edu, i) => (
              <View key={i} style={styles.eduItem} wrap={false}>
                <View style={styles.eduRow}>
                  <Text style={styles.eduDegree}>{edu.degree}</Text>
                  {edu.period ? (
                    <Text style={styles.eduMeta}>{edu.period}</Text>
                  ) : null}
                </View>
                <Text style={styles.eduSchool}>
                  {edu.school}
                  {edu.location ? ` · ${edu.location}` : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Skills */}
        {p.skills?.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader styles={styles} isCentered={cfg.isCentered}>
              Skills
            </SectionHeader>
            <View style={styles.skillsGrid}>
              {p.skills.map((s, i) => (
                <Text key={i} style={styles.skillChip}>
                  {s}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {/* Certifications */}
        {p.certifications?.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader styles={styles} isCentered={cfg.isCentered}>
              Certifications
            </SectionHeader>
            {p.certifications.map((c, i) => (
              <View key={i} style={styles.certItem} wrap={false}>
                <Text>
                  <Text style={styles.certName}>{c.name}</Text>
                  {c.issuer ? (
                    <Text style={styles.certMeta}> · {c.issuer}</Text>
                  ) : null}
                </Text>
                {c.year ? <Text style={styles.certMeta}>{c.year}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Languages + Interests */}
        {(p.languages?.length > 0 || p.interests?.length > 0) && (
          <View style={[styles.section, styles.twoCol]}>
            {p.languages?.length > 0 && (
              <View style={styles.colHalf}>
                <SectionHeader styles={styles} isCentered={cfg.isCentered}>
                  Languages
                </SectionHeader>
                <View style={styles.pillLine}>
                  {p.languages.map((l, i) => (
                    <Text key={i} style={styles.pill}>
                      {l}
                    </Text>
                  ))}
                </View>
              </View>
            )}
            {p.interests?.length > 0 && (
              <View style={styles.colHalf}>
                <SectionHeader styles={styles} isCentered={cfg.isCentered}>
                  Interests
                </SectionHeader>
                <View style={styles.pillLine}>
                  {p.interests.map((l, i) => (
                    <Text key={i} style={styles.pill}>
                      {l}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>{displayName}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
