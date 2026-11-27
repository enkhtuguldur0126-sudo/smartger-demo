# Байрны төрлийг Excel-ээр оруулах загвар файл үүсгэнэ: public/templates/unit-types.xlsx
# Ажиллуулах: python3 scripts/make-excel-template.py
from openpyxl import Workbook
from openpyxl.styles import Font
wb = Workbook(); ws = wb.active; ws.title = 'units'
cols = ['block', 'rooms', 'area', 'floors', 'balcony', 'orientation', 'price', 'priceDate', 'status', 'availableCount', 'paymentMn', 'paymentEn']
ws.append(cols)
for c in ws[1]: c.font = Font(bold=True)
ws.append(['A', 2, 58.4, '3-16', 'yes', 'S', 290000000, '2026-11-01', 'available', 22, '30% урьдчилгаа (жишээ)', '30% down payment (example)'])
ws.append(['A', 3, 82.1, '3-16', 'no', 'E', None, None, 'not_on_sale', 0, None, None])
help = wb.create_sheet('help')
for row in [
  ['Багана', 'Тайлбар (зохиомол жишээ)'],
  ['block', 'Блокийн нэр, сонгосон төсөлд байгаа нэртэй яг ижил (жишээ: A)'],
  ['rooms', 'Өрөөний тоо'], ['area', 'Талбай, м²'], ['floors', 'Давхрууд, жишээ: 3-16'],
  ['balcony', 'yes / no'], ['orientation', 'N S E W NE NW SE SW'],
  ['price', 'Нийт үнэ, төгрөг. Хоосон бол "үнэ нийтлээгүй"'], ['priceDate', 'Үнийн огноо ОООО-СС-ӨӨ (үнэ бичсэн бол заавал)'],
  ['status', 'available / reserved / sold / not_on_sale'], ['availableCount', 'Боломжтой байрны тоо'],
  ['paymentMn, paymentEn', 'Төлбөрийн нөхцөл'],
]: help.append(row)
wb.save('public/templates/unit-types.xlsx')
print('ok')
