// دالة لتحميل الملف وفحص القواعد
function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const errorsDiv = document.getElementById('grammarErrors');
        errorsDiv.innerHTML = ''; 
    
        if (data.errors.length > 0) {
            const errorList = document.createElement('ul'); 
    
            data.errors.forEach(error => {
                const listItem = document.createElement('li');
                listItem.textContent = `${error.message}`; 
    
                // عرض الاقتراحات (إذا كانت متوفرة)
                if (error.replacements && error.replacements.length > 0) {
                    const suggestions = error.replacements.map(r => r.value).join(', ');
                    listItem.textContent += ` - اقتراحات: ${suggestions}`;
                }
    
                errorList.appendChild(listItem);
    
                // تمييز الخطأ في النص (إذا أمكن)
                if (markdownInput.setSelectionRange) {
                    markdownInput.focus();
                    markdownInput.setSelectionRange(error.offset, error.offset + error.length);
                }
            });
    
            errorsDiv.appendChild(errorList);
    
            // إضافة زر للإصلاح التلقائي (إذا كانت المكتبة تدعم ذلك)
            if (data.errors[0].replacements && data.errors[0].replacements.length > 0) {
                const fixButton = document.createElement('button');
                fixButton.textContent = 'إصلاح تلقائي';
                fixButton.onclick = () => {
                    // تطبيق الإصلاحات المقترحة
                    let newContent = content;
                    data.errors.forEach(error => {
                        if (error.replacements && error.replacements.length > 0) {
                            newContent = newContent.slice(0, error.offset) + error.replacements[0].value + newContent.slice(error.offset + error.length);
                        }
                    });
    
                    // عرض النص المصحح للمستخدم
                    markdownInput.value = newContent; 
                    // إعادة فحص القواعد بعد الإصلاح
                    uploadFile(); 
                };
                errorsDiv.appendChild(fixButton);
            }
    
        } else {
            errorsDiv.innerHTML = '<p>لا توجد أخطاء قواعدية</p>';
        }
    });
}

// دالة لحفظ الملاحظة
function saveNote() {
    const filename = document.getElementById('filenameInput').value;
    const content = document.getElementById('markdownInput').value;

    fetch('/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename, content })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        listNotes(); 
    });
}

// دالة لعرض قائمة الملاحظات
function listNotes() {
    fetch('/notes')
    .then(response => response.json())
    .then(data => {
        const notesList = document.getElementById('notesList');
        notesList.innerHTML = '';

        data.notes.forEach(note => {
            const listItem = document.createElement('li');
            listItem.textContent = note;
            listItem.onclick = () => renderNote(note);
            notesList.appendChild(listItem);
        });
    });
}

// دالة لعرض الملاحظة
function renderNote(filename) {
    fetch(`/render/${filename}`)
    .then(response => response.text())
    .then(data => {
        const renderedNote = document.getElementById('renderedNote');
        renderedNote.innerHTML = data;
    });
}

// استدعاء دالة listNotes عند تحميل الصفحة
listNotes();
