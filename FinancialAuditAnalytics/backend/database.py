import sqlite3
from backend.config import DATABASE_PATH
def ensure():
    if not DATABASE_PATH.exists():
        from backend.data_generator import generate; generate(10000)
def summary():
    from backend.audit_engine import analyze; d=analyze(); return {'total_transactions':len(d),'total_value':round(float(d.Amount.sum()),2),'average_transaction':round(float(d.Amount.mean()),2),'potential_exceptions':int((d.Exception_Count>0).sum()),'high_risk_transactions':int((d.Risk_Level=='High').sum())}
def exceptions():
    from backend.audit_engine import analyze; d=analyze(); cols={'Duplicate_Flag':'Potential Duplicate','High_Value_Flag':'High Value','Weekend_Flag':'Weekend Posting','After_Hours_Flag':'After-Hours Posting','Outlier_Flag':'Statistical Outlier'}; return {'types':[{'name':v,'count':int(d[k].sum())} for k,v in cols.items()],'risk':[{'name':k,'count':int(v)} for k,v in d.Risk_Level.value_counts().items()]}
def transactions(risk='',department='',search='',limit=200):
    from backend.audit_engine import analyze; d=analyze();
    if risk: d=d[d.Risk_Level.eq(risk)]
    if department: d=d[d.Department.eq(department)]
    if search: d=d[d.apply(lambda r: search.lower() in f"{r.Transaction_ID} {r.Vendor_ID} {r.Vendor_Name}".lower(),axis=1)]
    d=d.sort_values(['Risk_Score','Amount'],ascending=False).head(limit); d.Transaction_Date=d.Transaction_Date.dt.strftime('%Y-%m-%d'); return d.to_dict('records')
def transaction(tid):
    rows=transactions(limit=1000); return next((x for x in rows if x['Transaction_ID']==tid),None)
def departments():
    with sqlite3.connect(DATABASE_PATH) as c: return [x[0] for x in c.execute('SELECT DISTINCT Department FROM transactions ORDER BY Department').fetchall()]
def vendors():
    with sqlite3.connect(DATABASE_PATH) as c: rows=c.execute('SELECT Vendor_ID,Vendor_Name,COUNT(*) c,ROUND(SUM(Amount),2) total FROM transactions GROUP BY Vendor_ID,Vendor_Name ORDER BY total DESC LIMIT 25').fetchall()
    return [{'Vendor_ID':r[0],'Vendor_Name':r[1],'Transaction_Count':r[2],'Total_Amount':r[3]} for r in rows]
def monthly():
    with sqlite3.connect(DATABASE_PATH) as c: rows=c.execute("SELECT substr(Transaction_Date,1,7),COUNT(*),ROUND(SUM(Amount),2) FROM transactions GROUP BY 1 ORDER BY 1").fetchall()
    return [{'month':r[0],'transactions':r[1],'total_value':r[2]} for r in rows]
