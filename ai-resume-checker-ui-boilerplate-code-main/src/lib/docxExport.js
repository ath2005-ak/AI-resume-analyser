import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Packer,
} from "docx";

export function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a styled DOCX resume document.
 * Supports "modern", "executive", and "tech" templates.
 */
export async function downloadResumeDocx({ version, title, template = "modern" }) {
  const sections = version?.parsedSections || {};
  const basics = sections.basics || {};
  const experiences = sections.experience || [];
  const education = sections.education || [];
  const skills = Array.isArray(sections.skills) ? sections.skills : [];
  const projects = sections.projects || [];
  const certifications = sections.certifications || [];

  // Template design tokens (half-points: 24 = 12pt, 36 = 18pt, 48 = 24pt)
  const isExecutive = template === "executive";
  const isTech = template === "tech";

  const font = isExecutive ? "Times New Roman" : isTech ? "Segoe UI" : "Calibri";
  const accentColor = isExecutive ? "1B365D" : isTech ? "0F172A" : "2F4A3A";
  const inkColor = "111418";
  const mutedColor = "5C6470";
  const headerAlignment = isExecutive ? AlignmentType.CENTER : AlignmentType.LEFT;

  const children = [];

  // Helper for Section Heading
  function createSectionHeading(text) {
    return new Paragraph({
      alignment: headerAlignment,
      spacing: { before: 260, after: 120 },
      border: {
        bottom: {
          color: isTech ? "CBD5E1" : accentColor,
          space: 3,
          style: isExecutive ? BorderStyle.SINGLE : BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [
        new TextRun({
          text: isExecutive ? text.toUpperCase() : text,
          bold: true,
          font,
          size: isTech ? 20 : 22,
          color: accentColor,
        }),
      ],
    });
  }

  // 1. Name & Header
  if (basics.name) {
    children.push(
      new Paragraph({
        alignment: headerAlignment,
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({
            text: basics.name,
            bold: true,
            font,
            size: isExecutive ? 46 : isTech ? 40 : 44,
            color: inkColor,
          }),
        ],
      })
    );
  }

  if (basics.title) {
    children.push(
      new Paragraph({
        alignment: headerAlignment,
        spacing: { before: 0, after: 100 },
        children: [
          new TextRun({
            text: basics.title,
            font,
            size: 22,
            bold: !isExecutive,
            italics: isExecutive,
            color: accentColor,
          }),
        ],
      })
    );
  }

  // Contact items
  const contactParts = [
    basics.email,
    basics.phone,
    basics.location,
    ...(basics.links || []).map((l) => l.label || l.url),
  ].filter(Boolean);

  if (contactParts.length) {
    children.push(
      new Paragraph({
        alignment: headerAlignment,
        spacing: { before: 0, after: 200 },
        children: [
          new TextRun({
            text: contactParts.join("  |  "),
            font,
            size: 19,
            color: mutedColor,
          }),
        ],
      })
    );
  }

  // 2. Summary
  if (sections.summary) {
    children.push(createSectionHeading("Professional Summary"));
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [
          new TextRun({
            text: sections.summary,
            font,
            size: 20,
            color: inkColor,
          }),
        ],
      })
    );
  }

  // 3. Experience
  if (experiences.length) {
    children.push(createSectionHeading("Work Experience"));
    for (const exp of experiences) {
      children.push(
        new Paragraph({
          spacing: { before: 140, after: 40 },
          children: [
            new TextRun({
              text: exp.role || "",
              bold: true,
              font,
              size: 21,
              color: inkColor,
            }),
            new TextRun({
              text: exp.company ? `  —  ${exp.company}` : "",
              font,
              bold: isTech,
              size: 20,
              color: accentColor,
            }),
            new TextRun({
              text: exp.period ? `   (${exp.period})` : "",
              font,
              italics: true,
              size: 18,
              color: mutedColor,
            }),
          ],
        })
      );

      if (Array.isArray(exp.bullets)) {
        for (const bullet of exp.bullets) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 30, after: 40 },
              children: [
                new TextRun({
                  text: bullet.replace(/^[-*•]\s*/, ""),
                  font,
                  size: 20,
                  color: inkColor,
                }),
              ],
            })
          );
        }
      }
    }
  }

  // 4. Skills
  if (skills.length) {
    children.push(createSectionHeading("Technical Skills"));
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [
          new TextRun({
            text: skills.join("   •   "),
            font,
            size: 20,
            color: inkColor,
          }),
        ],
      })
    );
  }

  // 5. Education
  if (education.length) {
    children.push(createSectionHeading("Education"));
    for (const edu of education) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: edu.degree || "",
              bold: true,
              font,
              size: 21,
              color: inkColor,
            }),
            new TextRun({
              text: edu.school ? `  —  ${edu.school}` : "",
              font,
              size: 20,
              color: accentColor,
            }),
            new TextRun({
              text: edu.period ? `   (${edu.period})` : "",
              font,
              italics: true,
              size: 18,
              color: mutedColor,
            }),
          ],
        })
      );
    }
  }

  // 6. Projects
  if (projects.length) {
    children.push(createSectionHeading("Key Projects"));
    for (const proj of projects) {
      const techStr = Array.isArray(proj.tech) ? proj.tech.join(", ") : proj.tech || "";
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: proj.name || "",
              bold: true,
              font,
              size: 21,
              color: inkColor,
            }),
            new TextRun({
              text: techStr ? ` [${techStr}]` : "",
              font,
              size: 19,
              color: mutedColor,
            }),
          ],
        })
      );
      if (proj.summary) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 20, after: 40 },
            children: [
              new TextRun({
                text: proj.summary,
                font,
                size: 20,
                color: inkColor,
              }),
            ],
          })
        );
      }
    }
  }

  // 7. Certifications
  if (certifications.length) {
    children.push(createSectionHeading("Certifications"));
    for (const cert of certifications) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: cert.name || "",
              bold: true,
              font,
              size: 20,
              color: inkColor,
            }),
            new TextRun({
              text: cert.year ? ` (${cert.year})` : "",
              font,
              size: 19,
              color: mutedColor,
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 in
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (title || "resume")
    .replace(/[^a-z0-9\-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "_");
  const fileName = `${safeName}_${version?.label || "V1"}_${template}.docx`;
  saveBlob(blob, fileName);
}
