import io, json, os, uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Request
from PIL import Image
import numpy as np
from app.db import execute, fetchall, fetchone, profile_dict, init_db
from app.security import current_user
from app.ml_engine.inference import predict_wound
from app.ml_engine.segmentation_inference import predict_wound_mask
from app.ml_engine.calibration import detect_marker_and_calculate_ratio, calculate_real_world_area
from app.services.report_service import build_pdf

router=APIRouter()
BASE_DIR=Path(__file__).resolve().parents[2]
UPLOAD_ROOT=BASE_DIR/'storage'/'uploads'
REPORT_ROOT=BASE_DIR/'storage'/'reports'
UPLOAD_ROOT.mkdir(parents=True,exist_ok=True); REPORT_ROOT.mkdir(parents=True,exist_ok=True)
init_db()

def risk_from_score(score:int):
    if score>=4: return 'High Risk','URGENT_ATTENTION'
    if score>=2: return 'Moderate Risk','ATTENTION_RECOMMENDED'
    return 'Low Risk','LOW_CONCERN'

def field_value(data,key,default=None): return data.get(key,default)

@router.post('/screenings')
async def create_screening(request: Request, image: UploadFile=File(...), patient_identifier: str=Form(...), clinical_data: str=Form(...), latitude: float|None=Form(None), longitude: float|None=Form(None), user_id:int=Depends(current_user)):
    try: clinical=json.loads(clinical_data)
    except Exception: raise HTTPException(400,'clinical_data must be valid JSON')
    if not (image.content_type or '').startswith('image/'): raise HTTPException(400,'Upload a JPEG/PNG image')
    raw=await image.read()
    try: pil=Image.open(io.BytesIO(raw)).convert('RGB')
    except Exception: raise HTTPException(400,'Uploaded file is not a valid image')
    now=datetime.now(timezone.utc); report_number=f"H6-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"; assessment_id=f"ASMT-{uuid.uuid4().hex[:10].upper()}"
    user_dir=UPLOAD_ROOT/str(user_id); user_dir.mkdir(parents=True,exist_ok=True); image_path=user_dir/f"{report_number}.jpg"; pil.save(image_path,format='JPEG',quality=90)
    open_cv=np.array(pil)[:,:,::-1].copy(); warnings=[]
    pixels_per_cm,_,marker_info=detect_marker_and_calculate_ratio(open_cv); aruco_detected=bool(pixels_per_cm and pixels_per_cm>0)
    if not aruco_detected: pixels_per_cm=42.0; warnings.append('ArUco marker was not detected; fallback scale used.')
    try: task1=predict_wound(pil)
    except Exception as e: task1={'prediction':'Model unavailable','confidence':0.0,'is_ulcer':False}; warnings.append(f'ConvNeXt unavailable: {e}')
    try: seg=predict_wound_mask(pil)
    except Exception as e: seg={'mask_pixel_count':0,'coverage_percentage':0.0,'is_wound_detected':False,'tissue_breakdown':{},'mask_image_base64':''}; warnings.append(f'Segmentation unavailable: {e}')
    area=calculate_real_world_area(int(seg.get('mask_pixel_count',0)),float(pixels_per_cm)) if seg.get('mask_pixel_count',0)>0 else 0.0
    ai_prob=float(task1.get('confidence',0))/100.0
    site_pt=1 if clinical.get('site')!='none' else 0; ischemia_pt=1 if clinical.get('ischemia')=='reduced_or_absent' else 0; neuropathy_pt=1 if clinical.get('neuropathy')=='loss_of_sensation' else 0; infection_pt=1 if (clinical.get('bacterialInfection')=='present' or ai_prob>0.5) else 0; area_pt=1 if area>=1 else 0; depth_pt=1 if clinical.get('depth')=='deep_ulcer_or_bone' else 0
    score=sum([site_pt,ischemia_pt,neuropathy_pt,infection_pt,area_pt,depth_pt]); risk,category=risk_from_score(score)
    findings=[task1.get('prediction','Unknown image classification'), f"AI confidence: {task1.get('confidence',0)}%", f"Calculated wound area: {area:.2f} cm²", 'ArUco calibration detected.' if aruco_detected else 'ArUco calibration not detected; fallback scale used.']
    recommendation='Routine monitoring and standard foot-care follow-up.' if score<2 else 'Schedule a clinical review and follow the recommended foot-care plan.' if score<4 else 'Prompt clinical review is recommended based on the combined screening inputs.'
    protocol={'recommendation':recommendation,'actionDeadline':'Clinical follow-up according to local care pathway.','doctorFeedback':'AI output is a screening aid. A qualified clinician should review the image, symptoms and clinical inputs before treatment decisions.','medications':[]}
    profile=profile_dict(user_id) or {}
    payload={'assessmentId':assessment_id,'reportNumber':report_number,'triageCategory':category,'riskLevel':risk,'severityTier':risk,'sinbadBreakdown':{'totalScore':score,'maxPossibleScore':6,'category':category,'siteScore':site_pt,'ischemiaScore':ischemia_pt,'neuropathyScore':neuropathy_pt,'infectionScore':infection_pt,'areaScore':area_pt,'depthScore':depth_pt},'findings':findings,'recommendedActions':[recommendation],'requiresSpecialistEscalation':score>=4,'generatedAt':now.isoformat(),'profile':profile,'aiDiagnostics':{'task1Classification':task1.get('prediction','Unknown'),'convnextConfidence':round(float(task1.get('confidence',0)),1),'infectionRiskPercent':round(ai_prob*100,1),'calculatedAreaCm2':round(area,2),'arucoDetected':aruco_detected,'pixelsPerCm':round(float(pixels_per_cm),1),'coveragePercentage':float(seg.get('coverage_percentage',0)), 'woundDetected':bool(seg.get('is_wound_detected',False)),'tissueBreakdown':seg.get('tissue_breakdown',{}),'maskImageBase64':seg.get('mask_image_base64',''),'modelWarnings':warnings},'clinicalProtocol':protocol,'location':{'latitude':latitude,'longitude':longitude}}
    pdf_path=REPORT_ROOT/f"{report_number}.pdf"; build_pdf(str(pdf_path),payload,str(image_path)); payload['pdfUrl']=str(request.base_url).rstrip('/')+f'/api/v1/reports/{report_number}/pdf-link'
    execute('INSERT INTO reports(user_id,report_number,assessment_id,patient_identifier,generated_at,image_path,latitude,longitude,payload_json) VALUES(?,?,?,?,?,?,?,?,?)',(user_id,report_number,assessment_id,patient_identifier,now.isoformat(),str(image_path),latitude,longitude,json.dumps(payload)))
    return payload

@router.get('/reports')
async def list_reports(user_id:int=Depends(current_user)):
    rows=fetchall('SELECT payload_json FROM reports WHERE user_id=? ORDER BY id DESC',(user_id,)); return [json.loads(r['payload_json']) for r in rows]

@router.get('/reports/{report_number}')
async def get_report(report_number:str,user_id:int=Depends(current_user)):
    row=fetchone('SELECT payload_json FROM reports WHERE report_number=? AND user_id=?',(report_number,user_id))
    if not row: raise HTTPException(404,'Report not found')
    return json.loads(row['payload_json'])

@router.get('/reports/{report_number}/pdf-link')
async def create_pdf_link(request:Request,report_number:str,user_id:int=Depends(current_user)):
    row=fetchone('SELECT 1 FROM reports WHERE report_number=? AND user_id=?',(report_number,user_id))
    if not row: raise HTTPException(404,'Report not found')
    token=uuid.uuid4().hex; exp=datetime.now(timezone.utc)+timedelta(minutes=10); execute('INSERT INTO pdf_tokens(token,report_number,expires_at) VALUES(?,?,?)',(token,report_number,exp.isoformat()))
    return {'url':str(request.base_url).rstrip('/')+f'/api/v1/reports/{report_number}/pdf?token={token}'}

@router.get('/reports/{report_number}/pdf')
async def get_pdf(report_number:str, token:str|None=None):
    if token:
        row=fetchone('SELECT expires_at FROM pdf_tokens WHERE token=? AND report_number=?',(token,report_number))
        if not row: raise HTTPException(401,'Invalid PDF token')
        exp=datetime.fromisoformat(row['expires_at'])
        if exp < datetime.now(timezone.utc): raise HTTPException(401,'PDF token expired')
    else:
        raise HTTPException(401,'PDF token required')
    path=REPORT_ROOT/f'{report_number}.pdf'
    if not path.exists(): raise HTTPException(404,'PDF not found')
    from fastapi.responses import FileResponse
    return FileResponse(str(path),media_type='application/pdf',filename=f'{report_number}.pdf')
