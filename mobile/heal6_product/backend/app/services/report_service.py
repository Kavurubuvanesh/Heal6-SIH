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
    if not path: return None
    try:
        im=Image.open(path); im.thumbnail((int(max_w),int(max_h)))
        buf=BytesIO(); im.convert('RGB').save(buf,format='JPEG',quality=88); buf.seek(0)
        return RLImage(buf, width=im.width, height=im.height)
    except Exception: return None

def _base64_img(value: str | None, max_w=16*cm, max_h=9*cm):
    if not value: return None
    try:
        raw=base64.b64decode(value); im=Image.open(BytesIO(raw)); im.thumbnail((int(max_w),int(max_h)))
        buf=BytesIO(); im.save(buf,format='PNG'); buf.seek(0)
        return RLImage(buf, width=im.width, height=im.height)
    except Exception: return None

def build_pdf(output_path: str, report: dict, image_path: str | None):
    doc=SimpleDocTemplate(output_path,pagesize=A4,rightMargin=1.4*cm,leftMargin=1.4*cm,topMargin=1.2*cm,bottomMargin=1.2*cm)
    styles=getSampleStyleSheet(); styles.add(ParagraphStyle(name='HealTitle',parent=styles['Title'],textColor=colors.HexColor('#015B7E'),fontSize=21,leading=25,alignment=TA_CENTER,spaceAfter=8)); styles.add(ParagraphStyle(name='H6',parent=styles['Heading2'],textColor=colors.HexColor('#015B7E'),fontSize=13,leading=16,spaceBefore=8,spaceAfter=5)); styles.add(ParagraphStyle(name='Small',parent=styles['BodyText'],fontSize=8.5,leading=11,textColor=colors.HexColor('#5E7181')))
    story=[Paragraph('Heal6 Screening Report',styles['HealTitle']), Paragraph('Healthy Feet, Brighter Tomorrow',styles['Small']), Spacer(1,5)]
    story += [Paragraph(f"<b>Report Number:</b> {report.get('reportNumber','—')}",styles['BodyText']), Paragraph(f"<b>Assessment ID:</b> {report.get('assessmentId','—')}",styles['BodyText']), Paragraph(f"<b>Generated:</b> {report.get('generatedAt','—')}",styles['BodyText']), Spacer(1,7)]
    profile=report.get('profile') or {}
    story += [Paragraph('Patient profile',styles['H6'])]
    p_rows=[['Name',profile.get('name','—'),'Age',profile.get('age','—')],['Gender',profile.get('gender','—'),'DOB',profile.get('dateOfBirth','—')],['Height',f"{profile.get('heightCm','—')} cm",'Weight',f"{profile.get('weightKg','—')} kg"],['Diabetes type',profile.get('diabetesType','—'),'Duration',f"{profile.get('diabetesDurationYears','—')} years"],['Previous ulcer','Yes' if profile.get('previousUlcer') else 'No','Blood group',profile.get('bloodGroup','—')],['Allergies',profile.get('allergies','—'),'Phone',profile.get('phone','—')]]
    t=Table(p_rows,colWidths=[3.1*cm,5.2*cm,3.1*cm,5.2*cm]); t.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.35,colors.HexColor('#DCEAF0')),('BACKGROUND',(0,0),(0,-1),colors.HexColor('#EEF7FA')),('BACKGROUND',(2,0),(2,-1),colors.HexColor('#EEF7FA')),('FONTNAME',(0,0),(-1,-1),'Helvetica'),('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('FONTNAME',(2,0),(2,-1),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),8.5),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5)])); story += [t]
    story += [Paragraph('Screening summary',styles['H6'])]
    b=report.get('sinbadBreakdown') or {}; d=report.get('aiDiagnostics') or {}
    summary=[['Risk level',report.get('riskLevel') or report.get('severityTier','—')],['SINBAD score',f"{b.get('totalScore','—')}/{b.get('maxPossibleScore',6)}"],['AI classification',d.get('task1Classification','—')],['AI confidence',f"{d.get('convnextConfidence','—')}%"],['Infection risk',f"{d.get('infectionRiskPercent','—')}%"],['Calculated wound area',f"{d.get('calculatedAreaCm2','—')} cm²"],['Wound coverage',f"{d.get('coveragePercentage','—')}%"],['ArUco calibration','Detected' if d.get('arucoDetected') else 'Not detected'],['Scale',f"{d.get('pixelsPerCm','—')} px/cm"]]
    st=Table(summary,colWidths=[6.2*cm,11*cm]); st.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.35,colors.HexColor('#DCEAF0')),('BACKGROUND',(0,0),(0,-1),colors.HexColor('#EEF7FA')),('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),8.5),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5)])); story += [st]
    story += [Paragraph('Captured photograph',styles['H6'])]
    im=_img(image_path,max_w=16*cm,max_h=9*cm)
    if im: story += [im, Spacer(1,5)]
    else: story += [Paragraph('Original image could not be embedded.',styles['Small'])]
    tissue=d.get('tissueBreakdown') or {}
    if tissue:
        story += [Paragraph('Tissue breakdown',styles['H6']), Table([['Granulation','Slough','Necrotic'],[f"{tissue.get('granulation','—')}%",f"{tissue.get('slough','—')}%",f"{tissue.get('necrotic','—')}%"]],colWidths=[5.7*cm]*3,style=TableStyle([('GRID',(0,0),(-1,-1),0.35,colors.HexColor('#DCEAF0')),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#EEF7FA')),('ALIGN',(0,0),(-1,-1),'CENTER'),('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),8.5)]))]
    mask=_base64_img(d.get('maskImageBase64'),max_w=16*cm,max_h=7.5*cm)
    if mask: story += [Paragraph('Segmentation overlay',styles['H6']),mask]
    story += [PageBreak(), Paragraph('SINBAD clinical breakdown',styles['H6'])]
    sinbad_rows=[['Site',b.get('siteScore','—')],['Ischemia',b.get('ischemiaScore','—')],['Neuropathy',b.get('neuropathyScore','—')],['Bacterial infection',b.get('infectionScore','—')],['Area',b.get('areaScore','—')],['Depth',b.get('depthScore','—')]]
    sb=Table(sinbad_rows,colWidths=[10*cm,7.2*cm]); sb.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.35,colors.HexColor('#DCEAF0')),('BACKGROUND',(0,0),(0,-1),colors.HexColor('#EEF7FA')),('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),9)])); story += [sb]
    story += [Paragraph('Findings',styles['H6'])]
    for x in report.get('findings') or []: story.append(Paragraph('• '+str(x),styles['BodyText']))
    protocol=report.get('clinicalProtocol') or {}
    story += [Paragraph('Recommended action',styles['H6']),Paragraph(str(protocol.get('recommendation','—')),styles['BodyText']),Paragraph(f"<b>Action deadline:</b> {protocol.get('actionDeadline','—')}",styles['BodyText']),Paragraph(str(protocol.get('doctorFeedback','')),styles['BodyText'])]
    meds=protocol.get('medications') or []
    if meds:
        story += [Paragraph('Protocol notes supplied by analysis service',styles['H6'])]
        for m in meds: story.append(Paragraph('• '+str(m),styles['BodyText']))
    loc=report.get('location') or {}
    story += [Paragraph('Capture context',styles['H6']),Paragraph(f"Latitude: {loc.get('latitude','—')}   Longitude: {loc.get('longitude','—')}",styles['Small']),Spacer(1,12),Paragraph('This report is generated from screening inputs and AI-assisted analysis. It is intended to support early risk identification and does not replace clinical evaluation.',styles['Small'])]
    doc.build(story)
