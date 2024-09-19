from flask import Flask, request, jsonify
import markdown
import language_tool_python
# إضافة هذا السطر في بداية الملف لاستيراد render_template
from flask import render_template 

app = Flask(__name__)
tool = language_tool_python.LanguageTool('en-US')  # يمكنك تغيير اللغة إذا لزم الأمر

# مسار لتخزين الملاحظات
NOTES_DIR = 'notes'

# إضافة المسار الجديد
@app.route('/')
def index():
    return render_template('index.html')
    
# نقطة نهاية لتحميل الملفات وفحص القواعد
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # حفظ الملف
    file.save(f'{NOTES_DIR}/{file.filename}')

    # قراءة محتوى الملف
    with open(f'{NOTES_DIR}/{file.filename}', 'r') as f:
        content = f.read()

    # فحص القواعد
    matches = tool.check(content)
    errors = [{'message': match.message, 'offset': match.offset, 'length': match.errorLength} for match in matches]

    return jsonify({'errors': errors})

# نقطة نهاية لحفظ الملاحظات كنص Markdown
@app.route('/save', methods=['POST'])
def save_note():
    data = request.get_json()
    if 'filename' not in data or 'content' not in data:
        return jsonify({'error': 'Missing filename or content'}), 400

    with open(f'{NOTES_DIR}/{data["filename"]}', 'w') as f:
        f.write(data['content'])

    return jsonify({'message': 'Note saved successfully'})

# نقطة نهاية لعرض قائمة الملاحظات المحفوظة
@app.route('/notes', methods=['GET'])
def list_notes():
    import os
    notes = os.listdir(NOTES_DIR)
    return jsonify({'notes': notes})

# نقطة نهاية لعرض النسخة المعروضة (HTML) من الملاحظة
@app.route('/render/<filename>', methods=['GET'])
def render_note(filename):
    with open(f'{NOTES_DIR}/{filename}', 'r') as f:
        content = f.read()

    html = markdown.markdown(content)
    return html

if __name__ == '__main__':
    app.run(debug=True)