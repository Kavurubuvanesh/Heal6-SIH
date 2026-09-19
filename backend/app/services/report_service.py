import base64
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, PageBreak
from PIL import Image

def _img(path: str | None, max_w=16*cm, max_h=9*cm):
    if not path:
        return None
    try:
        im = Image.open(path)
        im.thumbnail((int(max_w), int(max_h)))
        buf = BytesIO()
        im.convert('RGB').save(buf, format='JPEG', quality=88)
        buf.seek(0)
        return RLImage(buf, width=im.width, height=im.height)
    except Exception:
        return None

def _base64_img(value: str | None, max_w=16*cm, max_h=9*cm):
    if not value:
        return None
    try:
        # Handle data URLs (data:image/png;base64,...)
        if ',' in value:
            value = value.split(',', 1)[1]
        raw = base64.b64decode(value)
        im = Image.open(BytesIO(raw))
        im.thumbnail((int(max_w), int(max_h)))
        buf = BytesIO()
        im.save(buf, format='PNG')
        buf.seek(0)
        return RLImage(buf, width=im.width, height=im.height)
    except Exception:
        return None

def build_pdf(output_path: str, report: dict, image_path: str | None):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=1.4*cm,
        leftMargin=1.4*cm,
        topMargin=1.2*cm,
        bottomMargin=1.2*cm
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='HealTitle',
        parent=styles['Title'],
        textColor=colors.HexColor('#015B7E'),
        fontSize=21,
        leading=25,
        alignment=TA_CENTER,
        spaceAfter=8
    ))
    styles.add(ParagraphStyle(
        name='H6',
        parent=styles['Heading2'],
        textColor=colors.HexColor('#015B7E'),
        fontSize=13,
        leading=16,
        spaceBefore=8,
        spaceAfter=5
    ))
    styles.add(ParagraphStyle(
        name='Small',
        parent=styles['BodyText'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#5E7181')
    ))

    story = [
        Paragraph('Heal6 Clinical Diagnostic Report', styles['HealTitle']),
        Paragraph('Diabetic Foot Ulcer Early Warning & SINBAD Protocol Analysis', styles['Small']),
        Spacer(1, 6)
    ]
    story += [
        Paragraph(f"<b>Report Identifier:</b> {report.get('reportNumber', '—')}", styles['BodyText']),
        Paragraph(f"<b>Assessment ID:</b> {report.get('assessmentId', '—')}", styles['BodyText']),
        Paragraph(f"<b>Generated At:</b> {report.get('generatedAt', '—')}", styles['BodyText']),
        Spacer(1, 7)
    ]

    profile = report.get('profile') or {}
    story += [Paragraph('Patient Profile & Baseline', styles['H6'])]
    p_rows = [
        ['Name', profile.get('name', '—'), 'Age', str(profile.get('age', '—'))],
        ['Gender', profile.get('gender', '—'), 'DOB', str(profile.get('dateOfBirth', '—'))],
        ['Height', f"{profile.get('heightCm', '—')} cm", 'Weight', f"{profile.get('weightKg', '—')} kg"],
        ['Diabetes Type', str(profile.get('diabetesType', '—')), 'Duration', f"{profile.get('diabetesDurationYears', '—')} years"],
        ['Previous Ulcer', 'Yes' if profile.get('previousUlcer') else 'No', 'Blood Group', str(profile.get('bloodGroup', '—'))],
        ['Allergies', str(profile.get('allergies', '—')), 'Phone', str(profile.get('phone', '—'))]
    ]
    t = Table(p_rows, colWidths=[3.1*cm, 5.2*cm, 3.1*cm, 5.2*cm])
    t.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.35, colors.HexColor('#DCEAF0')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#EEF7FA')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#EEF7FA')),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5)
    ]))
    story += [t]

    story += [Paragraph('Screening Summary & AI Biomarkers', styles['H6'])]
    b = report.get('sinbadBreakdown') or {}
    d = report.get('aiDiagnostics') or {}
    summary = [
        ['Triage Severity', report.get('riskLevel') or report.get('severityTier', '—')],
        ['SINBAD Score', f"{b.get('totalScore', '—')} / {b.get('maxPossibleScore', 6)}"],
        ['Classification', d.get('task1Classification', '—')],
        ['Confidence', f"{d.get('convnextConfidence', '—')}%"],
        ['Infection Probability', f"{d.get('infectionRiskPercent', '—')}%"],
        ['Calculated Wound Area', f"{d.get('calculatedAreaCm2', '—')} cm²"],
        ['Wound Coverage', f"{d.get('coveragePercentage', '—')}%"],
        ['ArUco Spatial Calibration', 'Calibrated (25mm Marker)' if d.get('arucoDetected') else 'Standard Pixel Scale'],
        ['Scale Ratio', f"{d.get('pixelsPerCm', '—')} px/cm"]
    ]
    st = Table(summary, colWidths=[6.2*cm, 11*cm])
    st.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.35, colors.HexColor('#DCEAF0')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#EEF7FA')),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 5)
    ]))
    story += [st]

    story += [Paragraph('Captured Wound Photograph', styles['H6'])]
    im = _img(image_path, max_w=16*cm, max_h=9*cm)
    if im:
        story += [im, Spacer(1, 5)]
    else:
        story += [Paragraph('Captured image could not be embedded.', styles['Small'])]

    tissue = d.get('tissueBreakdown') or {}
    if tissue:
        story += [
            Paragraph('Wound Tissue Composition Breakdown', styles['H6']),
            Table(
                [['Granulation (Healing)', 'Slough (Fibrinous)', 'Necrotic (Eschar)'],
                 [f"{tissue.get('granulation', 0)}%", f"{tissue.get('slough', 0)}%", f"{tissue.get('necrotic', 0)}%"]],
                colWidths=[5.7*cm]*3,
                style=TableStyle([
                    ('GRID', (0,0), (-1,-1), 0.35, colors.HexColor('#DCEAF0')),
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EEF7FA')),
                    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0,0), (-1,-1), 8.5)
                ])
            )
        ]

    mask = _base64_img(d.get('maskImageBase64'), max_w=16*cm, max_h=7.5*cm)
    if mask:
        story += [Paragraph('Deep Learning Segmentation Mask', styles['H6']), mask]

    story += [PageBreak(), Paragraph('SINBAD Clinical Scoring Matrix', styles['H6'])]
    sinbad_rows = [
        ['Site (Forefoot vs Hindfoot)', str(b.get('siteScore', '—'))],
        ['Ischemia (Pedal Pulses / ABI)', str(b.get('ischemiaScore', '—'))],
        ['Neuropathy (10g Monofilament)', str(b.get('neuropathyScore', '—'))],
        ['Bacterial Infection (Clinical / AI)', str(b.get('infectionScore', '—'))],
        ['Area (≥ 1 cm²)', str(b.get('areaScore', '—'))],
        ['Depth (Subcutaneous / Deep / Bone)', str(b.get('depthScore', '—'))]
    ]
    sb = Table(sinbad_rows, colWidths=[10*cm, 7.2*cm])
    sb.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.35, colors.HexColor('#DCEAF0')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#EEF7FA')),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9)
    ]))
    story += [sb]

    story += [Paragraph('Clinical Findings', styles['H6'])]
    for x in report.get('findings') or []:
        story.append(Paragraph('• ' + str(x), styles['BodyText']))

    protocol = report.get('clinicalProtocol') or {}
    story += [
        Paragraph('Recommended Care Protocol & Escalation', styles['H6']),
        Paragraph(f"<b>Care Recommendation:</b> {protocol.get('recommendation', '—')}", styles['BodyText']),
        Paragraph(f"<b>Clinical Deadline:</b> {protocol.get('actionDeadline', '—')}", styles['BodyText']),
        Paragraph(f"<b>Physician Advisory:</b> {protocol.get('doctorFeedback', '')}", styles['BodyText'])
    ]

    loc = report.get('location') or {}
    story += [
        Paragraph('Geographic Telemetry & Context', styles['H6']),
        Paragraph(f"Latitude: {loc.get('latitude', '—')}   Longitude: {loc.get('longitude', '—')}", styles['Small']),
        Spacer(1, 10),
        Paragraph('This automated clinical report was generated by the Heal6 Edge-to-Cloud Diagnostic Engine. It serves as an assistive triage aid and should be correlated with comprehensive physical and clinical evaluation by an accredited medical practitioner.', styles['Small'])
    ]
    doc.build(story)
