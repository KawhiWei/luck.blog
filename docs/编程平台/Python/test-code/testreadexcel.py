import openpyxl  
import os 
os.getcwd()
# 打开Excel文件  
workbook = openpyxl.load_workbook('F:\\github\\luck\\luck.blog\\docs\\编程平台\\Python\\test-code\\4月12日退款待财务核实.xlsx')  
  
# 获取第一个工作表  
worksheet = workbook['excel导出']  
  
# 读取单元格的值  
cell_value = worksheet['A1'].value  
  
# 遍历行和列  
for row in worksheet.iter_rows(min_row=2, values_only=True):  
    for cell in row:  
        print(cell)