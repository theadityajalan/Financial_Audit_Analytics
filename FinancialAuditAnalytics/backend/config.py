from pathlib import Path
BASE_DIR=Path(__file__).resolve().parent
DATA_DIR=BASE_DIR/'data'
DATABASE_PATH=DATA_DIR/'audit.db'
DATA_DIR.mkdir(exist_ok=True)
RISK_WEIGHTS={'duplicate':30,'high_value':25,'weekend':15,'after_hours':20,'outlier':25}
