document.addEventListener('DOMContentLoaded', () => {
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzGd8wntn9HiOPb75M-G2j39TNUEdUBYK99300jeCvKYvqbb209DkY5Lms4HHXAch8abw/exec'; // 배포된 웹 앱 URL로 변경하세요.

    const surveyForm = document.getElementById('survey-form');
    const recordsContainer = document.getElementById('records-container');
    const exportButton = document.getElementById('export-excel');
    let recordsCache = [];

    // 데이터 불러오기
    const loadRecords = async () => {
        try {
            const response = await fetch(WEB_APP_URL, { method: 'GET', redirect: 'follow' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            recordsCache = await response.json();

            if (!Array.isArray(recordsCache)) {
                console.error("Google Apps Script에서 잘못된 데이터:", recordsCache);
                throw new Error('데이터 형식이 올바르지 않습니다.');
            }

            // 최신순 정렬 (Timestamp 필드를 사용)
            recordsCache.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

            recordsContainer.innerHTML = '';
            recordsCache.forEach(addRecordToDOM);
        } catch (error) {
            console.error('데이터 불러오기 실패:', error);
            recordsContainer.innerHTML = `<p style="color:red;">데이터를 불러오는 중 오류가 발생했습니다.</p>`;
        }
    };

    // DOM에 한 줄씩 추가
    const addRecordToDOM = (record) => {
        const row = document.createElement('div');
        row.classList.add('record-row');
        row.innerHTML = `
            <div>${record.Grade || '-'}</div>
            <div>${record.Menu || '-'}</div>
            <div>${record.Budget || '-'}</div>
            <div title="${record.Reason || ''}">${record.Reason || '-'}</div>
            <div>${record.Satisfaction || '-'}</div>
        `;
        recordsContainer.appendChild(row);
    };

    // 폼 제출 처리
    surveyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '제출 중...';

        const formData = new FormData(surveyForm);
        const data = {
            grade: formData.get('grade'),
            menu: formData.get('menu'),
            budget: formData.get('budget'),
            reason: formData.get('reason'),
            satisfaction: formData.get('satisfaction')
        };

        try {
            await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // CORS 정책 우회를 위해 'no-cors' 사용 (실제 요청은 잘 전송되나 응답 객체는 불투명해짐)
                cache: 'no-cache',
                redirect: 'follow',
                body: JSON.stringify(data)
            });

            // no-cors 모드에서는 응답을 직접 확인할 수 없으므로, 일단 성공으로 가정하고 처리
            alert('응답이 성공적으로 제출되었습니다!');
            surveyForm.reset();
            loadRecords(); // 데이터 제출 후 목록 새로고침
        } catch (error) {
            console.error('응답 제출 실패:', error);
            alert('제출 중 오류가 발생했습니다.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '제출하기';
        }
    });

    // 엑셀 내보내기
    exportButton.addEventListener('click', () => {
        if (recordsCache.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }

        // Timestamp는 Date 객체로 변환하여 보기 좋게 만듭니다.
        const exportData = recordsCache.map(record => ({
            ...record,
            Timestamp: new Date(record.Timestamp).toLocaleString() // 현지 시간으로 변환
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "밥 메뉴 조사");

        XLSX.writeFile(workbook, "menu_survey_records.xlsx");
    });

    // 페이지 로드 시 데이터 불러오기
    loadRecords();
});