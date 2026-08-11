import sqlite3, numpy as np, pandas as pd
from backend.config import DATABASE_PATH,RISK_WEIGHTS
def analyze():
    with sqlite3.connect(DATABASE_PATH) as c: df=pd.read_sql_query('SELECT * FROM transactions',c)
    df['Transaction_Date']=pd.to_datetime(df.Transaction_Date); df['Amount']=pd.to_numeric(df.Amount)
    key=df.Vendor_ID.astype(str)+'|'+df.Invoice_Number.astype(str)+'|'+df.Amount.round(2).astype(str)+'|'+df.Transaction_Date.astype(str)
    df['Duplicate_Flag']=key.duplicated(False).astype(int); df['High_Value_Flag']=(df.Amount>=500000).astype(int); df['Weekend_Flag']=(df.Transaction_Date.dt.dayofweek>=5).astype(int)
    t=pd.to_datetime(df.Transaction_Time,format='%H:%M:%S',errors='coerce'); df['Hour']=t.dt.hour.fillna(12).astype(int); df['After_Hours_Flag']=((df.Hour>=22)|(df.Hour<6)).astype(int)
    q1,q3=df.Amount.quantile(.25),df.Amount.quantile(.75); upper=q3+1.5*(q3-q1); df['Outlier_Flag']=(df.Amount>upper).astype(int)
    df['Exception_Count']=df[['Duplicate_Flag','High_Value_Flag','Weekend_Flag','After_Hours_Flag','Outlier_Flag']].sum(axis=1)
    df['Risk_Score']=(df.Duplicate_Flag*30+df.High_Value_Flag*25+df.Weekend_Flag*15+df.After_Hours_Flag*20+df.Outlier_Flag*25).clip(0,100)
    df['Risk_Level']=np.select([df.Risk_Score>=60,df.Risk_Score>=30],['High','Medium'],default='Low')
    labels={'Duplicate_Flag':'Potential Duplicate','High_Value_Flag':'High Value','Weekend_Flag':'Weekend Posting','After_Hours_Flag':'After-Hours Posting','Outlier_Flag':'Statistical Outlier'}
    df['Exception_Type']=df.apply(lambda r:', '.join(v for k,v in labels.items() if r[k]) or 'None',axis=1)
    return df
