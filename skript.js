// Система управления образовательной платформой
class EducationPlatform {
    constructor() {
        this.init();
    }

    init() {
        // Инициализация данных в localStorage если их нет
        if (!localStorage.getItem('teachers')) {
            localStorage.setItem('teachers', JSON.stringify([]));
        }
        if (!localStorage.getItem('lectures')) {
            localStorage.setItem('lectures', JSON.stringify([]));
        }
        if (!localStorage.getItem('admin')) {
            // Демо администратор
            localStorage.setItem('admin', JSON.stringify({
                username: 'admin',
                password: 'admin123'
            }));
        }

        this.setupEventListeners();
        this.checkAuth();
        this.loadData();
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
            btn.addEventListener('click', (e) => this.handleLogout(e));
        });

        // Поиск и фильтрация для студентов
        if (document.getElementById('searchLectures')) {
            document.getElementById('searchLectures').addEventListener('input', (e) => this.filterLectures());
            document.getElementById('filterTeacher').addEventListener('change', (e) => this.filterLectures());
        }
    }

    checkAuth() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const currentPage = window.location.pathname.split('/').pop();

        // Защита маршрутов
        if (currentPage === 'admin-dashboard.html' && (!currentUser || currentUser.role !== 'admin')) {
            window.location.href = 'admin-login.html';
        }

        if (currentPage === 'teacher-dashboard.html' && (!currentUser || currentUser.role !== 'teacher')) {
            window.location.href = 'teacher-login.html';
        }

        // Отображение имени пользователя
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

        // Проверка на существующего пользователя
        if (teachers.find(t => t.username === username)) {
            this.showAlert('Учитель с таким логином уже существует', 'error');
            return;
        }

        teachers.push({ username, password });
        localStorage.setItem('teachers', JSON.stringify(teachers));
        
        this.loadTeachersList();
        document.getElementById('addTeacherForm').reset();
        this.showAlert('Учитель успешно добавлен', 'success');
    }

    // Загрузка лекции с видео
    handleAddLecture(e) {
        e.preventDefault();
        const title = document.getElementById('lectureTitle').value;
        const description = document.getElementById('lectureDescription').value;
        const videoFile = document.getElementById('videoFile').files[0];
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

        if (!videoFile) {
            this.showAlert('Пожалуйста, выберите видео файл', 'error');
            return;
        }

        // Чтение видео файла как Data URL (в реальном приложении нужно загружать на сервер)
        const reader = new FileReader();
        reader.onload = (e) => {
            const lectures = JSON.parse(localStorage.getItem('lectures'));
            const newLecture = {
                id: Date.now(),
                title,
                description,
                videoUrl: e.target.result,
                teacher: currentUser.username,
                date: new Date().toLocaleDateString('ru-RU'),
                size: videoFile.size
            };

            lectures.push(newLecture);
            localStorage.setItem('lectures', JSON.stringify(lectures));
            
            this.loadLectures();
            document.getElementById('lectureForm').reset();
            this.showAlert('Лекция успешно загружена', 'success');
        };
        reader.readAsDataURL(videoFile);
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
                    <span><strong>${teacher.username}</strong></span>
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
                    <div class="lecture-meta">
                        <small>Дата: ${lecture.date} | Размер: ${this.formatFileSize(lecture.size)}</small>
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
                        <small>Учитель: ${lecture.teacher} | Дата: ${lecture.date}</small>
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
                <div class="video-container">
                    <video controls>
                        <source src="${lecture.videoUrl}" type="video/mp4">
                        Ваш браузер не поддерживает видео тег.
                    </video>
                </div>
                <div class="lecture-info">
                    <h3>${lecture.title}</h3>
                    <div class="teacher-name">Преподаватель: ${lecture.teacher}</div>
                    <p>${lecture.description}</p>
                    <div class="lecture-meta">
                        <small>Дата: ${lecture.date} | Размер: ${this.formatFileSize(lecture.size)}</small>
                    </div>
                </div>
            </div>
        `).join('');
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
            const totalSize = lectures.reduce((sum, lecture) => sum + (lecture.size || 0), 0);
            document.getElementById('storageUsage').textContent = this.formatFileSize(totalSize);
        }
    }

    // Удаление учителя
    deleteTeacher(username) {
        if (confirm(`Вы уверены, что хотите удалить учителя ${username}?`)) {
            const teachers = JSON.parse(localStorage.getItem('teachers'));
            const updatedTeachers = teachers.filter(t => t.username !== username);
            localStorage.setItem('teachers', JSON.stringify(updatedTeachers));
            this.loadTeachersList();
            this.loadStats();
            this.showAlert('Учитель удален', 'success');
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
                <html>
                    <head>
                        <title>${lecture.title}</title>
                        <style>
                            body { margin: 0; padding: 2rem; background: #f5f5f5; }
                            .container { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 10px; }
                            video { width: 100%; border-radius: 8px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>${lecture.title}</h1>
                            <p>${lecture.description}</p>
                            <video controls autoplay>
                                <source src="${lecture.videoUrl}" type="video/mp4">
                                Ваш браузер не поддерживает видео тег.
                            </video>
                            <p><small>Преподаватель: ${lecture.teacher} | Дата: ${lecture.date}</small></p>
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
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Б';
        const k = 1024;
        const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Инициализация платформы
const platform = new EducationPlatform();