from flask import Flask,jsonify,render_template,request
from backend.database import ensure,summary,exceptions,transactions,transaction,departments,vendors,monthly
app=Flask(__name__,template_folder='templates',static_folder='static')
@app.before_request
def boot(): ensure()
@app.get('/')
def home(): return render_template('index.html')
@app.get('/api/health')
def health(): return jsonify(status='ok')
@app.get('/api/summary')
def api_summary(): return jsonify(summary())
@app.get('/api/exceptions')
def api_exceptions(): return jsonify(exceptions())
@app.get('/api/transactions')
def api_transactions(): return jsonify(transactions(request.args.get('risk',''),request.args.get('department',''),request.args.get('search','')))
@app.get('/api/transactions/<tid>')
def api_transaction(tid):
    x=transaction(tid); return (jsonify(x),200) if x else (jsonify(error='Not found'),404)
@app.get('/api/departments')
def api_departments(): return jsonify(departments())
@app.get('/api/vendors')
def api_vendors(): return jsonify(vendors())
@app.get('/api/monthly')
def api_monthly(): return jsonify(monthly())
@app.post('/api/regenerate')
def regenerate():
    from backend.data_generator import generate
    n=max(100,min(int((request.json or {}).get('rows',10000)),200000)); generate(n); return jsonify(message=f'Generated {n:,} transactions')
