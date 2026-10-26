CREATE TABLE transactions (Transaction_ID TEXT PRIMARY KEY, 
  Transaction_Date DATE, 
  Transaction_Time TIME, 
  Vendor_ID TEXT, 
  Vendor_Name TEXT, 
  Account TEXT, 
  Department TEXT, 
  Amount REAL, 
  Invoice_Number TEXT, 
  Payment_Method TEXT, 
  Employee_ID TEXT, 
  Transaction_Type TEXT);
CREATE INDEX idx_vendor ON transactions(Vendor_ID);
CREATE INDEX idx_date ON transactions(Transaction_Date);
