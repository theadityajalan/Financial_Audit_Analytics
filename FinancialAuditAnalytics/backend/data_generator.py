import argparse, sqlite3
import numpy as np, pandas as pd
from backend.config import DATABASE_PATH
R=np.random.default_rng(42)
def generate(rows=10000):
    rows=max(100,int(rows)); vendors=[f'V{i:03d}' for i in range(1,101)]
    accounts=['Travel Expense','Office Supplies','Software','Consulting','Logistics','Professional Fees','Marketing','Utilities']
    deps=['Finance','Procurement','Operations','IT','HR','Sales']; methods=['Bank Transfer','Card','Cheque','UPI']; types=['Invoice','Payment','Journal','Adjustment']
    dates=pd.Timestamp('2026-01-01')+pd.to_timedelta(R.integers(0,212,rows),unit='D')
    h=R.integers(7,21,rows); m=R.integers(60,size=rows); s=R.integers(60,size=rows)
    amount=np.round(np.exp(R.normal(np.log(18000),.9,rows)),2)
    df=pd.DataFrame({'Transaction_ID':[f'TXN{i:06d}' for i in range(1,rows+1)],'Transaction_Date':dates.strftime('%Y-%m-%d'),'Transaction_Time':[f'{a:02d}:{b:02d}:{c:02d}' for a,b,c in zip(h,m,s)],'Vendor_ID':R.choice(vendors,rows),'Account':R.choice(accounts,rows),'Department':R.choice(deps,rows),'Amount':amount,'Invoice_Number':[f'INV{i:07d}' for i in range(1,rows+1)],'Payment_Method':R.choice(methods,rows),'Employee_ID':[f'E{R.integers(1,301):03d}' for _ in range(rows)],'Transaction_Type':R.choice(types,rows,p=[.45,.35,.15,.05])})
    df['Vendor_Name']=df['Vendor_ID'].map({v:f'Vendor {v[1:]}' for v in vendors})
    n=max(20,rows//100)
    for src,tgt in zip(R.choice(df.index,n,replace=False),R.choice(df.index,n,replace=False)):
        if src!=tgt:
            for c in ['Vendor_ID','Vendor_Name','Account','Department','Amount','Invoice_Number']: df.loc[tgt,c]=df.loc[src,c]
    idx=R.choice(df.index,n,replace=False); df.loc[idx,'Amount']=R.integers(500000,2000000,n)
    idx=R.choice(df.index,n,replace=False); df.loc[idx,'Transaction_Time']=R.choice(['22:15:00','23:40:00','00:30:00','02:10:00'],n)
    idx=R.choice(df.index,n,replace=False); df.loc[idx,'Transaction_Date']='2026-08-08'
    idx=R.choice(df.index,n,replace=False); df.loc[idx,'Amount']=R.choice([100000,250000,500000,1000000],n)
    with sqlite3.connect(DATABASE_PATH) as con:
        df.to_sql('transactions',con,if_exists='replace',index=False)
        con.execute('CREATE INDEX IF NOT EXISTS idx_vendor ON transactions(Vendor_ID)')
        con.execute('CREATE INDEX IF NOT EXISTS idx_date ON transactions(Transaction_Date)')
    return len(df)
if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('--rows',type=int,default=10000); a=p.parse_args(); print(f'Generated {generate(a.rows):,} transactions')
