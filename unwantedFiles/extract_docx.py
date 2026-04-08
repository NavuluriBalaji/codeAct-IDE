import zipfile, xml.etree.ElementTree as ET

def extract(path, out_path):
    with zipfile.ZipFile(path) as d:
        tree = ET.XML(d.read('word/document.xml'))
    
    with open(out_path, 'w', encoding='utf-8') as f:
        for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            t = ''.join(node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text)
            if t:
                f.write(t + '\n')

extract('c:\\AI-Space\\codeAct-IDE\\codeact_architecture.docx', 'c:\\AI-Space\\codeAct-IDE\\codeact_architecture.txt')
