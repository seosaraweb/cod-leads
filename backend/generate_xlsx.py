#!/usr/bin/env python3
import sys
import json
import struct
import zipfile
import io

def generate_xlsx(orders):
    # Each order: [ref, client, phone, address, prix, ville, notes, quartier, produit, valeur]
    headers = ['CODE SUIVI','DESTINATAIRE','TELEPHONE','ADRESSE','PRIX','VILLE','COMMENTAIRE','QUARTIER','PRODUIT','VALEUR DECLAREE']
    col_widths = [26, 23, 18, 18, 11, 20, 36, 9, 30, 19]
    
    # Build shared strings
    strings = []
    def si(s):
        s = str(s) if s is not None else ''
        if s not in strings:
            strings.append(s)
        return strings.index(s)
    
    for h in headers:
        si(h)
    
    rows_data = []
    for o in orders:
        row = [
            o.get('order_ref',''),
            o.get('client_name',''),
            str(o.get('phone','')),
            o.get('address',''),
            o.get('price',0) * o.get('quantity',1),
            o.get('city',''),
            o.get('notes','') or '',
            '',
            o.get('product_name','') + ((' - ' + o['variant_label']) if o.get('variant_label') else '') + ((' x' + str(o['quantity'])) if o.get('quantity',1) > 1 else ''),
            o.get('price',0) * o.get('quantity',1),
        ]
        # Pre-register strings
        for ci, val in enumerate(row):
            if ci not in (4, 9):  # not numeric
                si(str(val))
        rows_data.append(row)
    
    def esc(s):
        return str(s).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')
    
    col_letter = lambda i: chr(65+i) if i < 26 else 'A'+chr(65+i-26)
    
    # Sheet XML
    cols_xml = ''.join(f'<col min="{i+1}" max="{i+1}" width="{w}" customWidth="1"/>' for i,w in enumerate(col_widths))
    
    rows_xml = ''
    # Header row (style 1 = bold)
    rows_xml += '<row r="1">'
    for ci, h in enumerate(headers):
        rows_xml += f'<c r="{col_letter(ci)}1" t="s" s="1"><v>{si(h)}</v></c>'
    rows_xml += '</row>'
    
    for ri, row in enumerate(rows_data):
        r = ri + 2
        rows_xml += f'<row r="{r}">'
        for ci, val in enumerate(row):
            cl = col_letter(ci)
            if ci in (4, 9):
                rows_xml += f'<c r="{cl}{r}"><v>{val}</v></c>'
            else:
                rows_xml += f'<c r="{cl}{r}" t="s"><v>{si(str(val))}</v></c>'
        rows_xml += '</row>'
    
    sheet_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<cols>{cols_xml}</cols>
<sheetData>{rows_xml}</sheetData>
</worksheet>'''
    
    ss_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{n}" uniqueCount="{n}">{items}</sst>'.format(
        n=len(strings),
        items=''.join(f'<si><t xml:space="preserve">{esc(s)}</t></si>' for s in strings)
    )
    
    styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2">
  <font><sz val="10"/><name val="Arial"/></font>
  <font><b/><sz val="10"/><name val="Arial"/></font>
</fonts>
<fills count="2">
  <fill><patternFill patternType="none"/></fill>
  <fill><patternFill patternType="gray125"/></fill>
</fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2">
  <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
</styleSheet>'''
    
    wb_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Colis" sheetId="1" r:id="rId1"/></sheets>
</workbook>'''
    
    wb_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''
    
    ct_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>'''
    
    top_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''
    
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('[Content_Types].xml', ct_xml)
        zf.writestr('_rels/.rels', top_rels)
        zf.writestr('xl/workbook.xml', wb_xml)
        zf.writestr('xl/_rels/workbook.xml.rels', wb_rels)
        zf.writestr('xl/worksheets/sheet1.xml', sheet_xml)
        zf.writestr('xl/sharedStrings.xml', ss_xml)
        zf.writestr('xl/styles.xml', styles_xml)
    
    return buf.getvalue()

if __name__ == '__main__':
    orders = json.loads(sys.argv[1])
    data = generate_xlsx(orders)
    sys.stdout.buffer.write(data)
