-- Potential duplicate invoices
SELECT Vendor_ID,Invoice_Number,Amount,Transaction_Date,COUNT(*) duplicate_count FROM transactions GROUP BY Vendor_ID,Invoice_Number,Amount,Transaction_Date HAVING COUNT(*)>1;
-- High value
SELECT * FROM transactions WHERE Amount>=500000 ORDER BY Amount DESC;
-- Weekend
SELECT * FROM transactions WHERE strftime('%w',Transaction_Date) IN ('0','6');
-- After hours
SELECT * FROM transactions WHERE CAST(substr(Transaction_Time,1,2) AS INTEGER)>=22 OR CAST(substr(Transaction_Time,1,2) AS INTEGER)<6;
-- Vendor totals
SELECT Vendor_ID,Vendor_Name,COUNT(*) transaction_count,SUM(Amount) total_amount FROM transactions GROUP BY Vendor_ID,Vendor_Name ORDER BY total_amount DESC;
-- Department totals
SELECT Department,COUNT(*) transaction_count,SUM(Amount) total_amount FROM transactions GROUP BY Department;
-- Monthly totals
SELECT substr(Transaction_Date,1,7) month,COUNT(*) transaction_count,SUM(Amount) total_amount FROM transactions GROUP BY month ORDER BY month;
