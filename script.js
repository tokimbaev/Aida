// Система управления образовательной платформой
class EducationPlatform {
    constructor() {
        this.init();
    }

    init() {
        this.initializeStorage();
        this.setupEventListeners();
        this.checkAuth();
        this.loadData();
        this.setupStorageSync();
    }

    initializeStorage() {
        // Инициализация данных в localStorage если их нет
        if (!localStorage.getItem('teachers')) {
            const demoTeachers = [
                { username: 'teacher1', password: 'pass1' },
                { username: 'teacher2', password: 'pass2' },
                { username: 'math_teacher', password: 'math123' }
            ];
            localStorage.setItem('teachers', JSON.stringify(demoTeachers));
        }
        
        if (!localStorage.getItem('lectures')) {
            localStorage.setItem('lectures', JSON.stringify([]));
            this.createDemoLectures();
        }
        
        if (!localStorage.getItem('admin')) {
            localStorage.setItem('admin', JSON.stringify({
                username: 'admin',
                password: 'admin123'
            }));
        }
    }

    setupStorageSync() {
        // Синхронизация данных между вкладками
        window.addEventListener('storage', (e) => {
            if (e.key === 'teachers' || e.key === 'lectures') {
                this.loadData();
            }
        });
    }

    createDemoLectures() {
        const demoLectures = [
            {
                id: Date.now(),
                title: 'Введение в математический анализ',
                description: 'Основные понятия и методы математического анализа. Пределы, производные, интегралы.',
                youtubeUrl: 'https://www.youtube.com/embed/9QekdhW27eE',
                teacher: 'math_teacher',
                date: new Date().toLocaleDateString('ru-RU'),
                documents: [
                    { name: 'Презентация.pdf', type: 'pdf', url: '#', size: 2500000 },
                    { name: 'Задачи.docx', type: 'doc', url: '#', size: 150000 }
                ]
            },
            {
                id: Date.now() + 1,
                title: 'Основы программирования на Python',
                description: 'Первые шаги в программировании. Синтаксис, переменные, основные конструкции.',
                youtubeUrl: 'https://www.youtube.com/embed/_uQrJ0TkZlc',
                teacher: 'teacher1',
                date: new Date().toLocaleDateString('ru-RU'),
                documents: [
                    { name: 'Конспект.pdf', type: 'pdf', url: '#', size: 1800000 },
                    { name: 'Примеры кода.py', type: 'doc', url: '#', size: 50000 }
                ]
            },
            {
                id: Date.now() + 2,
                title: 'История Древнего Рима',
                description: 'От основания города до падения империи. Культура, политика, военное дело.',
                youtubeUrl: 'https://www.youtube.com/embed/46ZXl-V4qwY',
                teacher: 'teacher2',
                date: new Date().toLocaleDateString('ru-RU'),
                documents: [
                    { name: 'Презентация.pptx', type: 'ppt', url: '#', size: 3200000 },
                    { name: 'Хронология.jpg', type: 'image', url: '#', size: 800000 }
                ]
            }
        ];
        localStorage.setItem('lectures', JSON.stringify(demoLectures));
    }

    setupEventListeners() {
        // Обработчики форм входа
        if (document.getElementById('adminLoginForm')) {
            document.getElementById('adminLoginForm').addEventListener('submit', (e) => this.handleAdminLogin(e));
        }
        
        if (document.getElementById('teacherLoginForm')) {
            document.getElementById('teacherLoginForm').addEventListener('submit', (e) => this.handleTeacherLogin(e));
        }

        // Обработчики панели администратора
        if (document.getElementById('addTeacherForm')) {
            document.getElementById('addTeacherForm').addEventListener('submit', (e) => this.handleAddTeacher(e));
        }

        // Обработчики панели учителя
        if (document.getElementById('lectureForm')) {
            document.getElementById('lectureForm').addEventListener('submit', (e) => this.handleAddLecture(e));
        }

        // Обработчики выхода
        const logoutBtns = document.querySelectorAll('#logoutBtn');
        logoutBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', (e) => this.handleLogout(e));
            }
        });

        // Поиск и фильтрация для студентов
        if (document.getElementById('searchLectures')) {
            document.getElementById('searchLectures').addEventListener('input', (e) => this.filterLectures());
        }
        
        if (document.getElementById('filterTeacher')) {
            document.getElementById('filterTeacher').addEventListener('change', (e) => this.filterLectures());
        }

        // Модальное окно
        this.setupModal();
    }

    setupModal() {
        const modal = document.getElementById('documentsModal');
        if (!modal) return;

        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    checkAuth() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const currentPage = window.location.pathname.split('/').pop();

        if (currentPage === 'admin-dashboard.html' && (!currentUser || currentUser.role !== 'admin')) {
            window.location.href = 'admin-login.html';
            return;
        }

        if (currentPage === 'teacher-dashboard.html' && (!currentUser || currentUser.role !== 'teacher')) {
            window.location.href = 'teacher-login.html';
            return;
        }

        if (currentUser && document.getElementById('teacherName')) {
            document.getElementById('teacherName').textContent = currentUser.username;
        }
    }

    loadData() {
        this.loadTeachersList();
        this.loadLectures();
        this.loadStats();
        this.loadStudentLectures();
    }

    // Аутентификация администратора
    handleAdminLogin(e) {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const admin = JSON.parse(localStorage.getItem('admin'));

        if (username === admin.username && password === admin.password) {
            localStorage.setItem('currentUser', JSON.stringify({
                username: username,
                role: 'admin'
            }));
            window.location.href = 'admin-dashboard.html';
        } else {
            this.showAlert('Неверный логин или пароль', 'error');
        }
    }

    // Аутентификация учителя
    handleTeacherLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const teachers = JSON.parse(localStorage.getItem('teachers'));

        const teacher = teachers.find(t => t.username === username && t.password === password);
        
        if (teacher) {
            localStorage.setItem('currentUser', JSON.stringify({
                username: username,
                role: 'teacher'
            }));
            window.location.href = 'teacher-dashboard.html';
        } else {
            this.showAlert('Неверный логин или пароль', 'error');
        }
    }

    // Добавление нового учителя
    handleAddTeacher(e) {
        e.preventDefault();
        const username = document.getElementById('teacherUsername').value;
        const password = document.getElementById('teacherPassword').value;
        const teachers = JSON.parse(localStorage.getItem('teachers'));

        if (teachers.find(t => t.username === username)) {
            this.showAlert('Учитель с таким логином уже существует', 'error');
            return;
        }

        teachers.push({ username, password });
        localStorage.setItem('teachers', JSON.stringify(teachers));
        
        this.loadTeachersList();
        this.loadStats();
        document.getElementById('addTeacherForm').reset();
        this.showAlert('Учитель успешно добавлен', 'success');
    }

    // Загрузка лекции с YouTube и документами
    handleAddLecture(e) {
        e.preventDefault();
        const title = document.getElementById('lectureTitle').value;
        const description = document.getElementById('lectureDescription').value;
        const youtubeUrl = document.getElementById('youtubeUrl').value;
        const filesInput = document.getElementById('lectureFiles');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

        // Валидация YouTube ссылки
        const youtubeEmbedUrl = this.convertToEmbedUrl(youtubeUrl);
        if (!youtubeEmbedUrl) {
            this.showAlert('Пожалуйста, введите корректную ссылку на YouTube видео', 'error');
            return;
        }

        const lectures = JSON.parse(localStorage.getItem('lectures'));
        const newLecture = {
            id: Date.now(),
            title,
            description,
            youtubeUrl: youtubeEmbedUrl,
            teacher: currentUser.username,
            date: new Date().toLocaleDateString('ru-RU'),
            documents: []
        };

        // Обработка загруженных файлов
        if (filesInput.files.length > 0) {
            this.processFiles(filesInput.files, newLecture);
        }

        lectures.push(newLecture);
        localStorage.setItem('lectures', JSON.stringify(lectures));
        
        this.finalizeLectureUpload(newLecture);
    }

    // Конвертация YouTube ссылки в embed формат
    convertToEmbedUrl(url) {
        try {
            // Обычная ссылка: https://www.youtube.com/watch?v=VIDEO_ID
            const watchRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/;
            // Короткая ссылка: https://youtu.be/VIDEO_ID
            const shortRegex = /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/;
            // Embed ссылка: https://www.youtube.com/embed/VIDEO_ID
            const embedRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/;

            let videoId = null;

            if (watchRegex.test(url)) {
                videoId = url.match(watchRegex)[1];
            } else if (shortRegex.test(url)) {
                videoId = url.match(shortRegex)[1];
            } else if (embedRegex.test(url)) {
                videoId = url.match(embedRegex)[1];
            }

            if (videoId) {
                // Убираем дополнительные параметры
                const cleanVideoId = videoId.split('&')[0];
                return `https://www.youtube.com/embed/${cleanVideoId}`;
            }
        } catch (error) {
            console.error('Error converting YouTube URL:', error);
        }

        return null;
    }

    // Обработка загруженных файлов
    processFiles(files, lecture) {
        for (let file of files) {
            const fileData = {
                name: file.name,
                type: this.getFileType(file.name),
                size: file.size,
                url: URL.createObjectURL(file)
            };
            lecture.documents.push(fileData);
        }
    }

    // Определение типа файла по расширению
    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
        const docTypes = ['doc', 'docx'];
        const pptTypes = ['ppt', 'pptx'];
        
        if (imageTypes.includes(ext)) return 'image';
        if (docTypes.includes(ext)) return 'doc';
        if (pptTypes.includes(ext)) return 'ppt';
        if (ext === 'pdf') return 'pdf';
        
        return 'file';
    }

    // Завершение загрузки лекции
    finalizeLectureUpload(lecture) {
        this.loadLectures();
        this.loadStats();
        this.loadStudentLectures();
        document.getElementById('lectureForm').reset();
        this.showAlert(`Лекция "${lecture.title}" успешно создана!`, 'success');
    }

    // Загрузка списка учителей
    loadTeachersList() {
        const teachers = JSON.parse(localStorage.getItem('teachers'));
        const teachersList = document.getElementById('teachersList');
        
        if (teachersList) {
            if (teachers.length === 0) {
                teachersList.innerHTML = '<p>Учителя не добавлены</p>';
                return;
            }

            teachersList.innerHTML = teachers.map(teacher => `
                <div class="user-item">
                    <span><strong>${teacher.username}</strong> (пароль: ${teacher.password})</span>
                    <button class="btn btn-small btn-danger" onclick="platform.deleteTeacher('${teacher.username}')">
                        Удалить
                    </button>
                </div>
            `).join('');
        }
    }

    // Загрузка лекций для учителя
    loadLectures() {
        const lectures = JSON.parse(localStorage.getItem('lectures'));
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const lecturesList = document.getElementById('lecturesList');
        const allLecturesList = document.getElementById('allLecturesList');

        // Для панели учителя
        if (lecturesList && currentUser) {
            const teacherLectures = lectures.filter(lecture => lecture.teacher === currentUser.username);
            
            if (teacherLectures.length === 0) {
                lecturesList.innerHTML = '<p>У вас пока нет загруженных лекций</p>';
                return;
            }

            lecturesList.innerHTML = teacherLectures.map(lecture => `
                <div class="lecture-item">
                    <h4>${lecture.title}</h4>
                    <p>${lecture.description}</p>
                    <div class="documents-section">
                        <strong>Материалы (${lecture.documents.length}):</strong>
                        <div class="documents-list">
                            ${lecture.documents.map(doc => `
                                <div class="document-item">
                                    <span class="document-icon">${this.getFileIcon(doc.type)}</span>
                                    ${doc.name}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="lecture-meta">
                        <small>Дата: ${lecture.date} | YouTube видео</small>
                    </div>
                    <div class="lecture-actions">
                        <button class="btn btn-small" onclick="platform.previewLecture(${lecture.id})">
                            Просмотреть
                        </button>
                        <button class="btn btn-small btn-danger" onclick="platform.deleteLecture(${lecture.id})">
                            Удалить
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Для панели администратора
        if (allLecturesList) {
            if (lectures.length === 0) {
                allLecturesList.innerHTML = '<p>Лекции не загружены</p>';
                return;
            }

            allLecturesList.innerHTML = lectures.map(lecture => `
                <div class="lecture-item-admin">
                    <div>
                        <strong>${lecture.title}</strong>
                        <br>
                        <small>Учитель: ${lecture.teacher} | Дата: ${lecture.date} | Материалов: ${lecture.documents.length}</small>
                    </div>
                    <button class="btn btn-small btn-danger" onclick="platform.deleteLecture(${lecture.id})">
                        Удалить
                    </button>
                </div>
            `).join('');
        }
    }

    // Загрузка лекций для студентов
    loadStudentLectures() {
        const lectures = JSON.parse(localStorage.getItem('lectures'));
        const studentLecturesList = document.getElementById('studentLecturesList');
        const filterTeacher = document.getElementById('filterTeacher');

        if (studentLecturesList) {
            if (lectures.length === 0) {
                studentLecturesList.innerHTML = '<p>Лекции пока не добавлены</p>';
                return;
            }

            // Заполнение фильтра учителей
            if (filterTeacher) {
                const teachers = [...new Set(lectures.map(l => l.teacher))];
                filterTeacher.innerHTML = '<option value="">Все учителя</option>' +
                    teachers.map(teacher => `<option value="${teacher}">${teacher}</option>`).join('');
            }

            this.filterLectures();
        }
    }

    // Фильтрация лекций для студентов
    filterLectures() {
        const lectures = JSON.parse(localStorage.getItem('lectures'));
        const searchTerm = document.getElementById('searchLectures')?.value.toLowerCase() || '';
        const selectedTeacher = document.getElementById('filterTeacher')?.value || '';
        const studentLecturesList = document.getElementById('studentLecturesList');

        if (!studentLecturesList) return;

        const filteredLectures = lectures.filter(lecture => {
            const matchesSearch = lecture.title.toLowerCase().includes(searchTerm) || 
                                lecture.description.toLowerCase().includes(searchTerm);
            const matchesTeacher = !selectedTeacher || lecture.teacher === selectedTeacher;
            return matchesSearch && matchesTeacher;
        });

        if (filteredLectures.length === 0) {
            studentLecturesList.innerHTML = '<p>Лекции не найдены</p>';
            return;
        }

        studentLecturesList.innerHTML = filteredLectures.map(lecture => `
            <div class="lecture-card">
                <div class="lecture-header">
                    <h3>${lecture.title}</h3>
                    <div class="teacher-badge">Преподаватель: ${lecture.teacher}</div>
                </div>
                <div class="lecture-body">
                    <div class="youtube-container">
                        <iframe src="${lecture.youtubeUrl}" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                        </iframe>
                    </div>
                </div>
                <div class="lecture-footer">
                    <p>${lecture.description}</p>
                    <div class="documents-section">
                        <strong>Дополнительные материалы:</strong>
                        ${lecture.documents.length > 0 ? `
                            <button class="btn btn-small" onclick="platform.showDocuments(${lecture.id})">
                                Показать материалы (${lecture.documents.length})
                            </button>
                        ` : '<p><small>Материалы не прикреплены</small></p>'}
                    </div>
                    <div class="lecture-meta">
                        <small>Дата добавления: ${lecture.date}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Показать документы лекции
    showDocuments(lectureId) {
        const lectures = JSON.parse(localStorage.getItem('lectures'));
        const lecture = lectures.find(l => l.id === lectureId);
        const modal = document.getElementById('documentsModal');
        const documentsList = document.getElementById('documentsList');

        if (!lecture || !modal || !documentsList) return;

        documentsList.innerHTML = lecture.documents.map(doc => `
            <div class="document-item" style="margin-bottom: 1rem; display: block; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                <span class="document-icon">${this.getFileIcon(doc.type)}</span>
                <strong>${doc.name}</strong>
                <small>(${this.formatFileSize(doc.size)})</small>
                <br>
                <a href="${doc.url}" download="${doc.name}" class="btn btn-small" style="margin-top: 0.5rem;">
                    Скачать
                </a>
            </div>
        `).join('');

        modal.style.display = 'block';
    }

    // Получить иконку для типа файла
    getFileIcon(fileType) {
        const icons = {
            'pdf': '📕',
            'doc': '📄',
            'ppt': '📊',
            'image': '🖼️',
            'file': '📎'
        };
        return icons[fileType] || icons['file'];
    }

    // Загрузка статистики
    loadStats() {
        const teachers = JSON.parse(localStorage.getItem('teachers'));
        const lectures = JSON.parse(localStorage.getItem('lectures'));

        if (document.getElementById('teachersCount')) {
            document.getElementById('teachersCount').textContent = teachers.length;
        }
        if (document.getElementById('lecturesCount')) {
            document.getElementById('lecturesCount').textContent = lectures.length;
        }
        if (document.getElementById('storageUsage')) {
            const totalSize = lectures.reduce((sum, lecture) => 
                sum + lecture.documents.reduce((docSum, doc) => docSum + (doc.size || 0), 0), 0);
            document.getElementById('storageUsage').textContent = this.formatFileSize(totalSize);
        }
    }

    // Удаление учителя
    deleteTeacher(username) {
        if (confirm(`Вы уверены, что хотите удалить учителя ${username}?`)) {
            const teachers = JSON.parse(localStorage.getItem('teachers'));
            const updatedTeachers = teachers.filter(t => t.username !== username);
            
            // Также удаляем лекции этого учителя
            const lectures = JSON.parse(localStorage.getItem('lectures'));
            const updatedLectures = lectures.filter(l => l.teacher !== username);
            
            localStorage.setItem('teachers', JSON.stringify(updatedTeachers));
            localStorage.setItem('lectures', JSON.stringify(updatedLectures));
            
            this.loadTeachersList();
            this.loadLectures();
            this.loadStats();
            this.loadStudentLectures();
            this.showAlert('Учитель и его лекции удалены', 'success');
        }
    }

    // Удаление лекции
    deleteLecture(lectureId) {
        if (confirm('Вы уверены, что хотите удалить эту лекцию?')) {
            const lectures = JSON.parse(localStorage.getItem('lectures'));
            const updatedLectures = lectures.filter(l => l.id !== lectureId);
            localStorage.setItem('lectures', JSON.stringify(updatedLectures));
            
            this.loadLectures();
            this.loadStats();
            this.loadStudentLectures();
            this.showAlert('Лекция удалена', 'success');
        }
    }

    // Просмотр лекции
    previewLecture(lectureId) {
        const lectures = JSON.parse(localStorage.getItem('lectures'));
        const lecture = lectures.find(l => l.id === lectureId);
        
        if (lecture) {
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>${lecture.title}</title>
                        <style>
                            body { 
                                margin: 0; 
                                padding: 2rem; 
                                background: #f5f5f5; 
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            }
                            .container { 
                                max-width: 1000px; 
                                margin: 0 auto; 
                                background: white; 
                                padding: 2rem; 
                                border-radius: 15px;
                                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                            }
                            .youtube-container {
                                position: relative;
                                width: 100%;
                                height: 0;
                                padding-bottom: 56.25%;
                                margin-bottom: 1rem;
                            }
                            .youtube-container iframe {
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                border: none;
                                border-radius: 10px;
                            }
                            h1 { color: #2c3e50; margin-bottom: 1rem; }
                            .teacher { color: #7f8c8d; margin-bottom: 1rem; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>${lecture.title}</h1>
                            <div class="teacher">Преподаватель: ${lecture.teacher}</div>
                            <p>${lecture.description}</p>
                            <div class="youtube-container">
                                <iframe src="${lecture.youtubeUrl}" 
                                        frameborder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowfullscreen>
                                </iframe>
                            </div>
                            <p><small>Дата: ${lecture.date}</small></p>
                        </div>
                    </body>
                </html>
            `);
        }
    }

    // Выход из системы
    handleLogout(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    // Вспомогательные функции
    showAlert(message, type = 'error') {
        // Удаляем существующие уведомления
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const container = document.querySelector('.container') || document.body;
        if (container.firstChild) {
            container.insertBefore(alertDiv, container.firstChild);
        } else {
            container.appendChild(alertDiv);
        }
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 Б';
        const k = 1024;
        const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Инициализация платформы при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    window.platform = new EducationPlatform();
});