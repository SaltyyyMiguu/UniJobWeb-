import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            
            # The namespace for WordprocessingML
            WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
            PARA = WORD_NAMESPACE + 'p'
            TEXT = WORD_NAMESPACE + 't'
            
            texts = []
            for node in tree.iter(TEXT):
                if node.text:
                    texts.append(node.text)
            
            return '\n'.join(texts)
    except Exception as e:
        return str(e)

if __name__ == '__main__':
    print(extract_text_from_docx('c:/Users/lingc/Downloads/FYP/Final_Year_Project_IP1_1002473193 (1).docx'))
