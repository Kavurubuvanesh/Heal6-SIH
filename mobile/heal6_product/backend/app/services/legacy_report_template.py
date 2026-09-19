from datetime import datetime, timezone


def generate_ascii_report(patient: dict, scan: dict, facility: dict) -> str:
    """Text-oriented report layout adapted from the supplied Heal6 report template."""
    current_time = datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M:%S UTC')
    report_date = datetime.now(timezone.utc).strftime('%d/%m/%Y')
    return f"""
================================================================================
                              HEAL6 SCREENING REPORT
================================================================================
Patient: {patient.get('name','—')} ({patient.get('age','—')} yrs; {patient.get('gender','—')})
Report Number: {scan.get('report_number','—')}     Assessment ID: {scan.get('assessment_id','—')}
================================================================================
{facility.get('name','Heal6')} 
Report Date: {report_date}

SCREENING SUMMARY
-----------------
Risk Level: {scan.get('risk_level','—')}
SINBAD Score: {scan.get('sinbad_score','—')}/6
AI Classification: {scan.get('ai_classification','—')}
AI Confidence: {scan.get('ai_confidence','—')}%
Infection Risk: {scan.get('infection_risk','—')}%
Wound Area: {scan.get('wound_area','—')} cm²
ArUco: {scan.get('aruco','—')}

SINBAD BREAKDOWN
----------------
Site         : {scan.get('site','—')}
Ischemia     : {scan.get('ischemia','—')}
Neuropathy   : {scan.get('neuropathy','—')}
Bacterial    : {scan.get('bacterial','—')}
Area         : {scan.get('area','—')}
Depth        : {scan.get('depth','—')}

RECOMMENDED ACTION
------------------
{scan.get('recommendation','—')}

================================================================================
Heal6 AI Detection System: {current_time}
================================================================================
"""
